<!--
  CpeDashboard.vue
  ─────────────────
  The Surveillant's main view. Provides two sections:

    1. Review queue  — filterable list of all parent-submitted justifications.
                       The four stat cards at the top double as filter buttons.
                       Each card is rendered by JustificationCard.

    2. Weekly timetable — school-wide schedule across all classes, giving the
                          surveillant visibility into the full week at a glance.

  State management:
    - All justification records are fetched once on mount (paginated).
    - Status filtering is done client-side on the loaded page to avoid
      extra round-trips for a simple toggle.
    - review() updates local state optimistically after the API confirms,
      so the card UI responds instantly without a reload.

  Note: The surveillant's schedule endpoint returns ALL classes (unfiltered),
  unlike the student/parent endpoints which filter by class_id.
-->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getJustifications, reviewJustification, getSchedule } from '../../services/cpe'
import { useSchedule } from '../../composables/useSchedule'
import { todayDayName } from '../../composables/useDate'

import PageHeader        from '../../components/shared/PageHeader.vue'
import StatCard          from '../../components/shared/StatCard.vue'
import LoadingState      from '../../components/shared/LoadingState.vue'
import EmptyState        from '../../components/shared/EmptyState.vue'
import PaginationBar     from '../../components/shared/PaginationBar.vue'
import WeeklyTimetable   from '../../components/timetable/WeeklyTimetable.vue'
import TodayClasses      from '../../components/timetable/TodayClasses.vue'
import JustificationCard from '../../components/justification/JustificationCard.vue'

// ── Justification state ───────────────────────────────────────────────────────
const records   = ref([])
const loading   = ref(true)
const error     = ref('')
const page      = ref(1)
const lastPage  = ref(1)

/**
 * Active status filter. Defaults to 'pending' so the surveillant
 * immediately sees what needs attention on login.
 * @type {Ref<'all'|'pending'|'accepted'|'rejected'>}
 */
const filter    = ref('pending')

/**
 * Tracks which justification ID is currently being reviewed.
 * Used to show a loading state on the correct card while the request is in flight.
 * @type {Ref<number|null>}
 */
const reviewing = ref(null)

// ── Schedule ──────────────────────────────────────────────────────────────────
const sched      = useSchedule(getSchedule)
const today      = todayDayName()
const todaySlots = computed(() => sched.sortedSlots(today))

// ── Derived counts ────────────────────────────────────────────────────────────
// Computed over ALL loaded records (not just the filtered view)
// so the stat cards always show accurate totals regardless of the active filter
const pendingCount  = computed(() => records.value.filter(r => r.status === 'pending').length)
const acceptedCount = computed(() => records.value.filter(r => r.status === 'accepted').length)
const rejectedCount = computed(() => records.value.filter(r => r.status === 'rejected').length)

/**
 * The subset of records shown in the queue after applying the status filter.
 * 'all' bypasses filtering so every record is visible.
 */
const filtered = computed(() =>
  filter.value === 'all'
    ? records.value
    : records.value.filter(r => r.status === filter.value)
)

// ── Data fetching ─────────────────────────────────────────────────────────────

/**
 * Load a page of justification records from the backend.
 * The Surveillant controller returns a raw Laravel paginator
 * (without the ApiResponse wrapper), so we handle both shapes.
 *
 * @param {number} p - 1-based page number
 */
async function load(p = 1) {
  loading.value = true
  error.value   = ''
  try {
    const res  = await getJustifications(p)
    const body = res.data ?? res

    records.value  = body.data         ?? (Array.isArray(body) ? body : [])
    lastPage.value = body.last_page    ?? 1
    page.value     = body.current_page ?? 1
  } catch (e) {
    error.value = e.message || 'Failed to load justifications.'
  } finally {
    loading.value = false
  }
}

/**
 * Accept or reject a justification.
 * We update local state immediately on success so the card reflects
 * the new status without requiring a full page reload.
 *
 * @param {number}                id     - Justification ID
 * @param {'accepted'|'rejected'} status - The surveillant's decision
 */
async function review(id, status) {
  reviewing.value = id
  try {
    await reviewJustification(id, status)

    // Optimistic local update — find the record and patch its status in place
    const rec = records.value.find(r => r.id === id)
    if (rec) {
      rec.status      = status
      rec.reviewed_at = new Date().toISOString()
    }
  } catch (e) {
    alert(e.message || 'Failed to update justification.')
  } finally {
    reviewing.value = null
  }
}

