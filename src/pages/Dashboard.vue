<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from '../stores/auth'
import AdminDashboard from './admin/AdminDashboard.vue'
import TeacherDashboard from './teacher/TeacherDashboard.vue'
import ParentDashboard from './parent/ParentDashboard.vue'
import CpeDashboard from './cpe/CpeDashboard.vue'
import StudentDashboard from './student/StudentDashboard.vue'

const props = defineProps({
  theme: { type: String, default: 'light' }
})
const emit = defineEmits(['toggle-theme'])

const authStore = useAuth()
const { user } = storeToRefs(authStore)
const { logout } = authStore

const component = computed(() => {
  switch (user.value?.role) {
    case 'admin':   return AdminDashboard
    case 'teacher': return TeacherDashboard
    case 'parent':  return ParentDashboard
    case 'cpe':     return CpeDashboard
    case 'student': return StudentDashboard
    default:        return null
  }
})

const roleLabel = computed(() => {
  const map = { admin: 'Admin', teacher: 'Teacher', parent: 'Parent', cpe: 'Surveillant', student: 'Student' }
  return map[user.value?.role] ?? user.value?.role?.toUpperCase() ?? ''
})
</script>

<template>
  <div class="shell">

    <header class="topbar">
      <div class="topbar-left">
        <div class="crest">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" rx="2" stroke="currentColor" stroke-width="1.2"/>
            <path d="M11 4 L11 18 M4 11 L18 11" stroke="currentColor" stroke-width="1"/>
            <circle cx="11" cy="11" r="3" stroke="currentColor" stroke-width="1"/>
          </svg>
        </div>
        <div class="brand">
          <span class="brand-name">Mawjoud</span>
          <span class="brand-sub">Academic Management</span>
        </div>
      </div>

      <div class="topbar-right">
        <span class="user-info hide-mobile">
          <span class="user-name">{{ user?.first_name }} {{ user?.last_name }}</span>
          <span class="role-pill">{{ roleLabel }}</span>
        </span>
        <button class="theme-toggle" @click="emit('toggle-theme')" :aria-label="'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' mode'" />
        <button class="btn btn-ghost logout-btn" @click="logout">Sign out</button>
      </div>
    </header>

    <div class="topbar-rule" />

    <main class="shell-content">
      <component :is="component" />
    </main>

  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

/* Topbar */
.topbar {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  background: var(--surface);
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-rule {
  height: 1px;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-lt) 30%, transparent 80%);
  opacity: 0.35;
}

.topbar-left { display: flex; align-items: center; gap: 0.85rem; }

.crest {
  width: 34px; height: 34px;
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  color: var(--accent);
  flex-shrink: 0;
}

.brand { display: flex; flex-direction: column; gap: 1px; }
.brand-name {
  font-family: var(--ff-serif);
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.04em;
  line-height: 1;
}
.brand-sub {
  font-size: 0.58rem;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}

.topbar-right { display: flex; align-items: center; gap: 1rem; }

.user-info { display: flex; align-items: center; gap: 0.65rem; }
.user-name {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--text-mid);
}
.role-pill {
  font-size: 0.52rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-dim);
  border: 1px solid var(--border-mid);
  border-radius: 20px;
  padding: 0.2rem 0.65rem;
}

.logout-btn {
  font-size: 0.62rem;
  padding: 0.42rem 0.9rem;
}

/* Content */
.shell-content {
  flex: 1;
  padding: 2rem 1.75rem 3rem;
}

@media (max-width: 768px) {
  .topbar { padding: 0 1rem; }
  .shell-content { padding: 1.25rem 1rem 2rem; }
}
</style>
