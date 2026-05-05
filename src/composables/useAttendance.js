/**
 * @module composables/useAttendance
 *
 * Reusable attendance logic extracted from dashboard components.
 * Provides two composables:
 *
 *   useAttendanceStats  — live computed stats derived from the teacher's "marked" map
 *   useAttendanceHistory — paginated attendance fetch + computed stats for history views
 */

import { ref, computed } from 'vue'

// ─────────────────────────────────────────────
// useAttendanceStats
// ─────────────────────────────────────────────

/**
 * Derives real-time attendance statistics from the teacher dashboard's reactive
 * "marked" map and "students" array. Updates automatically as records are marked.
 *
 * Used by: TeacherDashboard
 *
 * @param {Ref<Record<number, { status: string, date: string }>>} markedRef
 *   Map of student ID → latest marked attendance for today's session
 * @param {Ref<Student[]>} studentsRef
 *   The full roster for the currently selected class
 *
 * @returns {{
 *   presentCount:  ComputedRef<number>,
 *   absentCount:   ComputedRef<number>,
 *   lateCount:     ComputedRef<number>,
 *   unmarkedCount: ComputedRef<number>,
 *   pct:           ComputedRef<number>   Percentage of students marked present (0–100)
 * }}
 */
export function useAttendanceStats(markedRef, studentsRef) {
  const presentCount  = computed(() => Object.values(markedRef.value).filter(m => m.status === 'present').length)
  const absentCount   = computed(() => Object.values(markedRef.value).filter(m => m.status === 'absent').length)
  const lateCount     = computed(() => Object.values(markedRef.value).filter(m => m.status === 'late').length)

  // Unmarked = students whose ID does not appear in the marked map at all.
  // We count directly from the students list rather than subtracting to avoid
  // going negative when the marked map contains stale cross-subject records.
  const unmarkedCount = computed(() =>
    studentsRef.value.filter(s => !markedRef.value[s.id]).length
  )

  // Attendance rate is present ÷ total students (not present ÷ marked)
  // so that unmarked students count against the rate
  const pct = computed(() =>
    studentsRef.value.length
      ? Math.round(presentCount.value / studentsRef.value.length * 100)
      : 0
  )

  return { presentCount, absentCount, lateCount, unmarkedCount, pct }
}

// ─────────────────────────────────────────────
// useAttendanceHistory
// ─────────────────────────────────────────────

/**
 * Fetches a paginated attendance history from any role-specific endpoint
 * and exposes reactive state + derived stats for rendering.
 *
 * The fetch function is injected so this composable can be reused across
 * Student, Parent, and any future role that needs attendance history.
 *
 * Used by: StudentDashboard, ParentDashboard
 *
 * @param {() => Promise<any>} fetchFn
 *   A service function that accepts a page number and returns a Laravel paginator response
 *
 * @returns {{
 *   records:      Ref<AttendanceRecord[]>,
 *   loading:      Ref<boolean>,
 *   page:         Ref<number>,
 *   lastPage:     Ref<number>,
 *   load:         (page?: number) => Promise<void>,
 *   presentCount: ComputedRef<number>,
 *   absentCount:  ComputedRef<number>,
 *   lateCount:    ComputedRef<number>,
 *   pct:          ComputedRef<number>
 * }}
 */
export function useAttendanceHistory(fetchFn) {
  const records  = ref([])
  const loading  = ref(false)
  const page     = ref(1)
  const lastPage = ref(1)

  // Derived stats computed over the full loaded page — not the entire history.
  // The ring chart and summary cards reflect whichever page is currently visible.
  const presentCount = computed(() => records.value.filter(r => r.status === 'present').length)
  const absentCount  = computed(() => records.value.filter(r => r.status === 'absent').length)
  const lateCount    = computed(() => records.value.filter(r => r.status === 'late').length)

  const pct = computed(() =>
    records.value.length
      ? Math.round(presentCount.value / records.value.length * 100)
      : 0
  )

  /**
   * Load a specific page of attendance records.
   * Silently logs errors — the caller can check records.value.length to detect failure.
   *
   * @param {number} p - 1-based page number (defaults to 1)
   */
  async function load(p = 1) {
    loading.value = true
    try {
      const res  = await fetchFn(p)

      // The backend wraps responses in { data: paginator } via ApiResponse trait.
      // Fall back to the raw response if the wrapper is absent (legacy endpoints).
      const body = res.data ?? res

      records.value  = body.data         ?? (Array.isArray(body) ? body : [])
      page.value     = body.current_page ?? 1
      lastPage.value = body.last_page    ?? 1
    } catch (e) {
      console.error('[useAttendanceHistory] Failed to load attendance:', e)
    } finally {
      loading.value = false
    }
  }

  return { records, loading, page, lastPage, load, presentCount, absentCount, lateCount, pct }
}
