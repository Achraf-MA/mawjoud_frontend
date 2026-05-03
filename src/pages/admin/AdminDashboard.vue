<script setup>
import { ref } from 'vue'
import AdminUsersTab from '../../components/admin/AdminUsersTab.vue'
import AdminStudentsTab from '../../components/admin/AdminStudentsTab.vue'
import AdminLinksTab from '../../components/admin/AdminLinksTab.vue'
import AdminClassesTab from '../../components/admin/AdminClassesTab.vue'
import AdminSubjectsTab from '../../components/admin/AdminSubjectsTab.vue'
import AdminAssignmentsTab from '../../components/admin/AdminAssignmentsTab.vue'

const TABS = [
  { key: 'users',        label: 'Users'       },
  { key: 'students',     label: 'Students'    },
  { key: 'parent-links', label: 'Family Links'},
  { key: 'classes',      label: 'Classes'     },
  { key: 'subjects',     label: 'Subjects'    },
  { key: 'assignments',  label: 'Assignments' },
]

const active = ref('users')
</script>

<template>
  <div class="admin">

    <header class="page-header">
      <div>
        <p class="eyebrow">Administration</p>
        <h1 class="page-title">Admin Dashboard</h1>
      </div>
      <div class="page-header-right hide-mobile">
        <p class="page-date">{{ new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
      </div>
    </header>

    <div class="rule" style="margin-bottom: 1.75rem;" />

    <nav class="tab-nav" role="tablist">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': active === tab.key }"
        role="tab"
        :aria-selected="active === tab.key"
        @click="active = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="card tab-content">
      <Transition name="fade" mode="out-in">
        <AdminUsersTab       v-if="active === 'users'"        key="users" />
        <AdminStudentsTab    v-else-if="active === 'students'"     key="students" />
        <AdminLinksTab       v-else-if="active === 'parent-links'" key="parent-links" />
        <AdminClassesTab     v-else-if="active === 'classes'"      key="classes" />
        <AdminSubjectsTab    v-else-if="active === 'subjects'"     key="subjects" />
        <AdminAssignmentsTab v-else-if="active === 'assignments'"  key="assignments" />
      </Transition>
    </div>

  </div>
</template>

<style scoped>
.admin { max-width: 1100px; margin: 0 auto; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1rem;
}

.page-title {
  font-family: var(--ff-serif);
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  font-weight: 500;
  color: var(--text);
  letter-spacing: 0.01em;
  margin-top: 0.4rem;
  line-height: 1.1;
}

.page-date {
  font-family: var(--ff-serif);
  font-size: 0.85rem;
  font-style: italic;
  color: var(--muted);
}

/* Tabs */
.tab-nav {
  display: flex;
  gap: 0;
  margin-bottom: 0;
  border-bottom: 1px solid var(--border-mid);
  overflow-x: auto;
  scrollbar-width: none;
}
.tab-nav::-webkit-scrollbar { display: none; }

.tab-btn {
  appearance: none;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  font-family: var(--ff-sans);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.85rem 1.25rem;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.18s, border-color 0.18s;
  margin-bottom: -1px;
}
.tab-btn:hover { color: var(--text-mid); }
.tab-btn--active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* Content */
.tab-content {
  padding: 2rem;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: none;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 768px) {
  .tab-btn { padding: 0.75rem 0.9rem; font-size: 0.65rem; }
  .tab-content { padding: 1.25rem; }
}
</style>
