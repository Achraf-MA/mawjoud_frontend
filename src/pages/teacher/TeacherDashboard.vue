<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  getClasses, getSubjectsByClass, getStudentsByClass,
  createAttendance, getAttendance
} from '../../services/teacher'
import { useAttendanceStats } from '../../composables/useAttendance'
import { formatRelative, todayLabel, personInitials } from '../../composables/useDate'

import PageHeader  from '../../components/shared/PageHeader.vue'
import StatCard    from '../../components/shared/StatCard.vue'
import StatusPill  from '../../components/shared/StatusPill.vue'
import EmptyState  from '../../components/shared/EmptyState.vue'
import LoadingState from '../../components/shared/LoadingState.vue'

const classes         = ref([])
const subjects        = ref([])
const students        = ref([])
const selectedClass   = ref('')
const selectedSubject = ref('')
const loading         = ref(false)
const marked          = ref({})

const { presentCount, absentCount, unmarkedCount, pct } = useAttendanceStats(marked, students)

const selectedClassName   = computed(() => classes.value.find(c => String(c.id) === String(selectedClass.value))?.name ?? '')
const selectedSubjectName = computed(() => subjects.value.find(s => String(s.id) === String(selectedSubject.value))?.name ?? '')

onMounted(async () => {
  try { classes.value = (await getClasses()).data }
  catch (e) { console.error(e) }
})

