import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logout as apiLogout, getUser } from '../services/auth'

export const useAuth = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  async function fetchUser() {
    try {
      const res = await getUser()
      user.value = res.data
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  function setUser(u) {
    user.value = u
  }

  function clearUser() {
    user.value = null
  }

  async function logout() {
    try {
      await apiLogout()
    } catch {
      // even if request fails, clear local user
    }
    user.value = null
  }

  return { user, loading, fetchUser, setUser, clearUser, logout }
})