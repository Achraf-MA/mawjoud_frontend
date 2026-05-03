<script setup>
import { ref, computed, onMounted } from 'vue'
import { getChildAttendances, submitJustification } from '../../services/parent'
import BaseModal from '../../components/ui/BaseModal.vue'

const records   = ref([])
const loading   = ref(true)
const page      = ref(1)
const lastPage  = ref(1)
const error     = ref('')

// Justification modal state
const modal        = ref(false)
const selected     = ref(null) // the attendance record being justified
const justComment  = ref('')
const justFile     = ref(null)
const fileInput    = ref(null)
const saving       = ref(false)
const justError    = ref('')
const justSuccess  = ref(false)

// Stats
const totalAbsent  = computed(() => records.value.filter(r => r.status === 'absent').length)
const totalPresent = computed(() => records.value.filter(r => r.status === 'present').length)
const totalLate    = computed(() => records.value.filter(r => r.status === 'late').length)
const justified    = computed(() => records.value.filter(r => r.justification).length)

// Group records by student name
const byStudent = computed(() => {
  const map = {}
  for (const r of records.value) {
    const name = r.student?.name ?? 'Unknown'
    if (!map[name]) map[name] = []
    map[name].push(r)
  }
  return map
})

async function load(p = 1) {
  loading.value = true
  error.value   = ''
  try {
    const res  = await getChildAttendances(p)
    // API returns Laravel paginator: { data: [...], current_page, last_page }
    const body = res.data ?? res
    records.value = body.data   ?? body
    lastPage.value = body.last_page ?? 1
    page.value     = body.current_page ?? 1
  } catch (e) {
    error.value = e.message || 'Failed to load attendance records.'
  } finally {
    loading.value = false
  }
}

function openJustify(record) {
  selected.value    = record
  justComment.value = ''
  justFile.value    = null
  justError.value   = ''
  justSuccess.value = false
  modal.value       = true
}

function onFileChange(e) {
  justFile.value = e.target.files?.[0] ?? null
}

async function submitModal() {
  justError.value   = ''
  justSuccess.value = false
  saving.value      = true
  try {
    await submitJustification(selected.value.id, {
      comment: justComment.value,
      file:    justFile.value,
    })
    justSuccess.value = true
    await load(page.value)
    setTimeout(() => { modal.value = false }, 1200)
  } catch (e) {
    justError.value = e.message || 'Failed to submit justification.'
  } finally {
    saving.value = false
  }
}

