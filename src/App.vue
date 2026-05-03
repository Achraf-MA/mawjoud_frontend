<script setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuth } from './stores/auth'
import LoginPage from './pages/LoginPage.vue'
import Dashboard from './pages/Dashboard.vue'

const authStore = useAuth()
const { user, loading } = storeToRefs(authStore)
const { fetchUser } = authStore

const theme = ref('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}

onMounted(() => {
  const saved = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  theme.value = saved
  document.documentElement.setAttribute('data-theme', saved)
  fetchUser()
})
</script>

<template>
  <div v-if="loading" class="app-loading">
    <div class="dot-loader"><span/><span/><span/></div>
  </div>

  <LoginPage v-else-if="!user" :theme="theme" @toggle-theme="toggleTheme" />

  <Dashboard v-else :theme="theme" @toggle-theme="toggleTheme" />
</template>

<style scoped>
.app-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}
</style>
