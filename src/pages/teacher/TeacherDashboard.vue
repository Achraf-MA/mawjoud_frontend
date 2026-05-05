<!--
  TeacherDashboard.vue
  ────────────────────
  The teacher's main interface. Two sections:

    1. Attendance register — two-column layout:
         Left  → sticky session panel (class/subject selection, live stats, quick actions)
         Right → student roster with P / A / L marking buttons

    2. Weekly work schedule — the teacher's own timetable showing which classes
         and subjects they are assigned to teach each day of the week.

  Key behaviours:
    - Changing subject reloads the marked map filtered by BOTH class_id AND subject_id
      so buttons always reflect the correct session — not cross-subject carry-overs.
    - Unmarked count is derived directly from the students list (not by subtraction)
      to prevent it going negative when stale records exist.
    - Marks are optimistic — UI updates instantly, rolls back on API failure.
    - Late (L) is a first-class status alongside Present (P) and Absent (A).
-->

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getClasses, getSubjectsByClass, getStudentsByClass,
  createAttendance, getAttendance, getTeacherSchedule,
} from '../../services/teacher'
import { useAttendanceStats } from '../../composables/useAttendance'
import { useSchedule } from '../../composables/useSchedule'
import { formatRelative, todayLabel, todayDayName, personInitials } from '../../composables/useDate'

import PageHeader      from '../../components/shared/PageHeader.vue'
import StatusPill      from '../../components/shared/StatusPill.vue'
import EmptyState      from '../../components/shared/EmptyState.vue'
import LoadingState    from '../../components/shared/LoadingState.vue'
import WeeklyTimetable from '../../components/timetable/WeeklyTimetable.vue'
import TodayClasses    from '../../components/timetable/TodayClasses.vue'

// ── Session state ─────────────────────────────────────────────────────────────
const classes         = ref([])
const subjects        = ref([])
const students        = ref([])
const selectedClass   = ref('')
const selectedSubject = ref('')
const loading         = ref(false)

/**
 * Attendance map for the current session.
 * Keyed by student ID → { status, date }.
 * Resets every time the subject changes so P/A/L buttons always
 * reflect the selected subject, not a previous one.
 */
const marked = ref({})

// ── Live stats ────────────────────────────────────────────────────────────────
// useAttendanceStats counts unmarked directly from the students list,
// not by subtraction, to avoid negative values when stale records exist.
const { presentCount, absentCount, lateCount, unmarkedCount, pct } =
  useAttendanceStats(marked, students)

// ── Schedule ──────────────────────────────────────────────────────────────────
const sched      = useSchedule(getTeacherSchedule)
const today      = todayDayName()
const todaySlots = computed(() => sched.sortedSlots(today))

// ── Computed labels ───────────────────────────────────────────────────────────
const selectedClassName = computed(() =>
  classes.value.find(c => String(c.id) === String(selectedClass.value))?.name ?? ''
)
const selectedSubjectName = computed(() =>
  subjects.value.find(s => String(s.id) === String(selectedSubject.value))?.name ?? ''
)

// ── Initialisation ────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    getClasses().then(r => { classes.value = r.data }).catch(console.error),
    sched.load(),
  ])
})

// ── Class selection ───────────────────────────────────────────────────────────

/**
 * Load students and subjects for the selected class in parallel.
 * Resets subject selection and marked map so no stale data bleeds through.
 */
async function onClassChange(id) {
  selectedClass.value   = id
  selectedSubject.value = ''
  marked.value          = {}
  students.value        = []
  subjects.value        = []

  if (!id) return

  loading.value = true
  try {
    const [sr, subr] = await Promise.all([
      getStudentsByClass(id),
      getSubjectsByClass(id),
    ])
    students.value = sr.data
    subjects.value = subr.data
  } catch (e) {
    console.error('[TeacherDashboard] Failed to load class data:', e)
  } finally {
    loading.value = false
  }
}

// ── Subject selection ─────────────────────────────────────────────────────────

/**
 * Reload the marked map filtered by both class_id AND subject_id.
 * This is the key fix for the "buttons stay coloured on subject change" bug —
 * each subject has its own independent attendance records for today.
 */
async function onSubjectChange(id) {
  selectedSubject.value = id
  marked.value          = {}
  if (id) await loadAttendance()
}

// ── Attendance loading ────────────────────────────────────────────────────────

/**
 * Fetch today's attendance for the exact class + subject + date combination.
 * Filtering by subject_id prevents records from other subjects bleeding into
 * the current session's marked map.
 */