function statusLabel(s) {
  return s === 'present' ? 'Present' : s === 'absent' ? 'Absent' : s === 'late' ? 'Late' : s
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function initials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

onMounted(() => load(1))
</script>

<template>
  <div class="parent-root">

    <!-- Header -->
    <div class="page-top">
      <div>
        <p class="eyebrow">Parent Portal</p>
        <h1 class="page-title">My Children's Attendance</h1>
        <p class="page-subtitle">Monitor attendance and submit absence justifications</p>
      </div>
    </div>
    <div class="rule" style="margin-bottom: 1.75rem;" />

    <!-- Loading -->
    <div v-if="loading" class="page-state">
      <div class="dot-loader"><span/><span/><span/></div>
      <p>Loading attendance records…</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="page-error">{{ error }}</div>

    <!-- Empty -->
    <div v-else-if="!records.length" class="page-empty">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" stroke-width="1.2"/>
          <path d="M10 12h12M10 16h8M10 20h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">No attendance records yet</p>
      <p class="empty-sub">Records will appear here once your child has been registered in a class.</p>
    </div>

    <template v-else>

      <!-- Summary stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num" style="color: var(--accent)">{{ totalPresent }}</span>
          <span class="stat-label">Present</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #b03030">{{ totalAbsent }}</span>
          <span class="stat-label">Absent</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: #b87a00">{{ totalLate }}</span>
          <span class="stat-label">Late</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" style="color: var(--muted)">{{ justified }}</span>
          <span class="stat-label">Justified</span>
        </div>
      </div>

      <!-- Per-student sections -->
      <div
        v-for="(studentRecords, studentName) in byStudent"
        :key="studentName"
        class="student-section"
      >

        <!-- Student header -->
        <div class="student-head">
          <div class="student-avatar">{{ initials(studentName) }}</div>
          <div>
            <p class="student-name">{{ studentName }}</p>
            <p class="student-meta">
              {{ studentRecords.filter(r => r.status === 'absent').length }} absences ·
              {{ studentRecords.filter(r => r.status === 'present').length }} present
            </p>
          </div>
        </div>

        <!-- Records table -->
        <div class="card records-card">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Justification</th>
                  <th class="th-action">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(rec, i) in studentRecords"
                  :key="rec.id"
                  :class="{
                    'row--present': rec.status === 'present',
                    'row--absent':  rec.status === 'absent',
                    'row--late':    rec.status === 'late',
                  }"
                  :style="{ animationDelay: `${i * 20}ms` }"
                  class="row-in"
                >
                  <td class="cell-date-val">{{ formatDate(rec.date) }}</td>
                  <td class="cell-subject">{{ rec.subject?.name ?? '—' }}</td>
                  <td>
                    <span class="status-pill" :class="`pill--${rec.status}`">
                      {{ statusLabel(rec.status) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="!rec.justification" class="just-none">—</span>
                    <span v-else class="just-pill" :class="`just--${rec.justification.status}`">
                      {{ rec.justification.status }}
                    </span>
                  </td>
                  <td class="td-action">
                    <button
                      v-if="rec.status !== 'present' && !rec.justification"
                      class="btn btn-ghost justify-btn"
                      @click="openJustify(rec)"
                    >
                      Justify
                    </button>
                    <span v-else class="action-done">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="lastPage > 1">
        <button class="btn btn-ghost" :disabled="page <= 1" @click="load(page - 1)">Previous</button>
        <span class="page-indicator">Page {{ page }} of {{ lastPage }}</span>
        <button class="btn btn-ghost" :disabled="page >= lastPage" @click="load(page + 1)">Next</button>
      </div>

    </template>

    <!-- Justification modal -->
    <BaseModal title="Submit justification" :show="modal" @close="modal = false">
      <div class="just-modal-body">

        <!-- Context -->
        <div class="just-context" v-if="selected">
          <div class="just-context-row">
            <span class="field-label">Student</span>
            <span class="just-context-val">{{ selected.student?.name }}</span>
          </div>
          <div class="just-context-row">
            <span class="field-label">Date</span>
            <span class="just-context-val">{{ formatDate(selected.date) }}</span>
          </div>
          <div class="just-context-row">
            <span class="field-label">Subject</span>
            <span class="just-context-val">{{ selected.subject?.name }}</span>
          </div>
          <div class="just-context-row">
            <span class="field-label">Status</span>
            <span class="status-pill" :class="`pill--${selected.status}`">{{ statusLabel(selected.status) }}</span>
          </div>
        </div>

        <div class="rule" style="margin: 1rem 0;" />

        <form class="just-form" @submit.prevent="submitModal">

          <div class="form-group">
            <label class="field-label">Reason <span class="optional">(optional)</span></label>
            <textarea
              v-model="justComment"
              class="just-textarea"
              placeholder="Briefly explain the reason for this absence…"
              rows="3"
            />
          </div>

          <div class="form-group">
            <label class="field-label">Supporting document <span class="optional">(optional)</span></label>
            <div class="file-drop" @click="fileInput.click()">
              <input ref="fileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" class="file-hidden" @change="onFileChange" />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="file-icon">
                <path d="M10 13V4M10 4L7 7M10 4l3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <span v-if="justFile" class="file-name">{{ justFile.name }}</span>
              <span v-else class="file-prompt">Click to upload PDF, JPG or PNG (max 2MB)</span>
            </div>
          </div>

          <Transition name="err">
            <p v-if="justError" class="form-error">{{ justError }}</p>
          </Transition>

          <Transition name="err">
            <div v-if="justSuccess" class="form-success">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4.5 7l2 2 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Justification submitted successfully.
            </div>
          </Transition>

          <div class="form-actions">
            <button type="button" class="btn btn-ghost" @click="modal = false">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving || justSuccess">
              <span v-if="saving" class="dot-loader" style="display:inline-flex;gap:3px"><span/><span/><span/></span>
              <span v-else>Submit</span>
            </button>
          </div>

        </form>
      </div>
    </BaseModal>

  </div>
</template>

<style scoped>
.parent-root { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

.page-top { margin-bottom: 0.25rem; }
.page-title {
  font-family: var(--ff-serif);
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  font-weight: 500; color: var(--text);
  margin-top: 0.4rem; line-height: 1.1;
}
.page-subtitle { font-size: 0.82rem; color: var(--muted); margin-top: 0.35rem; }

/* States */
.page-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem;
  padding: 4rem; color: var(--muted); font-size: 0.82rem;
}
.page-error {
  background: rgba(176,48,48,0.06); border: 1px solid rgba(176,48,48,0.2);
  border-radius: var(--radius); padding: 0.85rem 1rem;
  font-size: 0.82rem; color: #b03030;
}
.page-empty {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.85rem;
  padding: 4rem 2rem; text-align: center;
}
.empty-icon {
  width: 56px; height: 56px; border-radius: 50%;
  border: 1px solid var(--border-mid);
  display: flex; align-items: center; justify-content: center;
  color: var(--muted-lt);
}
.empty-title { font-family: var(--ff-serif); font-size: 1.1rem; font-weight: 500; color: var(--text); }
.empty-sub { font-size: 0.8rem; color: var(--muted); }

/* Stats */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.85rem; }
.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1rem 1.25rem;
  display: flex; flex-direction: column; gap: 4px;
}
.stat-num {
  font-family: var(--ff-serif); font-size: 1.9rem;
  font-weight: 500; line-height: 1;
}
.stat-label {
  font-size: 0.62rem; font-weight: 600;
  letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted);
}

