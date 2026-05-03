import { ref, computed } from 'vue'

export const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday']

export const DAY_LABELS = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday',
}

export function useSchedule(fetchFn) {
  const schedule = ref({})
  const loading  = ref(false)

  const activeDays = computed(() => DAYS.filter(d => schedule.value[d]?.length))

  function sortedSlots(day) {
    return [...(schedule.value[day] ?? [])].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  }

  function slotStyle(slot) {
    const [sh, sm] = slot.starts_at.split(':').map(Number)
    const [eh, em] = slot.ends_at.split(':').map(Number)
    const mins   = (eh * 60 + em) - (sh * 60 + sm)
    return { height: `${Math.max(56, mins * 0.9)}px` }
  }

  function fmt(t) {
    return t ? t.slice(0, 5) : ''
  }

  async function load() {
    loading.value = true
    try {
      const res      = await fetchFn()
      schedule.value = res.data ?? {}
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return { schedule, loading, activeDays, sortedSlots, slotStyle, fmt, load }
}
