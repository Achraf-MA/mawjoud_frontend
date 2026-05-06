<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUsers, createUser, updateUser, deleteUser, getClasses } from '../../services/admin'
import BaseTable from '../ui/BaseTable.vue'
import BaseModal from '../ui/BaseModal.vue'
import FormField from '../ui/FormField.vue'

const users   = ref([])
const classes = ref([])
const loading = ref(false)
const modal   = ref(false)
const saving  = ref(false)
const error   = ref('')
const editing = ref(null)

const emptyForm = () => ({ first_name: '', last_name: '', email: '', password: '', role: '', class_id: '' })
const form = ref(emptyForm())

const ROLES = [
  { value: 'admin',   label: 'Admin'       },
  { value: 'teacher', label: 'Teacher'     },
  { value: 'cpe',     label: 'Surveillant' },
  { value: 'parent',  label: 'Parent'      },
  { value: 'student', label: 'Student'     },
]
const classOptions = computed(() => classes.value.map(c => ({ value: c.id, label: c.name })))

const COLS = [
  { key: 'id',         label: 'ID',        width: '4rem' },
  { key: 'first_name', label: 'First name' },
  { key: 'last_name',  label: 'Last name'  },
  { key: 'email',      label: 'Email'      },
  { key: 'role',       label: 'Role',      width: '7rem' },
]
const ROLE_LABELS = { admin: 'Admin', teacher: 'Teacher', cpe: 'Surveillant', parent: 'Parent', student: 'Student' }

async function load() {
  loading.value = true
  try {
    const [usersRes, classesRes] = await Promise.all([getUsers(), getClasses()])
    users.value   = usersRes.data   ?? []
    classes.value = classesRes.data ?? []
  } catch { error.value = 'Failed to load users.' }
  finally { loading.value = false }
}

function openCreate() { editing.value = null; form.value = emptyForm(); error.value = ''; modal.value = true }
function openEdit(user) {
  editing.value = user
  form.value = { first_name: user.first_name, last_name: user.last_name, email: user.email, password: '', role: user.role, class_id: user.student?.class_id ?? '' }
  error.value = ''; modal.value = true
}
function closeModal() { modal.value = false; editing.value = null }

async function submit() {
  const { first_name, last_name, email, password, role, class_id } = form.value
  if (!first_name || !last_name || !email || !role) { error.value = 'First name, last name, email and role are required.'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { error.value = 'Please enter a valid email address.'; return }
  if (!editing.value && !password) { error.value = 'Password is required.'; return }
  if (password && password.length < 8) { error.value = 'Password must be at least 8 characters.'; return }
  if (role === 'student' && !class_id) { error.value = 'Please select a class for the student.'; return }
  saving.value = true; error.value = ''
  try {
    editing.value ? await updateUser(editing.value.id, form.value) : await createUser(form.value)
    await load(); closeModal()
  } catch (e) { error.value = e.message ?? 'An error occurred.' }
  finally { saving.value = false }
}

async function remove(user) {
  if (!confirm(`Delete ${user.first_name} ${user.last_name}? This cannot be undone.`)) return
  try { await deleteUser(user.id); await load() }
  catch (e) { error.value = e.message ?? 'Failed to delete user.' }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="tab-bar">
      <div><p class="tab-title">Users</p><p class="tab-sub">Manage system accounts and roles</p></div>
      <button class="btn btn-ghost" @click="openCreate">+ Add user</button>
    </div>
    <div v-if="error && !modal" class="load-error">{{ error }}</div>

    <BaseTable :columns="COLS" :rows="users" :loading="loading" empty="No users found.">
      <template #cell-id="{ value }"><span class="cell-id">{{ String(value).padStart(3, '0') }}</span></template>
      <template #cell-first_name="{ value }"><span class="cell-name">{{ value }}</span></template>
      <template #cell-role="{ value }"><span class="role-pill" :class="`role--${value}`">{{ ROLE_LABELS[value] ?? value }}</span></template>
      <template #actions="{ row }">
        <div class="row-actions">
          <button class="action-btn" @click="openEdit(row)" title="Edit"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 2l2 2-7 7H2v-2L9 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg></button>
          <button class="action-btn action-btn--danger" @click="remove(row)" title="Delete"><svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3h9M5 3V2h3v1M4 3v7h5V3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </template>
    </BaseTable>

    <BaseModal :title="editing ? 'Edit User' : 'New User'" :show="modal" @close="closeModal">
      <form class="modal-form" @submit.prevent="submit">
        <div class="form-row">
          <FormField label="First name" v-model="form.first_name" placeholder="Jane"   required />
          <FormField label="Last name"  v-model="form.last_name"  placeholder="Dupont" required />
        </div>
        <FormField label="Email"    v-model="form.email"    type="email"    placeholder="jane@school.edu" required />
        <FormField :label="editing ? 'New password (leave blank to keep)' : 'Password'" v-model="form.password" type="password" placeholder="••••••••" :required="!editing" />
        <FormField label="Role" v-model="form.role" type="select" :options="ROLES" required />
        <Transition name="slide">
          <FormField v-if="form.role === 'student'" label="Class" v-model="form.class_id" type="select" :options="classOptions" required />
        </Transition>
        <p v-if="error" class="form-error">{{ error }}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="closeModal">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? 'Saving…' : (editing ? 'Save changes' : 'Create user') }}</button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>

<style scoped>
.tab-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.tab-title { font-family: var(--ff-serif); font-size: 1.25rem; font-weight: 500; color: var(--text); }
.tab-sub { font-size: 0.75rem; color: var(--muted); margin-top: 2px; }
.load-error { font-size: 0.82rem; color: #b03030; margin-bottom: 1rem; }
.cell-id { font-size: 0.78rem; color: var(--muted); font-weight: 300; }
.cell-name { font-weight: 500; color: var(--text); }
.role-pill { display: inline-block; font-size: 0.58rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; padding: 0.22rem 0.65rem; border-radius: 20px; border: 1px solid var(--border-mid); color: var(--muted); }
.role--admin   { color: var(--accent);    background: var(--accent-dim);     border-color: var(--border-strong); }
.role--teacher { color: var(--accent-lt); background: var(--accent-dim);     border-color: var(--border-mid); }
.role--cpe     { color: #185fa5;          background: rgba(24,95,165,0.07);  border-color: rgba(24,95,165,0.2); }
.role--parent  { color: var(--muted);     background: var(--surface-3);      border-color: var(--border-mid); }
.role--student { color: #7a3cb5;          background: rgba(122,60,181,0.07); border-color: rgba(122,60,181,0.2); }
.row-actions { display: flex; gap: 0.35rem; justify-content: flex-end; }
.action-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--border-mid); border-radius: var(--radius-sm); background: transparent; color: var(--muted); cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s; }
.action-btn:hover { background: var(--surface-3); color: var(--text); border-color: var(--border-strong); }
.action-btn--danger:hover { background: rgba(176,48,48,0.08); color: #b03030; border-color: rgba(176,48,48,0.3); }
.modal-form { display: flex; flex-direction: column; gap: 1rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.form-error { font-size: 0.78rem; color: #b03030; }
.form-actions { display: flex; gap: 0.65rem; justify-content: flex-end; margin-top: 0.5rem; }
.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
