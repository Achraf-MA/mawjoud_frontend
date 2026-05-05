<!--
  ParentDashboard.vue
  ───────────────────
  The parent role's main view. Provides three sections:

    1. Summary stats  — total present, absent, late, and justified counts
                        across all linked children on the current page
    2. Weekly timetable — the schedule for all of the parent's children's classes
                        (useful for knowing when absences occurred relative to the week)
    3. Per-child attendance — one labelled section per child, each with
                        a table of records and inline Justify buttons

  The Justify button is rendered by ChildAttendanceSection and is hidden
  automatically when a record already has a justification (any status).

  Data flow:
    - Attendance records are fetched on mount and on pagination
    - The schedule is fetched once on mount (no pagination needed)
    - Justification submission is handled by JustificationModal
    - After a successful submission we reload the current page of records
      so the Justify button disappears for the newly justified record
-->

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from '../../stores/auth'
import { useAttendanceHistory } from '../../composables/useAttendance'
import { useSchedule } from '../../composables/useSchedule'
import { getChildAttendances, getSchedule } from '../../services/parent'
import { todayDayName } from '../../composables/useDate'

import PageHeader              from '../../components/shared/PageHeader.vue'
import StatCard                from '../../components/shared/StatCard.vue'
import LoadingState            from '../../components/shared/LoadingState.vue'
import EmptyState              from '../../components/shared/EmptyState.vue'
import PaginationBar           from '../../components/shared/PaginationBar.vue'
import WeeklyTimetable         from '../../components/timetable/WeeklyTimetable.vue'
import TodayClasses            from '../../components/timetable/TodayClasses.vue'
import ChildAttendanceSection  from '../../components/justification/ChildAttendanceSection.vue'
import JustificationModal      from '../../components/justification/JustificationModal.vue'

// ── Auth ──────────────────────────────────────────────────────────────────────
const { user } = storeToRefs(useAuth())

// ── Attendance history ────────────────────────────────────────────────────────
// useAttendanceHistory manages fetching, pagination, and per-page stats
const att = useAttendanceHistory(getChildAttendances)

// ── Schedule ──────────────────────────────────────────────────────────────────
const sched   = useSchedule(getSchedule)
const today   = todayDayName()
const todaySlots = computed(() => sched.sortedSlots(today))

// ── Justification modal ───────────────────────────────────────────────────────
// selectedRecord holds the attendance row the parent clicked "Justify" on
const modal          = ref(false)
const selectedRecord = ref(null)

/**
 * Open the justification modal for a specific absence record.
 * Called by ChildAttendanceSection when the parent clicks "Justify".
 *
 * @param {AttendanceRecord} record
 */
function openJustify(record) {
  selectedRecord.value = record
  modal.value          = true
}

/**
 * After a successful justification submission, reload the current page
 * so the Justify button disappears for the newly processed record.
 */
function onSubmitted() {
  att.load(att.page.value)
}

// ── Derived stats ─────────────────────────────────────────────────────────────
// Count justified records on the current page (any justification status qualifies)
const justifiedCount = computed(() =>
  att.records.value.filter(r => r.justification).length
)

// ── Group records by child name ───────────────────────────────────────────────
// The backend returns records for all linked children in one paginated list.
// We split them into named sections so each child's history is visually distinct.
const byStudent = computed(() => {
  const map = {}
  for (const r of att.records.value) {
    // Use full name as the grouping key — safe unless two siblings share an exact name
    const name = `${r.student?.first_name ?? ''} ${r.student?.last_name ?? ''}`.trim() || 'Unknown'
    if (!map[name]) map[name] = []
    map[name].push(r)
  }
  return map
})

// ── Initialisation ────────────────────────────────────────────────────────────
onMounted(async () => {
  // Fetch attendance and schedule in parallel to minimise wait time
  await Promise.all([att.load(1), sched.load()])
})
</script>

<template>
  <div class="page-root">

    <PageHeader
      eyebrow="Parent Portal"
      title="My Children's Attendance"
      subtitle="Monitor attendance and submit absence justifications"
    />
    <div class="rule" />

    <!-- ── Loading ── -->
    <LoadingState v-if="att.loading.value" label="Loading attendance records…" />

    <!-- ── Error / empty ── -->
    <div v-else-if="!att.records.value.length">
      <EmptyState
        title="No attendance records yet"
        sub="Records will appear here once your child has been registered in a class."
      />
    </div>

    <template v-else>

      <!-- ── Summary stats ── -->
      <!-- One card per status + a justified count to help parents
           track how many absences they have already addressed -->
      <div class="stats-grid">
        <StatCard :num="att.presentCount.value" label="Present"   color="var(--accent)"
          fill-class="stat-bar-fill--present"
          :pct="att.records.value.length ? att.presentCount.value / att.records.value.length * 100 : 0" />
        <StatCard :num="att.absentCount.value"  label="Absent"    color="#b03030"
          fill-class="stat-bar-fill--absent"
          :pct="att.records.value.length ? att.absentCount.value / att.records.value.length * 100 : 0" />
        <StatCard :num="att.lateCount.value"    label="Late"      color="#b87a00"
          fill-class="stat-bar-fill--late"
          :pct="att.records.value.length ? att.lateCount.value / att.records.value.length * 100 : 0" />
        <StatCard :num="justifiedCount"         label="Justified" color="var(--muted)"
          fill-class="stat-bar-fill--muted"
          :pct="att.records.value.length ? justifiedCount / att.records.value.length * 100 : 0" />
      </div>

      <!-- ── Timetable section ── -->
      <!-- Lets parents see the weekly schedule for their children's class,
           which is useful context when reviewing absence dates -->
      <div class="timetable-section">
        <div class="top-row">
          <!-- Today's classes panel -->
          <TodayClasses
            :slots="todaySlots"
            :todayName="today"
            :nextClass="null"
          />
          <!-- Full weekly timetable grid -->
          <div class="timetable-wrap">
            <p class="eyebrow" style="margin-bottom: 0.75rem;">Weekly Schedule</p>
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

      <!-- ── Per-child attendance sections ── -->
      <!-- One section per child. ChildAttendanceSection handles the
           Justify button visibility logic internally. -->
      <ChildAttendanceSection
        v-for="(records, studentName) in byStudent"
        :key="studentName"
        :studentName="studentName"
        :records="records"
        @justify="openJustify"
      />

      <!-- ── Pagination ── -->
      <PaginationBar
        :page="att.page.value"
        :last-page="att.lastPage.value"
        @change="att.load"
      />

    </template>

    <!-- ── Justification modal ── -->
    <!-- Mounted outside the conditional block so its transition plays correctly -->
    <JustificationModal
      :show="modal"
      :record="selectedRecord"
      @close="modal = false"
      @submitted="onSubmitted"
    />

  </div>
</template>

<style scoped>
/* ── Timetable layout ─────────────────────────────────────────────────────── */
/* Today panel on the left, full grid on the right */
.timetable-section { display: flex; flex-direction: column; gap: 0.75rem; }

.top-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.25rem;
  align-items: start;
}

.timetable-wrap { display: flex; flex-direction: column; }

@media (max-width: 900px) {
  .top-row { grid-template-columns: 1fr; }
}
</style>