async function loadAttendance() {
  if (!selectedClass.value || !selectedSubject.value) return

  const today = new Date().toISOString().slice(0, 10)
  try {
    const res = await getAttendance({
      class_id:   selectedClass.value,
      subject_id: selectedSubject.value,
      date:       today,
    })
    // Build map: one entry per student for today's specific subject session
    marked.value = Object.fromEntries(
      (res.data ?? []).map(a => [a.student.id, { status: a.status, date: a.date }])
    )
  } catch (e) {
    console.error('[TeacherDashboard] Failed to load attendance:', e)
  }
}

// ── Marking ───────────────────────────────────────────────────────────────────

/**
 * Mark a single student optimistically — update local state first,
 * then persist to the backend. Roll back on failure.
 *
 * @param {number}                       studentId
 * @param {'present'|'absent'|'late'}    status
 */
async function mark(studentId, status) {
  if (!selectedClass.value || !selectedSubject.value) return

  const date = new Date().toISOString().slice(0, 10)

  // Optimistic update
  marked.value = { ...marked.value, [studentId]: { status, date } }

  try {
    await createAttendance({
      student_id: studentId,
      class_id:   Number(selectedClass.value),
      subject_id: Number(selectedSubject.value),
      date, status,
    })
  } catch (e) {
    console.error('[TeacherDashboard] Failed to save mark — rolling back:', e)
    const rolled = { ...marked.value }
    delete rolled[studentId]
    marked.value = rolled
  }
}

/**
 * Mark all students present in parallel, then confirm with a single reload.
 */
async function markAll() {
  if (!selectedClass.value || !selectedSubject.value) return

  const date = new Date().toISOString().slice(0, 10)
  await Promise.all(
    students.value.map(s => createAttendance({
      student_id: s.id,
      class_id:   Number(selectedClass.value),
      subject_id: Number(selectedSubject.value),
      date, status: 'present',
    }))
  )
  await loadAttendance()
}
</script>

