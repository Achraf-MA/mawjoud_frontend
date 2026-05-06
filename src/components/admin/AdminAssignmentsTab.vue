<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, getClasses, getSubjects, assignTeacher, getAssignments, deleteAssignment } from '../../services/admin'
import BaseTable from '../ui/BaseTable.vue'
import BaseModal from '../ui/BaseModal.vue'
import FormField from '../ui/FormField.vue'

const teachers    = ref([])
const classes     = ref([])
const subjects    = ref([])
const assignments = ref([])
const loading     = ref(false)
const modal       = ref(false)
const saving      = ref(false)
const error       = ref('')
const form        = ref({ teacher_id: '', class_id: '', subject_id: '' })

const COLS = [
  { key: 'teacher', label: 'Teacher' },
  { key: 'class',   label: 'Class'   },
  { key: 'subject', label: 'Subject' },
]

async function load() {
  loading.value = true
  try {
    const [usersRes, classesRes, subjectsRes, assignRes] = await Promise.all([
      getUsers(), getClasses(), getSubjects(), getAssignments()
    ])
    teachers.value    = (usersRes.data ?? []).filter(u => u.role === 'teacher')
    classes.value     = classesRes.data   ?? []
    subjects.value    = subjectsRes.data  ?? []
    assignments.value = (assignRes.data   ?? []).map(a => ({
      id:      a.id,
      teacher: a.teacher ?? '',
      class:   a.class   ?? '',
      subject: a.subject ?? '',
    }))
  } catch { error.value = 'Failed to load assignments.' }
  finally { loading.value = false }
}

function openModal() { form.value = { teacher_id: '', class_id: '', subject_id: '' }; error.value = ''; modal.value = true }

async function submit() {
  if (!form.value.teacher_id || !form.value.class_id || !form.value.subject_id) {
    error.value = 'All fields are required.'; return
  }
  saving.value = true; error.value = ''
  try { await assignTeacher(form.value); await load(); modal.value = false }
  catch (e) { error.value = e.message || 'An error occurred.' }
  finally { saving.value = false }
}

async function remove(row) {
  if (!confirm(`Remove assignment: ${row.teacher} → ${row.subject} in ${row.class}?`)) return
  try { await deleteAssignment(row.id); await load() }
  catch (e) { error.value = e.message ?? 'Failed to delete assignment.' }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="tab-bar">
      <div><p class="tab-title">Assignments</p><p class="tab-sub">Assign teachers to classes and subjects</p></div>
      <button class="btn btn-ghost" @click="openModal">+ Assign</button>
    </div>

    <div v-if="error && !modal" class="load-error">{{ error }}</div>

    <BaseTable :columns="COLS" :rows="assignments" :loading="loading" empty="No assignments yet.">
      <template #actions="{ row }">
        <button class="action-btn action-btn--danger" @click="remove(row)" title="Remove">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M5 3V2h3v1M4 3v7h5V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </template>
    </BaseTable>

    <BaseModal title="New Assignment" :show="modal" @close="modal = false">
      <form @submit.prevent="submit" class="modal-form">
        <FormField label="Teacher" type="select" v-model="form.teacher_id"
          :options="teachers.map(t => ({ value: t.id, label: `${t.first_name} ${t.last_name}` }))" required />
        <FormField label="Class"   type="select" v-model="form.class_id"
          :options="classes.map(c => ({ value: c.id, label: c.name }))" required />
        <FormField label="Subject" type="select" v-model="form.subject_id"
          :options="subjects.map(s => ({ value: s.id, label: s.name }))" required />
        <p v-if="error" class="form-error">{{ error }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="modal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving…' : 'Assign' }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.tab-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.75rem; }
.tab-title { font-family:var(--ff-serif); font-size:1.3rem; color:var(--text); }
.tab-sub { font-size:.7rem; color:var(--muted); }
.load-error { font-size: 0.82rem; color: #b03030; margin-bottom: 0.75rem; }
.action-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--border-mid); border-radius: var(--radius-sm); background: transparent; color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s; margin-left: auto; }
.action-btn--danger:hover { background: rgba(176,48,48,0.08); color: #b03030; border-color: rgba(176,48,48,0.3); }
.modal-form { display:flex; flex-direction:column; gap:.9rem; }
.form-error { font-size:.75rem; color:#b94a48; }
.form-actions { display:flex; justify-content:flex-end; gap:.6rem; }
</style>
