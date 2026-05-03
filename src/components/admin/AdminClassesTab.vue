<script setup>
import { ref, onMounted } from 'vue'
import { getClasses, createClass } from '../../services/admin'
import BaseModal from '../ui/BaseModal.vue' 
import BaseTable from '../ui/BaseTable.vue'
import FormField from '../ui/FormField.vue'

const classes = ref([])
const loading = ref(false)
const modal   = ref(false)
const saving  = ref(false)
const error   = ref('')
const form    = ref({ name: '' })

// Backend schema: classes { id, name }
const COLS = [
  { key: 'id',   label: '#',          width: '3rem' },
  { key: 'name', label: 'Class Name' },
]

async function load() {
  loading.value = true
  try {
    classes.value = (await getClasses()).data ?? []
  } catch (e) {
    error.value = 'Failed to load classes.'
  } finally {
    loading.value = false
  }
}

function openModal() {
  form.value = { name: '' }
  error.value = ''
  modal.value = true
}

async function submit() {
  if (!form.value.name.trim()) { error.value = 'Class name is required.'; return }
  saving.value = true; error.value = ''
  try {
    await createClass({ name: form.value.name })
    await load()
    modal.value = false
  } catch (e) {
    error.value = e.message ?? 'An error occurred.'
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
        <p class="tab-title">Classes</p>
        <p class="tab-sub">Organise school classes</p>
      </div>
      <button class="btn btn-ghost" @click="openModal">+ Add Class</button>
    </div>
    <hr class="gold-rule" style="margin-bottom:1rem" />

    <BaseTable :columns="COLS" :rows="classes" :loading="loading" empty="No classes found.">
      <template #cell-id="{ value }">
        <span class="cell-id">{{ String(value).padStart(3, '0') }}</span>
      </template>
      <template #cell-name="{ value }">
        <span class="cell-name">{{ value }}</span>
      </template>
    </BaseTable>

    <BaseModal title="New Class" :show="modal" @close="modal = false">
      <form class="modal-form" @submit.prevent="submit">
        <FormField label="Class Name" v-model="form.name" placeholder="e.g. 3me A" required />
        <p v-if="error" class="form-error">{{ error }}</p>
        <div class="form-actions">
          <button type="button" class="btn-ghost btn-cancel" @click="modal = false">Cancel</button>
          <button type="submit" class="btn btn-ghost" :disabled="saving">
            {{ saving ? 'Saving' : 'Create Class' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.tab-bar { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.75rem; }
.tab-title { font-family:var(--ff-serif); font-size:1.3rem; font-weight:400; color:var(--text); }
.tab-sub { font-size:.7rem; color:var(--muted); font-weight:300; letter-spacing:.04em; margin-top:2px; }
.cell-id { font-family:var(--ff-serif); font-size:.78rem; color:#c8b89a; }
.cell-name { font-family:var(--ff-serif); font-size:.94rem; font-weight:400; color:var(--text); }
.modal-form { display:flex; flex-direction:column; gap:.9rem; }
.form-error { font-size:.75rem; color:#b94a48; }
.form-actions { display:flex; gap:.6rem; justify-content:flex-end; margin-top:.4rem; }
.btn-cancel { border-color:var(--border); color:var(--muted); }
.btn-cancel:hover { background:var(--surface-2); color:var(--text); box-shadow:none; transform:none; }
button[disabled] { opacity:.55; cursor:not-allowed; transform:none !important; box-shadow:none !important; }
</style>