<template>
  <div class="page-root">

    <PageHeader eyebrow="Faculty Portal" title="Attendance Register" :date="todayLabel()" />
    <div class="rule" />

    <!-- ══════════════════════════════════════════════
         SECTION 1 — Attendance register
    ══════════════════════════════════════════════ -->
    <div class="layout">

      <!-- ── Left: session panel ── -->
      <aside class="session-panel">

        <!-- Step 1: Class -->
        <div class="card panel-card">
          <div class="panel-head">
            <span class="step-badge">1</span>
            <p class="section-label">Select class</p>
          </div>
          <div class="rule" />
          <div class="panel-body">
            <div class="select-wrap">
              <select :value="selectedClass" @change="onClassChange($event.target.value)">
                <option value="" disabled>Choose a class…</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 2: Subject — locked until class is chosen -->
        <div class="card panel-card" :class="{ 'panel-card--locked': !selectedClass }">
          <div class="panel-head">
            <span class="step-badge" :class="{ 'step-badge--dim': !selectedClass }">2</span>
            <p class="section-label">Select subject</p>
          </div>
          <div class="rule" />
          <div class="panel-body">
            <LoadingState v-if="loading" label="Loading…" />
            <div v-else class="select-wrap">
              <select
                :value="selectedSubject"
                :disabled="!selectedClass || !subjects.length"
                @change="onSubjectChange($event.target.value)"
              >
                <option value="" disabled>Choose a subject…</option>
                <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Quick actions — only shown when session is ready -->
        <div class="card panel-card" v-if="selectedSubject && students.length">
          <div class="panel-head">
            <p class="section-label">Quick actions</p>
          </div>
          <div class="rule" />
          <div class="panel-body">
            <button class="btn btn-primary action-btn" @click="markAll">
              Mark all present
            </button>
          </div>
        </div>

        <!-- Live stats — only shown when a class is loaded -->
        <div class="card panel-card" v-if="students.length">
          <div class="panel-head">
            <p class="section-label">Session stats</p>
            <div class="live-badge">
              <span class="pulse" />
              <span class="live-label">Live</span>
            </div>
          </div>
          <div class="rule" />
          <div class="panel-body stats-list">

            <div class="stat-inline">
              <span class="stat-dot" style="background:var(--accent-lt)" />
              <span class="stat-name">Present</span>
              <span class="stat-val" style="color:var(--accent)">{{ presentCount }}</span>
            </div>
            <div class="stat-inline">
              <span class="stat-dot" style="background:#b03030" />
              <span class="stat-name">Absent</span>
              <span class="stat-val" style="color:#b03030">{{ absentCount }}</span>
            </div>
            <div class="stat-inline">
              <span class="stat-dot" style="background:#b87a00" />
              <span class="stat-name">Late</span>
              <span class="stat-val" style="color:#b87a00">{{ lateCount }}</span>
            </div>
            <div class="stat-inline stat-inline--sep">
              <span class="stat-dot" style="background:var(--muted-lt)" />
              <span class="stat-name">Unmarked</span>
              <span class="stat-val" style="color:var(--muted)">{{ unmarkedCount }}</span>
            </div>

            <!-- Attendance rate progress bar -->
            <div class="rate-block">
              <div class="rate-row">
                <span class="section-label">Attendance rate</span>
                <span class="rate-num">{{ pct }}%</span>
              </div>
              <div class="rate-track">
                <div class="rate-fill" :style="{ width: pct + '%' }" />
              </div>
            </div>

          </div>
        </div>

      </aside>

      <!-- ── Right: student roster ── -->
      <main class="roster-wrap">
        <div class="card roster-card">

          <div class="card-head">
            <div class="roster-title-row">
              <p class="section-label">Student Roster</p>
              <span v-if="students.length" class="count-tag">{{ students.length }} students</span>
            </div>
            <p v-if="selectedClassName" class="session-label">
              {{ selectedClassName }}
              <span v-if="selectedSubjectName"> · {{ selectedSubjectName }}</span>
            </p>
          </div>
          <div class="rule" />

          <!-- States -->
          <LoadingState v-if="loading" label="Loading roster…" />
          <EmptyState v-else-if="!selectedClass"
            title="No class selected"
            sub="Select a class on the left to load the roster." />
          <EmptyState v-else-if="!students.length"
            title="No students found"
            sub="This class has no enrolled students." />

          <!-- Table -->
          <div v-else class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width:3rem">#</th>
                  <th>Student</th>
                  <th class="hide-mobile" style="width:8rem">Status</th>
                  <th class="hide-mobile" style="width:7rem">Recorded</th>
                  <th style="width:9rem;text-align:right">
                    <span v-if="!selectedSubject" class="col-hint">Select subject first</span>
                    <span v-else>Mark</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(s, i) in students" :key="s.id"
                  :class="{
                    'row--present': marked[s.id]?.status === 'present',
                    'row--absent':  marked[s.id]?.status === 'absent',
                    'row--late':    marked[s.id]?.status === 'late',
                  }"
                  :style="{ animationDelay: `${i * 18}ms` }"
                  class="row-in"
                >
                  <td class="cell-num">{{ String(i + 1).padStart(2, '0') }}</td>
                  <td>
                    <div class="student-cell">
                      <div class="avatar avatar-sm avatar--dim">
                        {{ personInitials(s.first_name, s.last_name) }}
                      </div>
                      <span class="student-name">{{ s.first_name }} {{ s.last_name }}</span>
                    </div>
                  </td>
                  <td class="hide-mobile">
                    <StatusPill v-if="marked[s.id]?.status" :status="marked[s.id].status" />
                    <span v-else class="cell-muted">—</span>
                  </td>
                  <td class="hide-mobile cell-date">
                    {{ formatRelative(marked[s.id]?.date) }}
                  </td>
                  <td>
                    <div class="mark-group">
                      <button class="mark-btn mark-btn--p"
                        :class="{ active: marked[s.id]?.status === 'present' }"
                        :disabled="!selectedSubject"
                        title="Present"
                        @click="mark(s.id, 'present')">P</button>
                      <button class="mark-btn mark-btn--a"
                        :class="{ active: marked[s.id]?.status === 'absent' }"
                        :disabled="!selectedSubject"
                        title="Absent"
                        @click="mark(s.id, 'absent')">A</button>
                      <button class="mark-btn mark-btn--l"
                        :class="{ active: marked[s.id]?.status === 'late' }"
                        :disabled="!selectedSubject"
                        title="Late"
                        @click="mark(s.id, 'late')">L</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </main>

    </div>

    <!-- ══════════════════════════════════════════════
         SECTION 2 — Teacher's weekly work schedule
    ══════════════════════════════════════════════ -->
    <div class="rule" style="margin: 0.5rem 0" />

    <div class="schedule-section">
      <div class="schedule-header">
        <div>
          <p class="eyebrow">Work Schedule</p>
          <p class="schedule-sub">Your teaching assignments for the week</p>
        </div>
      </div>

      <div class="schedule-grid">
        <!-- Today's teaching — compact panel -->
        <TodayClasses
          :slots="todaySlots"
          :todayName="today"
          :nextClass="null"
        />

        <!-- Full week timetable -->
        <div class="timetable-col">
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

  </div>
