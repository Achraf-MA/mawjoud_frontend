<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, getStudents, linkParent, getParentLinks } from '../../services/admin'
import BaseModal from '../ui/BaseModal.vue'

const parents  = ref([])
const students = ref([])
const links    = ref([])
const loading  = ref(false)
const modal    = ref(false)
const saving   = ref(false)
const error    = ref('')
const form     = ref({ parent_id: '', student_id: '' })

async function load() {
  loading.value = true
  try {
    const [usersRes, studentsRes, linksRes] = await Promise.all([
      getUsers(), getStudents(), getParentLinks()
    ])
    parents.value  = (usersRes.data ?? []).filter(u => u.role === 'parent')
    students.value = studentsRes.data ?? []
    links.value    = linksRes.data ?? []
  } catch {
    error.value = 'Failed to load data.'
  } finally {
    loading.value = false
  }
}

function openModal() {
  form.value  = { parent_id: '', student_id: '' }
  error.value = ''
  modal.value = true
}

async function submit() {
  if (!form.value.parent_id || !form.value.student_id) {
    error.value = 'Please select both a parent and a student.'
    return
  }
  saving.value = true
  error.value  = ''
  try {
    await linkParent(form.value)
    await load()
    modal.value = false
  } catch (e) {
    error.value = e.message || 'An error occurred.'
  } finally {
    saving.value = false
  }
}

function initials(name = '') {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

onMounted(load)
</script>

<template>
  <div class="links-root">

    <!-- Header -->
    <div class="links-header">
      <div>
        <p class="tab-title">Family Links</p>
        <p class="tab-sub">Parent–student relationships registered in the system</p>
      </div>
      <div class="header-right">
        <div class="stat-block">
          <span class="stat-num">{{ links.length }}</span>
          <span class="stat-label">links</span>
        </div>
        <button class="btn btn-ghost" @click="openModal">+ New link</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="links-state">
      <div class="dot-loader"><span/><span/><span/></div>
      <p>Loading family records…</p>
    </div>

    <!-- Empty -->
    <div v-else-if="!links.length" class="links-empty">
      <div class="empty-icon">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="11" cy="18" r="6" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="25" cy="18" r="6" stroke="currentColor" stroke-width="1.2"/>
          <path d="M17 18h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">No links established</p>
      <p class="empty-sub">Connect a parent to their child to get started.</p>
      <button class="btn btn-ghost" @click="openModal">Create first link</button>
    </div>

    <!-- Grid of link cards -->
    <div v-else class="links-grid">
      <div
        v-for="(link, i) in links"
        :key="link.id ?? i"
        class="link-card"
        :style="{ animationDelay: `${i * 40}ms` }"
      >
        <!-- Parent side -->
        <div class="person parent-side">
          <div class="avatar avatar--parent">{{ initials(link.parent) }}</div>
          <div class="person-info">
            <span class="person-role">Parent</span>
            <span class="person-name">{{ link.parent }}</span>
          </div>
        </div>

        <!-- Central badge -->
        <div class="link-center">
          <div class="link-line link-line--left" />
          <div class="link-badge">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="link-line link-line--right" />
        </div>

        <!-- Student side -->
        <div class="person student-side">
          <div class="person-info person-info--right">
            <span class="person-role">Student</span>
            <span class="person-name">{{ link.student }}</span>
          </div>
          <div class="avatar avatar--student">{{ initials(link.student) }}</div>
        </div>

      </div>
    </div>

    <!-- Modal -->
    <BaseModal title="New family link" :show="modal" @close="modal = false">
      <form class="link-form" @submit.prevent="submit">

        <div class="form-group">
          <label class="field-label">Parent</label>
          <div class="select-wrap">
            <select v-model="form.parent_id" required>
              <option value="" disabled>Select a parent…</option>
              <option v-for="p in parents" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-divider">
          <span class="form-divider-line" />
          <span class="form-divider-label">linked to</span>
          <span class="form-divider-line" />
        </div>

        <div class="form-group">
          <label class="field-label">Student</label>
          <div class="select-wrap">
            <select v-model="form.student_id" required>
              <option value="" disabled>Select a student…</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.first_name }} {{ s.last_name }}
              </option>
            </select>
          </div>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="modal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="dot-loader" style="display:inline-flex;gap:3px"><span/><span/><span/></span>
            <span v-else>Establish link</span>
          </button>
        </div>
      </form>
    </BaseModal>

  </div>
</template>

<style scoped>
.links-root { display: flex; flex-direction: column; gap: 1.5rem; }

/* Header */
.links-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.tab-title {
  font-family: var(--ff-serif);
  font-size: 1.25rem; font-weight: 500;
  color: var(--text);
}
.tab-sub { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
.header-right { display: flex; align-items: center; gap: 1.25rem; }

.stat-block { text-align: right; }
.stat-num {
  display: block;
  font-family: var(--ff-serif);
  font-size: 1.8rem; font-weight: 500;
  color: var(--accent); line-height: 1;
}
.stat-label {
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted);
}

/* States */
.links-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem;
  padding: 3rem; color: var(--muted); font-size: 0.82rem;
}

.links-empty {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.85rem;
  padding: 4rem 2rem; text-align: center;
}
.empty-icon {
  width: 64px; height: 64px;
  border: 1px solid var(--border-mid);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent-lt);
  margin-bottom: 0.25rem;
}
.empty-title {
  font-family: var(--ff-serif);
  font-size: 1.1rem; font-weight: 500;
  color: var(--text);
}
.empty-sub { font-size: 0.82rem; color: var(--muted); }

/* Grid */
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 0.85rem;
}

/* Link card */
.link-card {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  animation: cardIn 0.35s ease both;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.link-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow);
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Person panels */
.person {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1.1rem 1.25rem;
  flex: 1;
  min-width: 0;
}

.parent-side { background: var(--accent-dim); }
.student-side { background: var(--surface-2); justify-content: flex-end; }

/* Avatar */
.avatar {
  width: 38px; height: 38px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ff-sans);
  font-size: 0.7rem; font-weight: 600;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}
.avatar--parent {
  background: var(--accent);
  color: #fff;
}
.avatar--student {
  background: var(--surface-3);
  color: var(--accent);
  border: 1px solid var(--border-mid);
}

/* Person info */
.person-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.person-info--right { text-align: right; }
.person-role {
  font-size: 0.56rem; font-weight: 600;
  letter-spacing: 0.22em; text-transform: uppercase;
  color: var(--muted);
}
.person-name {
  font-size: 0.875rem; font-weight: 500;
  color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Central connector */
.link-center {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.link-line {
  width: 18px; height: 1px;
  background: var(--border-mid);
}
.link-badge {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
  z-index: 1;
}

/* Form */
.link-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.45rem; }

.form-divider {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.25rem 0;
}
.form-divider-line {
  flex: 1; height: 1px;
  background: var(--border-mid);
}
.form-divider-label {
  font-size: 0.6rem; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted); white-space: nowrap;
}

.form-error {
  font-size: 0.78rem; color: #b03030;
  font-style: italic; font-family: var(--ff-serif);
}

.form-actions {
  display: flex; justify-content: flex-end;
  gap: 0.65rem; margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .links-grid { grid-template-columns: 1fr; }
  .link-card { flex-direction: column; }
  .parent-side, .student-side { width: 100%; justify-content: flex-start; }
  .person-info--right { text-align: left; }
  .link-center { width: 100%; padding: 0 1.25rem; }
  .link-line { flex: 1; }
}
</style>
