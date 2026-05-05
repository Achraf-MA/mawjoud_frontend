/**
 * @module composables/useSchedule
 *
 * Reusable schedule/timetable logic shared across Student, Parent, and Surveillant dashboards.
 * Handles fetching, day grouping, slot sorting, and proportional height calculation for the
 * weekly timetable grid.
 *
 * Exports:
 *   DAYS       — ordered array of day name strings (monday … saturday)
 *   DAY_LABELS — human-readable display names keyed by day string
 *   useSchedule — composable factory
 */

import { ref, computed } from 'vue'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * Canonical day order used to sort timetable columns.
 * Saturday is included to support schools with Saturday sessions —
 * it will simply not appear if no slots are scheduled.
 */
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * Human-readable display labels for each day key.
 * Used in column headers and the "Today" panel label.
 */
export const DAY_LABELS = {
  monday:    'Monday',
  tuesday:   'Tuesday',
  wednesday: 'Wednesday',
  thursday:  'Thursday',
  friday:    'Friday',
  saturday:  'Saturday',
}

// ─────────────────────────────────────────────
// useSchedule
// ─────────────────────────────────────────────

/**
 * Fetches and manages a weekly schedule from any role-specific endpoint.
 * The fetch function is injected so this composable works for students,
 * parents, and surveillants without modification.
 *
 * @param {() => Promise<{ data: Record<string, ScheduleSlot[]> }>} fetchFn
 *   A service function that returns the schedule grouped by day name
 *
 * @returns {{
 *   schedule:    Ref<Record<string, ScheduleSlot[]>>,
 *   loading:     Ref<boolean>,
 *   activeDays:  ComputedRef<string[]>,   Only days that have at least one slot
 *   sortedSlots: (day: string) => ScheduleSlot[],
 *   slotStyle:   (slot: ScheduleSlot) => { height: string },
 *   fmt:         (time: string) => string,
 *   load:        () => Promise<void>
 * }}
 */
export function useSchedule(fetchFn) {
  const schedule = ref({})
  const loading  = ref(false)

  /**
   * Only days that have at least one scheduled slot are shown in the timetable.
   * Empty days (e.g. Saturday when unused) are hidden to avoid wasted whitespace.
   */
  const activeDays = computed(() => DAYS.filter(d => schedule.value[d]?.length))

  /**
   * Return slots for a given day sorted by start time ascending.
   * We sort client-side because the backend's groupBy order is not guaranteed.
   *
   * @param {string} day - Day key (e.g. 'monday')
   * @returns {ScheduleSlot[]}
   */
  function sortedSlots(day) {
    return [...(schedule.value[day] ?? [])].sort((a, b) =>
      a.starts_at.localeCompare(b.starts_at)
    )
  }

  /**
   * Calculate proportional height for a timetable slot card.
   * Based on duration in minutes × 0.9px, with a minimum of 56px
   * to ensure short slots (< 1 hour) remain readable.
   *
   * @param {{ starts_at: string, ends_at: string }} slot
   * @returns {{ height: string }} Inline style object for the slot element
   */
  function slotStyle(slot) {
    const [sh, sm] = slot.starts_at.split(':').map(Number)
    const [eh, em] = slot.ends_at.split(':').map(Number)
    const mins     = (eh * 60 + em) - (sh * 60 + sm)
    return { height: `${Math.max(56, mins * 0.9)}px` }
  }

  /**
   * Format a HH:MM:SS time string to HH:MM for display.
   *
   * @param {string} t - Raw time string from the backend (e.g. '09:00:00')
   * @returns {string} Truncated to HH:MM (e.g. '09:00')
   */
  function fmt(t) {
    return t ? t.slice(0, 5) : ''
  }

  /**
   * Fetch the schedule from the backend and populate the reactive state.
   * Errors are logged but not surfaced — the template handles the empty state.
   */
  async function load() {
    loading.value = true
    try {
      const res      = await fetchFn()
      schedule.value = res.data ?? {}
    } catch (e) {
      console.error('[useSchedule] Failed to load schedule:', e)
    } finally {
      loading.value = false
    }
  }

  return { schedule, loading, activeDays, sortedSlots, slotStyle, fmt, load }
}