async function onClassChange(id) {
  selectedClass.value = id
  if (!id) return
  loading.value = true; marked.value = {}
  try {
    const [sr, subr] = await Promise.all([getStudentsByClass(id), getSubjectsByClass(id)])
    students.value = sr.data; subjects.value = subr.data
    selectedSubject.value = ''
    await loadAttendance()
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadAttendance() {
  if (!selectedClass.value) return
  const res = await getAttendance({ class_id: selectedClass.value })
  marked.value = Object.fromEntries(
    Object.values(
      res.data.reduce((acc, a) => {
        const sid = a.student.id
        if (!acc[sid] || a.date > acc[sid].date) acc[sid] = a
        return acc
      }, {})
    ).map(a => [a.student.id, { status: a.status, date: a.date }])
  )
}

async function mark(studentId, status) {
  if (!selectedClass.value || !selectedSubject.value) return
  const date = new Date().toISOString().slice(0, 10)
  await createAttendance({
    student_id: studentId,
    class_id:   Number(selectedClass.value),
    subject_id: Number(selectedSubject.value),
    date, status,
  })
  marked.value = { ...marked.value, [studentId]: { status, date } }
}

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

    <!-- Session bar -->
    <div class="card session-bar">
      <div class="session-inner">
        <div class="form-group session-field">
          <label class="field-label">Class</label>
          <div class="select-wrap">
            <select :value="selectedClass" @change="onClassChange($event.target.value)">
              <option value="" disabled>Select class</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>

        <div class="session-divider" />

        <div class="form-group session-field">
          <label class="field-label">Subject</label>
          <div class="select-wrap">
            <select :value="selectedSubject" :disabled="!selectedClass" @change="selectedSubject = $event.target.value">
              <option value="" disabled>Select subject</option>
              <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <div class="session-divider hide-mobile" />

        <div class="session-context hide-mobile" v-if="selectedClassName">
          <p class="section-label" style="margin-bottom:3px">Session</p>
          <p class="session-val">{{ selectedClassName }}<span v-if="selectedSubjectName"> · {{ selectedSubjectName }}</span></p>
        </div>

        <div class="session-actions">
          <div class="session-status">
            <span class="pulse" />
            <span class="status-text">{{ selectedClass ? 'Active' : 'Inactive' }}</span>
          </div>
          <button class="btn btn-primary" :disabled="!selectedSubject || !students.length" @click="markAll">
            Mark all present
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid" v-if="students.length">
      <StatCard :num="presentCount" label="Present" color="var(--accent)"
        fill-class="stat-bar-fill--present" :pct="students.length ? presentCount/students.length*100 : 0" />
      <StatCard :num="absentCount" label="Absent" color="#b03030"
        fill-class="stat-bar-fill--absent" :pct="students.length ? absentCount/students.length*100 : 0" />
      <StatCard :num="unmarkedCount" label="Unmarked" color="var(--muted)"
        fill-class="stat-bar-fill--unmarked" :pct="students.length ? unmarkedCount/students.length*100 : 0" />
      <StatCard :num="pct" label="Attendance rate" color="var(--text)"
        fill-class="stat-bar-fill--present" :pct="pct">
        <template #suffix><span style="font-size:1.1rem;color:var(--muted)">%</span></template>
      </StatCard>
    </div>

    <!-- Roster -->
    <div class="card roster-card">
      <div class="card-head">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <p class="section-label">Student Roster</p>
          <span v-if="students.length" class="count-tag">{{ students.length }} students</span>
        </div>
        <p v-if="!selectedSubject && selectedClass" class="hint">Select a subject to begin marking</p>
      </div>
      <div class="rule" />

      <LoadingState v-if="loading" label="Loading roster…" />
      <EmptyState v-else-if="!students.length" title="No class selected" sub="Choose a class above to load the student roster." />

      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:3rem">#</th>
              <th>Student</th>
              <th class="hide-mobile" style="width:7rem">Status</th>
              <th class="hide-mobile" style="width:7rem">Recorded</th>
              <th style="width:6rem;text-align:right">Mark</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(s, i) in students" :key="s.id"
              :class="{ 'row--present': marked[s.id]?.status === 'present', 'row--absent': marked[s.id]?.status === 'absent' }"
              :style="{ animationDelay: `${i * 20}ms` }"
              class="row-in"
            >
              <td style="font-size:0.72rem;color:var(--muted-lt)">{{ String(i+1).padStart(2,'0') }}</td>
              <td>
                <div style="display:flex;align-items:center;gap:0.75rem">
                  <div class="avatar avatar-sm avatar--dim">{{ personInitials(s.first_name, s.last_name) }}</div>
                  <span style="font-weight:500;color:var(--text)">{{ s.first_name }} {{ s.last_name }}</span>
                </div>
              </td>
              <td class="hide-mobile">
                <StatusPill v-if="marked[s.id]?.status" :status="marked[s.id].status" />
                <span v-else style="font-size:0.78rem;color:var(--muted-lt)">Unmarked</span>
              </td>
              <td class="hide-mobile" style="font-family:var(--ff-serif);font-style:italic;font-size:0.8rem;color:var(--muted)">
                {{ formatRelative(marked[s.id]?.date) }}
              </td>
              <td style="text-align:right">
                <div style="display:flex;gap:0.35rem;justify-content:flex-end">
                  <button class="mark-btn mark-btn--p" :class="{ active: marked[s.id]?.status === 'present' }"
                    :disabled="!selectedSubject" @click="mark(s.id, 'present')">P</button>
                  <button class="mark-btn mark-btn--a" :class="{ active: marked[s.id]?.status === 'absent' }"
                    :disabled="!selectedSubject" @click="mark(s.id, 'absent')">A</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roster-card { overflow: hidden; }
.hint { font-size: 0.75rem; font-style: italic; color: var(--muted); }

.session-bar { overflow: hidden; }
.session-inner {
  display: flex; align-items: center;
  padding: 1.1rem 1.5rem; gap: 1.25rem; flex-wrap: wrap;
}
.session-field { min-width: 160px; }
.session-divider { width: 1px; height: 40px; background: var(--border-mid); flex-shrink: 0; }
.session-context { flex: 1; }
.session-val { font-family: var(--ff-serif); font-size: 1rem; font-weight: 500; color: var(--text); margin-top: 2px; }
.session-actions { display: flex; align-items: center; gap: 1rem; margin-left: auto; }
.session-status  { display: flex; align-items: center; gap: 0.45rem; }
.status-text { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }

.mark-btn {
  width: 28px; height: 28px; border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid); background: transparent;
  font-size: 0.62rem; font-weight: 700; color: var(--muted); cursor: pointer;
  transition: all 0.15s;
}
.mark-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.mark-btn--p:not(:disabled):hover { border-color: var(--accent-lt); color: var(--accent); }
.mark-btn--p.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.mark-btn--a:not(:disabled):hover { border-color: rgba(176,48,48,0.5); color: #b03030; }
.mark-btn--a.active { background: #b03030; border-color: #b03030; color: #fff; }

@media (max-width: 600px) {
  .session-inner { flex-direction: column; align-items: stretch; }
  .session-divider { width: 100%; height: 1px; }
  .session-actions { margin-left: 0; }
}
</style>
