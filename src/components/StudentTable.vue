<script setup>
defineProps({
  students:        { type: Array,   default: () => [] },
  loading:         { type: Boolean, default: false },
  marked:          { type: Object,  default: () => ({}) },
  selectedSubject: { type: String,  default: '' },
})

const emit = defineEmits(['mark'])

function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
     new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
  )
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff <= 7)  return `${diff} days ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="card roster-card">

    <div class="roster-head">
      <div>
        <p class="section-label">Student Roster</p>
      </div>
      <span v-if="students.length" class="count-tag">
        {{ students.length }} students
      </span>
    </div>

    <div class="rule" />

    <!-- Loading -->
    <div v-if="loading" class="roster-state">
      <div class="dot-loader"><span/><span/><span/></div>
      <p>Loading roster…</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!students.length" class="roster-state">
      <p class="empty-msg">Select a class to load the student roster.</p>
    </div>

    <!-- Table -->
    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th class="col-no">No.</th>
            <th>Student</th>
            <th class="col-status hide-mobile">Status</th>
            <th class="col-date hide-mobile">Recorded</th>
            <th class="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, i) in students"
            :key="student.id"
            :class="{
              'row--present': marked[student.id]?.status === 'present',
              'row--absent':  marked[student.id]?.status === 'absent',
            }"
            :style="{ animationDelay: `${i * 25}ms` }"
            class="row-in"
          >
            <td class="col-no cell-no">{{ String(i + 1).padStart(2, '0') }}</td>

            <td class="cell-name">
              {{ student.first_name }} {{ student.last_name }}
            </td>

            <td class="col-status hide-mobile">
              <span
                class="status-pill"
                :class="{
                  'pill--present': marked[student.id]?.status === 'present',
                  'pill--absent':  marked[student.id]?.status === 'absent',
                }"
              >
                {{ marked[student.id]?.status ?? 'Unmarked' }}
              </span>
            </td>

            <td class="col-date hide-mobile cell-date">
              {{ formatDate(marked[student.id]?.date) }}
            </td>

            <td class="col-actions">
              <div class="action-group">
                <button
                  class="mark-btn mark-btn--present"
                  :class="{ active: marked[student.id]?.status === 'present' }"
                  :disabled="!selectedSubject"
                  @click="emit('mark', student.id, 'present')"
                >P</button>
                <button
                  class="mark-btn mark-btn--absent"
                  :class="{ active: marked[student.id]?.status === 'absent' }"
                  :disabled="!selectedSubject"
                  @click="emit('mark', student.id, 'absent')"
                >A</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<style scoped>
.roster-card { overflow: hidden; }

.roster-head {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem;
}

.count-tag {
  font-size: 0.6rem; font-weight: 500;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--muted);
}

.roster-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem;
  padding: 4rem 1rem;
  color: var(--muted); font-size: 0.82rem;
  text-align: center;
}
.empty-msg { font-family: var(--ff-serif); font-style: italic; font-size: 0.95rem; }

.table-scroll { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; }

thead th {
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted);
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-mid);
  white-space: nowrap;
}
.th-actions { text-align: right; }

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--bg-2); }

tbody tr.row--present { background: rgba(74,140,104,0.04); }
tbody tr.row--absent  { background: rgba(176,48,48,0.03); }

@keyframes rowIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.row-in { animation: rowIn 0.3s ease both; }

tbody td {
  padding: 0.8rem 1rem;
  font-size: 0.875rem;
  color: var(--text-mid);
  vertical-align: middle;
}

.col-no { width: 3rem; }
.col-status { width: 7rem; }
.col-date { width: 8rem; }
.col-actions { width: 7rem; text-align: right; }

.cell-no { font-size: 0.75rem; color: var(--muted); font-weight: 300; }
.cell-name { font-weight: 500; color: var(--text); font-size: 0.9rem; }
.cell-date {
  font-family: var(--ff-serif);
  font-style: italic;
  font-size: 0.82rem;
  color: var(--muted);
}

/* Status pill */
.status-pill {
  display: inline-block;
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
  border: 1px solid var(--border-mid);
  color: var(--muted);
}
.pill--present {
  color: var(--accent);
  background: var(--accent-dim);
  border-color: var(--border-strong);
}
.pill--absent {
  color: #b03030;
  background: rgba(176,48,48,0.06);
  border-color: rgba(176,48,48,0.2);
}

/* Mark buttons */
.action-group { display: flex; gap: 0.4rem; justify-content: flex-end; }

.mark-btn {
  width: 30px; height: 30px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-mid);
  background: transparent;
  font-size: 0.65rem; font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--muted);
}
.mark-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.mark-btn--present:not(:disabled):hover { border-color: var(--accent-lt); color: var(--accent); }
.mark-btn--present.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.mark-btn--absent:not(:disabled):hover { border-color: rgba(176,48,48,0.5); color: #b03030; }
.mark-btn--absent.active { background: #b03030; border-color: #b03030; color: #fff; }
</style>
