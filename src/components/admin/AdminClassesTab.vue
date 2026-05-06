<script setup>
import { ref, onMounted } from 'vue'
import { getClasses, createClass, updateClass, deleteClass } from '../../services/admin'
import BaseModal from '../ui/BaseModal.vue'
import BaseTable from '../ui/BaseTable.vue'
import FormField from '../ui/FormField.vue'

const classes = ref([])
const loading = ref(false)
const modal   = ref(false)
const saving  = ref(false)
const error   = ref('')
const editing = ref(null)
const form    = ref({ name: '' })

const COLS = [
  { key: 'id',   label: '#',         width: '3rem' },
  { key: 'name', label: 'Class Name' },
]

async function load() {
  loading.value = true
  try { classes.value = (await getClasses()).data ?? [] }
  catch { error.value = 'Failed to load classes.' }
  finally { loading.value = false }
}

function openCreate() { editing.value = null; form.value = { name: '' }; error.value = ''; modal.value = true }
function openEdit(cls) { editing.value = cls; form.value = { name: cls.name }; error.value = ''; modal.value = true }
function closeModal() { modal.value = false; editing.value = null }

async function submit() {
  if (!form.value.name.trim()) { error.value = 'Class name is required.'; return }
  saving.value = true; error.value = ''
  try {
    editing.value ? await updateClass(editing.value.id, form.value) : await createClass(form.value)
    await load(); closeModal()
  } catch (e) { error.value = e.message ?? 'An error occurred.' }
  finally { saving.value = false }
}

async function remove(cls) {
  if (!confirm(`Delete class "${cls.name}"? Students in this class will also be affected.`)) return
  try { await deleteClass(cls.id); await load() }
  catch (e) { error.value = e.message ?? 'Failed to delete class.' }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="tab-bar">
      <div><p class="tab-title">Classes</p><p class="tab-sub">Organise school classes</p></div>
      <button class="btn btn-ghost" @click="openCreate">+ Add Class</button>
    </div>

    <BaseTable :columns="COLS" :rows="classes" :loading="loading" empty="No classes found.">
      <template #cell-id="{ value }"><span class="cell-id">{{ String(value).padStart(3, '0') }}</span></template>
      <template #cell-name="{ value }"><span class="cell-name">{{ value }}</span></template>
      <template #actions="{ row }">
        <div class="row-actions">
          <button class="action-btn" @click="openEdit(row)" title="Edit"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></button>
          <button class="action-btn action-btn--danger" @click="remove(row)" title="Delete"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M5 3V2h3v1M4 3v7h5V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </template>
    </BaseTable>

    <div v-if="error && !modal" class="load-error">{{ error }}</div>

    <BaseModal :title="editing ? 'Edit Class' : 'New Class'" :show="modal" @close="closeModal">
      <form class="modal-form" @submit.prevent="submit">
        <FormField label="Class Name" v-model="form.name" placeholder="e.g. 3me A" required />
        <p v-if="error" class="form-error">{{ error }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Create Class') }}</button>
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
.load-error { font-size: 0.82rem; color: #b03030; margin-top: 0.75rem; }
.row-actions { display: flex; gap: 0.35rem; justify-content: flex-end; }
.action-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--border-mid); border-radius: var(--radius-sm); background: transparent; color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s; }
.action-btn:hover { background: var(--surface-3); color: var(--text); border-color: var(--border-strong); }
.action-btn--danger:hover { background: rgba(176,48,48,0.08); color: #b03030; border-color: rgba(176,48,48,0.3); }
.modal-form { display:flex; flex-direction:column; gap:.9rem; }
.form-error { font-size:.75rem; color:#b94a48; }
.form-actions { display:flex; gap:.6rem; justify-content:flex-end; margin-top:.4rem; }
</style>