</template>

<style scoped>
/* ── Two-column register layout ──────────────────────────────────────────── */
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.25rem;
  align-items: start;
}

/* ── Session panel ───────────────────────────────────────────────────────── */
.session-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: sticky;
  top: calc(var(--topbar-h) + 1rem);
}

.panel-card { overflow: hidden; }
.panel-card--locked { opacity: 0.5; pointer-events: none; }

.panel-head {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.9rem 1.1rem;
}
.panel-body { padding: 1rem 1.1rem; }

/* Step number badge */
.step-badge {
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--accent); color: #fff;
  font-size: 0.58rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.step-badge--dim {
  background: var(--surface-3); color: var(--muted);
  border: 1px solid var(--border-mid);
}

.action-btn { width: 100%; justify-content: center; font-size: 0.68rem; }

/* Stats list */
.stats-list { display: flex; flex-direction: column; gap: 0.55rem; }
.stat-inline { display: flex; align-items: center; gap: 0.55rem; }
.stat-inline--sep {
  border-top: 1px solid var(--border);
  padding-top: 0.55rem; margin-top: 0.1rem;
}
.stat-dot  { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.stat-name { font-size: 0.75rem; color: var(--muted); flex: 1; }
.stat-val  { font-size: 0.9rem; font-weight: 600; }

/* Rate bar */
.rate-block { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
.rate-row   { display: flex; justify-content: space-between; align-items: center; }
.rate-num   { font-size: 0.82rem; font-weight: 600; color: var(--text); }
.rate-track { height: 4px; background: var(--border-mid); border-radius: 2px; overflow: hidden; }
.rate-fill  { height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.5s ease; }

/* Live indicator */
.live-badge  { display: flex; align-items: center; gap: 0.4rem; margin-left: auto; }
.live-label  {
  font-size: 0.55rem; font-weight: 700;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent-lt);
}

/* ── Roster ──────────────────────────────────────────────────────────────── */
.roster-wrap  { min-width: 0; }
.roster-card  { overflow: hidden; }

.roster-title-row { display: flex; align-items: center; gap: 0.75rem; }
.session-label {
  font-family: var(--ff-serif);
  font-size: 0.85rem; font-style: italic; color: var(--muted);
}
.col-hint { font-size: 0.6rem; color: var(--muted); font-weight: 400; text-transform: none; letter-spacing: 0; }

.cell-num  { font-size: 0.72rem; color: var(--muted-lt); }
.cell-date { font-family: var(--ff-serif); font-style: italic; font-size: 0.8rem; color: var(--muted); }
.cell-muted { font-size: 0.78rem; color: var(--muted-lt); }

.student-cell { display: flex; align-items: center; gap: 0.75rem; }
.student-name { font-weight: 500; color: var(--text); font-size: 0.9rem; }

/* Mark buttons */
.mark-group { display: flex; gap: 0.3rem; justify-content: flex-end; }
.mark-btn {
  width: 30px; height: 30px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid);
  background: transparent;
  font-size: 0.62rem; font-weight: 700;
  color: var(--muted); cursor: pointer;
  transition: all 0.15s; flex-shrink: 0;
}
.mark-btn:disabled { opacity: 0.25; cursor: not-allowed; }
.mark-btn--p:not(:disabled):hover { border-color: var(--accent-lt); color: var(--accent); }
.mark-btn--p.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.mark-btn--a:not(:disabled):hover { border-color: rgba(176,48,48,0.5); color: #b03030; }
.mark-btn--a.active { background: #b03030; border-color: #b03030; color: #fff; }
.mark-btn--l:not(:disabled):hover { border-color: rgba(184,122,0,0.5); color: #b87a00; }
.mark-btn--l.active { background: #b87a00; border-color: #b87a00; color: #fff; }

/* ── Work schedule section ───────────────────────────────────────────────── */
.schedule-section { display: flex; flex-direction: column; gap: 1rem; }
.schedule-header  { display: flex; justify-content: space-between; align-items: flex-end; }
.schedule-sub     { font-size: 0.78rem; color: var(--muted); margin-top: 0.25rem; }

.schedule-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.25rem;
  align-items: start;
}
.timetable-col { min-width: 0; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 900px) {
  .layout         { grid-template-columns: 1fr; }
  .schedule-grid  { grid-template-columns: 1fr; }
  .session-panel  { position: static; }
}
</style>