// ── Initialisation ────────────────────────────────────────────────────────────
onMounted(async () => {
  // Fetch justifications and schedule in parallel
  await Promise.all([load(1), sched.load()])
})
</script>

<template>
  <div class="page-root">

    <PageHeader
      eyebrow="Surveillance"
      title="Justification Review"
      subtitle="Review and process absence justifications submitted by parents"
    />
    <div class="rule" />

    <!-- ── Stat cards — also serve as filter toggles ── -->
    <!-- Each card highlights when its filter is active and can be clicked
         to narrow the queue to that status -->
    <div class="stats-grid" v-if="!loading">
      <StatCard
        :num="pendingCount" label="Pending review" color="#b87a00"
        fill-class="stat-bar-fill--pending"
        :pct="records.length ? pendingCount / records.length * 100 : 0"
        :clickable="true" :active="filter === 'pending'"
        @click="filter = 'pending'"
      />
      <StatCard
        :num="acceptedCount" label="Accepted" color="var(--accent)"
        fill-class="stat-bar-fill--accepted"
        :pct="records.length ? acceptedCount / records.length * 100 : 0"
        :clickable="true" :active="filter === 'accepted'"
        @click="filter = 'accepted'"
      />
      <StatCard
        :num="rejectedCount" label="Rejected" color="#b03030"
        fill-class="stat-bar-fill--rejected"
        :pct="records.length ? rejectedCount / records.length * 100 : 0"
        :clickable="true" :active="filter === 'rejected'"
        @click="filter = 'rejected'"
      />
      <StatCard
        :num="records.length" label="Total" color="var(--muted)"
        fill-class="stat-bar-fill--muted"
        :pct="100"
        :clickable="true" :active="filter === 'all'"
        @click="filter = 'all'"
      />
    </div>

    <!-- ── Timetable section ── -->
    <!-- The surveillant sees the full school-wide schedule,
         useful for cross-referencing absence dates with the timetable -->
    <div class="timetable-section">
      <div class="top-row">
        <TodayClasses
          :slots="todaySlots"
          :todayName="today"
          :nextClass="null"
        />
        <div class="timetable-wrap">
          <p class="eyebrow" style="margin-bottom:0.75rem">School-wide Schedule</p>
          <WeeklyTimetable
            :schedule="sched.schedule.value"
            :activeDays="sched.activeDays.value"
            :sortedSlots="sched.sortedSlots"
            :slotStyle="sched.slotStyle"
            :todayName="today"
            :nextClassId="null"
          />
        </div>
      </div>
    </div>

    <!-- ── Review queue ── -->
    <div>
      <p class="eyebrow" style="margin-bottom:0.75rem">
        {{ filter === 'all' ? 'All justifications' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} justifications` }}
      </p>

      <!-- Loading state -->
      <LoadingState v-if="loading" label="Loading justifications…" />

      <!-- Error message -->
      <div v-else-if="error" class="page-error">{{ error }}</div>

      <!-- Empty state — message changes based on active filter -->
      <EmptyState
        v-else-if="!filtered.length"
        :title="filter === 'pending' ? 'No pending justifications' : `No ${filter} justifications`"
        :sub="filter === 'pending' ? 'All caught up — nothing waiting for review.' : 'Switch filter above to see other records.'"
      >
        <template #default>
          <button v-if="filter !== 'all'" class="btn btn-ghost" @click="filter = 'all'">
            Show all
          </button>
        </template>
      </EmptyState>

      <!-- Justification cards -->
      <div v-else class="queue">
        <JustificationCard
          v-for="(rec, i) in filtered"
          :key="rec.id"
          :record="rec"
          :reviewing="reviewing"
          :style="{ animationDelay: `${i * 35}ms` }"
          @review="review"
        />
      </div>

      <!-- Pagination -->
      <PaginationBar
        :page="page"
        :last-page="lastPage"
        @change="load"
      />
    </div>

  </div>
</template>

<style scoped>
/* ── Timetable layout ─────────────────────────────────────────────────────── */
.timetable-section { display: flex; flex-direction: column; gap: 0.75rem; }

.top-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.timetable-wrap { display: flex; flex-direction: column; }

/* ── Queue ────────────────────────────────────────────────────────────────── */
.queue { display: flex; flex-direction: column; gap: 1rem; }

/* ── Error ────────────────────────────────────────────────────────────────── */
.page-error {
  background: rgba(176,48,48,0.06);
  border: 1px solid rgba(176,48,48,0.2);
  border-radius: var(--radius);
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  color: #b03030;
}

@media (max-width: 900px) {
  .top-row { grid-template-columns: 1fr; }
}
</style>