/* Student section */
.student-section { display: flex; flex-direction: column; gap: 0.85rem; }
.student-head { display: flex; align-items: center; gap: 0.9rem; }
.student-avatar {
  width: 42px; height: 42px; border-radius: 50%;
  background: var(--accent); color: #fff;
  font-size: 0.75rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.student-name {
  font-family: var(--ff-serif); font-size: 1.1rem;
  font-weight: 500; color: var(--text);
}
.student-meta { font-size: 0.75rem; color: var(--muted); margin-top: 1px; }

/* Records card */
.records-card { overflow: hidden; }
.table-scroll { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; }
thead th {
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted); padding: 0.75rem 1rem;
  text-align: left; border-bottom: 1px solid var(--border-mid);
  white-space: nowrap;
}
.th-action { text-align: right; }

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--bg-2); }
tbody tr.row--present { background: rgba(26,58,42,0.03); }
tbody tr.row--absent  { background: rgba(176,48,48,0.03); }
tbody tr.row--late    { background: rgba(184,122,0,0.03); }

@keyframes rowIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.row-in { animation: rowIn 0.28s ease both; }

tbody td { padding: 0.8rem 1rem; font-size: 0.875rem; color: var(--text-mid); vertical-align: middle; }
.td-action { text-align: right; }

.cell-date-val { font-family: var(--ff-serif); font-style: italic; font-size: 0.85rem; color: var(--text); }
.cell-subject { font-weight: 500; color: var(--text); }

/* Status pills */
.status-pill {
  display: inline-block; font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 0.22rem 0.65rem; border-radius: 20px;
  border: 1px solid var(--border); color: var(--muted);
}
.pill--present { color: var(--accent); background: var(--accent-dim); border-color: var(--border-strong); }
.pill--absent  { color: #b03030; background: rgba(176,48,48,0.07); border-color: rgba(176,48,48,0.22); }
.pill--late    { color: #b87a00; background: rgba(184,122,0,0.07); border-color: rgba(184,122,0,0.22); }

/* Justification pills */
.just-none { color: var(--muted-lt); font-size: 0.82rem; }
.just-pill {
  display: inline-block; font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 0.22rem 0.65rem; border-radius: 20px;
  border: 1px solid transparent;
}
.just--pending  { color: #b87a00; background: rgba(184,122,0,0.08); border-color: rgba(184,122,0,0.22); }
.just--accepted { color: var(--accent); background: var(--accent-dim); border-color: var(--border-strong); }
.just--rejected { color: #b03030; background: rgba(176,48,48,0.07); border-color: rgba(176,48,48,0.22); }

/* Action button */
.justify-btn { font-size: 0.62rem; padding: 0.35rem 0.85rem; }
.action-done { color: var(--muted-lt); font-size: 0.82rem; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 1.25rem; padding-top: 0.5rem; }
.page-indicator { font-size: 0.78rem; color: var(--muted); }

/* Modal */
.just-modal-body { display: flex; flex-direction: column; gap: 0; }
.just-context { display: flex; flex-direction: column; gap: 0.6rem; }
.just-context-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.just-context-val { font-size: 0.875rem; color: var(--text); font-weight: 500; }

.just-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.45rem; }
.optional { font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--muted-lt); }

.just-textarea {
  width: 100%; background: var(--surface-2);
  border: 1px solid var(--border-mid); border-radius: var(--radius);
  color: var(--text); font-family: var(--ff-sans);
  font-size: 0.875rem; padding: 0.65rem 0.85rem;
  outline: none; resize: vertical; min-height: 80px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.just-textarea:focus { border-color: var(--accent-lt); box-shadow: 0 0 0 3px var(--accent-dim); }

.file-drop {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px dashed var(--border-mid); border-radius: var(--radius);
  cursor: pointer; transition: border-color 0.2s, background 0.2s;
  color: var(--muted);
}
.file-drop:hover { border-color: var(--accent-lt); background: var(--accent-dim); color: var(--accent); }
.file-hidden { display: none; }
.file-icon { flex-shrink: 0; }
.file-name { font-size: 0.82rem; color: var(--accent); font-weight: 500; }
.file-prompt { font-size: 0.78rem; }

.form-error {
  font-size: 0.78rem; color: #b03030;
  background: rgba(176,48,48,0.06); border: 1px solid rgba(176,48,48,0.18);
  border-radius: var(--radius); padding: 0.6rem 0.85rem;
}
.form-success {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.78rem; color: var(--accent);
  background: var(--accent-dim); border: 1px solid var(--border-strong);
  border-radius: var(--radius); padding: 0.6rem 0.85rem;
}
.err-enter-active, .err-leave-active { transition: opacity 0.2s, transform 0.2s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-4px); }

.form-actions { display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 0.25rem; }

@media (max-width: 640px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .just-context-row { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
}
</style>
