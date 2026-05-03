import { ref, computed } from 'vue'

export function useAttendanceStats(markedRef, studentsRef) {
  const presentCount  = computed(() => Object.values(markedRef.value).filter(m => m.status === 'present').length)
  const absentCount   = computed(() => Object.values(markedRef.value).filter(m => m.status === 'absent').length)
  const lateCount     = computed(() => Object.values(markedRef.value).filter(m => m.status === 'late').length)
  const unmarkedCount = computed(() => studentsRef.value.length - presentCount.value - absentCount.value - lateCount.value)
  const pct           = computed(() => studentsRef.value.length
    ? Math.round(presentCount.value / studentsRef.value.length * 100) : 0)

  return { presentCount, absentCount, lateCount, unmarkedCount, pct }
}

export function useAttendanceHistory(fetchFn) {
  const records  = ref([])
  const loading  = ref(false)
  const page     = ref(1)
  const lastPage = ref(1)

  const presentCount  = computed(() => records.value.filter(r => r.status === 'present').length)
  const absentCount   = computed(() => records.value.filter(r => r.status === 'absent').length)
  const lateCount     = computed(() => records.value.filter(r => r.status === 'late').length)
  const pct           = computed(() => records.value.length
    ? Math.round(presentCount.value / records.value.length * 100) : 0)

  async function load(p = 1) {
    loading.value = true
    try {
      const res  = await fetchFn(p)
      const body = res.data ?? res
      records.value  = body.data          ?? (Array.isArray(body) ? body : [])
      page.value     = body.current_page  ?? 1
      lastPage.value = body.last_page     ?? 1
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  return { records, loading, page, lastPage, load, presentCount, absentCount, lateCount, pct }
}
