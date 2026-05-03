<script setup>
import { ref, onMounted } from 'vue'
import { getStudents, createStudent, getClasses } from '../../services/admin'
import BaseTable from '../ui/BaseTable.vue'
import BaseModal from '../ui/BaseModal.vue'
import FormField from '../ui/FormField.vue'

const students = ref([])
const classes  = ref([])

const loading  = ref(false)
const modal    = ref(false)
const saving   = ref(false)
const error    = ref('')

const form = ref({
  first_name: '',
  last_name: '',
  class_id: ''
})

const COLS = [
  { key: 'id',         label: '#', width: '3rem' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name',  label: 'Last Name' }
]

async function load() {
  loading.value = true
  try {
    students.value = (await getStudents()).data ?? []
  } catch (e) {
    error.value = 'Failed to load students.'
  } finally {
    loading.value = false
  }
}

async function loadClasses() {
  classes.value = (await getClasses()).data ?? []
}

function openModal() {
  form.value = { first_name: '', last_name: '', class_id: '' }
  error.value = ''
  modal.value = true
}

async function submit() {
  if (!form.value.first_name || !form.value.last_name || !form.value.class_id) {
    error.value = 'All fields required'
    return
  }

  saving.value = true
  error.value = ''

  try {
    await createStudent(form.value)
    await load()
    modal.value = false
  } catch (e) {
    error.value = e.message || 'An error occurred.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await load()
  await loadClasses()
})
</script>

<template>
  <div>
    <div class="tab-bar">
      <div>
        <p class="tab-title">Students</p>
        <p class="tab-sub">Manage students</p>
      </div>
      <button class="btn btn-ghost" @click="openModal">+ Add Student</button>
    </div>

    <BaseTable
      :columns="COLS"
      :rows="students"
      :loading="loading"
      empty="No students found."
    />

    <BaseModal title="New Student" :show="modal" @close="modal = false">
      <form @submit.prevent="submit" class="modal-form">
        <FormField label="First Name" v-model="form.first_name" required />
        <FormField label="Last Name" v-model="form.last_name" required />

        <FormField
          label="Class"
          type="select"
          v-model="form.class_id"
          :options="classes.map(c => ({ value: c.id, label: c.name }))"
          required
        />

        <p v-if="error" class="form-error">{{ error }}</p>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="modal = false">
            Cancel
          </button>
          <button type="submit" class="btn btn-ghost" :disabled="saving">
            {{ saving ? 'Saving' : 'Create' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: .75rem;
}

.tab-title {
  font-family: var(--ff-serif);
  font-size: 1.3rem;
  font-weight: 400;
  color: var(--text);
}

.tab-sub {
  font-size: .7rem;
  color: var(--muted);
  font-weight: 300;
  letter-spacing: .04em;
  margin-top: 2px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: .9rem;
}

.form-error {
  font-size: .75rem;
  color: #b94a48;
}

.form-actions {
  display: flex;
  gap: .6rem;
  justify-content: flex-end;
  margin-top: .4rem;
}

button[disabled] {
  opacity: .55;
  cursor: not-allowed;
}
</style>