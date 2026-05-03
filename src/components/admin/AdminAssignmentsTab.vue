<script setup>
import { ref, onMounted } from 'vue'
import {
  getUsers,
  getClasses,
  getSubjects,
  assignTeacher,
  getAssignments
} from '../../services/admin'

import BaseTable from '../ui/BaseTable.vue'
import BaseModal from '../ui/BaseModal.vue'
import FormField from '../ui/FormField.vue'

const teachers = ref([])
const classes  = ref([])
const subjects = ref([])

const assignments = ref([])
const loading = ref(false)
const modal   = ref(false)
const saving  = ref(false)
const error   = ref('')

const form = ref({
  teacher_id: '',
  class_id: '',
  subject_id: ''
})

const COLS = [
  { key: 'teacher', label: 'Teacher' },
  { key: 'class',   label: 'Class' },
  { key: 'subject', label: 'Subject' }
]

// Load everything
async function load() {
  loading.value = true
  try {
    const usersRes = await getUsers()
    teachers.value = (usersRes.data ?? []).filter(u => u.role === 'teacher')

    const classesRes = await getClasses()
    classes.value = classesRes.data ?? []

    const subjectsRes = await getSubjects()
    subjects.value = subjectsRes.data ?? []

    const assignRes = await getAssignments()
    const raw = assignRes.data ?? []

    assignments.value = raw.map(a => ({
      teacher: a.teacher ?? '',
      class:   a.class ?? '',
      subject: a.subject ?? ''
    }))
  } catch (e) {
    error.value = 'Failed to load assignments.'
  } finally {
    loading.value = false
  }
}

// Open modal
function openModal() {
  form.value = { teacher_id: '', class_id: '', subject_id: '' }
  error.value = ''
  modal.value = true
}

// Submit assignment
async function submit() {
  if (!form.value.teacher_id || !form.value.class_id || !form.value.subject_id) {
    error.value = 'All fields required'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await assignTeacher(form.value)
    await load()
    modal.value = false
  } catch (e) {
    error.value = e.message || 'An error occurred.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="tab-bar">
      <div>
        <p class="tab-title">Assignments</p>
        <p class="tab-sub">Assign teachers to classes and subjects</p>
      </div>
      <button class="btn btn-ghost" @click="openModal">+ Assign</button>
    </div>

    <BaseTable
      :columns="COLS"
      :rows="assignments"
      :loading="loading"
      empty="No assignments yet."
    />

    <BaseModal title="New Assignment" :show="modal" @close="modal = false">
      <form @submit.prevent="submit" class="modal-form">

        <FormField
          label="Teacher"
          type="select"
          v-model="form.teacher_id"
          :options="teachers.map(t => ({ value: t.id, label: t.name }))"
          required
        />

        <FormField
          label="Class"
          type="select"
          v-model="form.class_id"
          :options="classes.map(c => ({ value: c.id, label: c.name }))"
          required
        />

        <FormField
          label="Subject"
          type="select"
          v-model="form.subject_id"
          :options="subjects.map(s => ({ value: s.id, label: s.name }))"
          required
        />

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="modal = false">
            Cancel
          </button>
          <button type="submit" class="btn btn-ghost" :disabled="saving">
            {{ saving ? 'Saving' : 'Assign' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.tab-bar {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:.75rem;
}

.tab-title {
  font-family:var(--ff-serif);
  font-size:1.3rem;
  color:var(--text);
}

.tab-sub {
  font-size:.7rem;
  color:var(--muted);
}

.modal-form {
  display:flex;
  flex-direction:column;
  gap:.9rem;
}

.form-error {
  font-size:.75rem;
  color:#b94a48;
}

.form-actions {
  display:flex;
  justify-content:flex-end;
  gap:.6rem;
}
</style>