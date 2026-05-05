<!--
  WeeklyTimetable.vue
  ───────────────────
  A calendar-style weekly timetable grid.

  Design approach:
    - Absolute positioning: each slot is placed at its exact start time
      and sized proportionally to its duration — like Google Calendar.
    - 1 hour = HOUR_PX pixels. The grid height is derived from this constant.
    - Time axis on the left shows hour labels aligned to their grid lines.
    - Today's column is subtly highlighted.
    - Slots are minimal — subject name + time range only. No card borders.

  Props:
    schedule    — { monday: [...slots], tuesday: [...slots], ... }
    activeDays  — subset of DAYS that have at least one slot
    sortedSlots — function(day) → ScheduleSlot[] sorted by starts_at
    todayName   — lowercase day name for today (e.g. 'monday')
    nextClassId — ID of the next upcoming slot today (highlighted differently)
-->

<script setup>
import { computed } from 'vue'
import { DAY_LABELS } from '../../composables/useSchedule'
import EmptyState from '../shared/EmptyState.vue'

const props = defineProps({
  schedule:    { type: Object,   required: true },
  activeDays:  { type: Array,    required: true },
  sortedSlots: { type: Function, required: true },
  slotStyle:   { type: Function, required: true }, // kept for API compat, unused
  todayName:   { type: String,   default: ''    },
  nextClassId: { type: Number,   default: null  },
})

// ── Grid constants ────────────────────────────────────────────────────────────

/** Pixels per hour — controls the vertical scale of the entire grid */
const HOUR_PX   = 64

/** Hours shown on the time axis (08:00 → 18:00) */
const HOURS     = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

/** Total grid height in pixels */
const GRID_H    = (HOURS.length - 1) * HOUR_PX

/** First hour shown — used to calculate slot top offset */
const START_H   = HOURS[0]

// ── Slot positioning ──────────────────────────────────────────────────────────

/**
 * Convert a HH:MM:SS time string to minutes since midnight.
 * @param {string} t
 * @returns {number}
 */
function toMins(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/**
 * Calculate the absolute top offset (px) for a slot based on its start time.
 * Slots starting before START_H are clamped to the top of the grid.
 *
 * @param {string} starts_at
 * @returns {number}
 */
function slotTop(starts_at) {
  const mins = toMins(starts_at) - START_H * 60
  return Math.max(0, (mins / 60) * HOUR_PX)
}

/**
 * Calculate the height (px) for a slot based on its duration.
 * Minimum height of 28px ensures very short slots remain readable.
 *
 * @param {string} starts_at
 * @param {string} ends_at
 * @returns {number}
 */
function slotHeight(starts_at, ends_at) {
  const mins = toMins(ends_at) - toMins(starts_at)
  return Math.max(28, (mins / 60) * HOUR_PX)
}

/**
 * Format HH:MM:SS → HH:MM for display inside slots.
 * @param {string} t
 * @returns {string}
 */
function fmt(t) {
  return t ? t.slice(0, 5) : ''
}

/**
 * Build the full name of a teacher from their user object.
 * @param {{ first_name?: string, last_name?: string }|null} t
 * @returns {string}
 */
function teacherName(t) {
  if (!t) return ''
  return `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()
}

// ── Colour palette for subjects ───────────────────────────────────────────────
// Slots are coloured by subject name so the same subject always gets the
// same colour across different days, making the pattern instantly readable.

const PALETTE = [
  { bg: 'rgba(26,58,42,0.10)',  border: 'var(--accent)',    text: 'var(--accent)'    },
  { bg: 'rgba(24,95,165,0.10)', border: '#185fa5',          text: '#185fa5'          },
  { bg: 'rgba(184,122,0,0.10)', border: '#b87a00',          text: '#b87a00'          },
  { bg: 'rgba(122,60,181,0.10)',border: '#7a3cb5',          text: '#7a3cb5'          },
  { bg: 'rgba(176,48,48,0.10)', border: '#b03030',          text: '#b03030'          },
  { bg: 'rgba(0,128,128,0.10)', border: '#006666',          text: '#006666'          },
]

// Map subject name → palette entry, assigned on first encounter
const subjectColorMap = {}
let   colorIndex      = 0

/**
 * Return a consistent colour for a given subject name.
 * The same subject always maps to the same palette slot within a session.
 *
 * @param {string} subjectName
 * @returns {{ bg: string, border: string, text: string }}
 */
function colorFor(subjectName) {
  if (!subjectColorMap[subjectName]) {
    subjectColorMap[subjectName] = PALETTE[colorIndex % PALETTE.length]
    colorIndex++
  }
  return subjectColorMap[subjectName]
}


function getPositionedSlots(day) {
  const slots = props.sortedSlots(day).map(s => ({
    ...s,
    start: toMins(s.starts_at),
    end: toMins(s.ends_at),
  }))

  const positioned = []

  for (const slot of slots) {
    // find overlapping group
    let group = positioned.find(g =>
      g.some(s => !(slot.end <= s.start || slot.start >= s.end))
    )

    if (!group) {
      group = []
      positioned.push(group)
    }

    group.push(slot)
  }

  // assign positions
  return positioned.flatMap(group => {
    const count = group.length

    return group.map((slot, index) => ({
      ...slot,
      overlapIndex: index,
      overlapCount: count
    }))
  })
}

</script>

<template>
  <div class="card timetable-card">

    <EmptyState v-if="!activeDays.length" title="No schedule available yet." :icon="false" />

    <div v-else class="timetable">

      <!-- ── Time axis ────────────────────────────────────────────────────── -->
      <div class="time-axis">
        <!-- Blank cell above the axis to align with day headers -->
        <div class="axis-spacer" />

        <!-- Scrollable time column -->
        <div class="axis-body" :style="{ height: GRID_H + 'px' }">
          <div
            v-for="h in HOURS"
            :key="h"
            class="axis-tick"
            :style="{ top: ((h - START_H) * HOUR_PX) + 'px' }"
          >
            {{ String(h).padStart(2, '0') }}:00
          </div>
        </div>
      </div>

      <!-- ── Day columns ──────────────────────────────────────────────────── -->
      <div class="days-row">
        <div
          v-for="day in activeDays"
          :key="day"
          class="day-col"
          :class="{ 'day-col--today': day === todayName }"
        >
          <!-- Day header -->
          <div class="day-header">
            <span class="day-label">{{ DAY_LABELS[day].slice(0, 3).toUpperCase() }}</span>
            <span v-if="day === todayName" class="today-dot" />
          </div>

          <!-- Slot grid — positioned absolutely within a fixed-height container -->
          <div class="day-grid" :style="{ height: GRID_H + 'px' }">

            <!-- Horizontal hour lines — purely decorative -->
            <div
              v-for="h in HOURS"
              :key="h"
              class="hour-line"
              :style="{ top: ((h - START_H) * HOUR_PX) + 'px' }"
            />

            <!-- Schedule slots -->
            <div
              v-for="slot in getPositionedSlots(day)"
              :key="slot.id"
              class="slot"
              :class="{ 'slot--next': day === todayName && nextClassId === slot.id }"
              :style="{
                top: slotTop(slot.starts_at) + 'px',
                height: slotHeight(slot.starts_at, slot.ends_at) + 'px',

                width: `calc((100% - 8px) / ${slot.overlapCount})`,
                left: `calc(${slot.overlapIndex} * (100% / ${slot.overlapCount}) + 4px)`,

                background: colorFor(slot.subject?.name).bg,
                borderColor: colorFor(slot.subject?.name).border,
                '--slot-text': colorFor(slot.subject?.name).text,
              }"
            >
              <p class="slot-subject">{{ slot.subject?.name }}</p>
              <p class="slot-time">{{ fmt(slot.starts_at) }}–{{ fmt(slot.ends_at) }}</p>
              <p v-if="slotHeight(slot.starts_at, slot.ends_at) > 48" class="slot-teacher">
                {{ teacherName(slot.teacher) }}
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Card wrapper ──────────────────────────────────────────────────────────── */
.timetable-card { overflow: hidden; }

/* ── Main layout: time axis + scrollable day columns ──────────────────────── */
.timetable {
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-mid) transparent;
}

/* ── Time axis ─────────────────────────────────────────────────────────────── */
.time-axis {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 48px;
  border-right: 1px solid var(--border);
}

.axis-spacer {
  /* Matches the height of the day header so the first tick aligns with 08:00 */
  height: 40px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.axis-body {
  position: relative;
  flex: 1;
}

.axis-tick {
  position: absolute;
  right: 8px;
  font-size: 0.55rem;
  font-weight: 500;
  color: var(--muted-lt);
  letter-spacing: 0.04em;
  /* Nudge the label up so it sits on top of its corresponding hour line */
  transform: translateY(-50%);
  white-space: nowrap;
}

/* ── Day columns row ───────────────────────────────────────────────────────── */
.days-row {
  display: flex;
  flex: 1;
  min-width: 0;
}

.day-col {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
}
.day-col:last-child { border-right: none; }

/* Highlight today's column with a very subtle background tint */
.day-col--today { background: var(--accent-dim); }

/* ── Day header ────────────────────────────────────────────────────────────── */
.day-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.day-label {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--muted);
}
.day-col--today .day-label { color: var(--accent); }

.today-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-lt);
  flex-shrink: 0;
}

/* ── Slot grid ─────────────────────────────────────────────────────────────── */
.day-grid {
  position: relative;
  /* Prevent slots from overflowing the column */
  overflow: hidden;
}

/* Subtle hour divider lines — gives the grid structure without clutter */
.hour-line {
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  background: var(--border);
  pointer-events: none;
}

/* ── Individual slot ───────────────────────────────────────────────────────── */
.slot {
  position: absolute;
  /* Inset slightly from the column edges so adjacent columns feel separated */
  left: 4px;
  right: 4px;
  border-left: 3px solid;
  border-radius: var(--radius);
  padding: 4px 6px;
  overflow: hidden;
  cursor: default;
  transition: filter 0.15s, transform 0.15s;
}

.slot:hover {
  filter: brightness(0.95);
  transform: scaleX(1.01);
  z-index: 2;
}

/* The "next upcoming class" slot gets a ring to draw the eye */
.slot--next {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

/* Subject name — primary label, bold and coloured */
.slot-subject {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--slot-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

/* Time range — secondary label, smaller */
.slot-time {
  font-size: 0.58rem;
  font-weight: 500;
  color: var(--slot-text);
  opacity: 0.75;
  margin-top: 1px;
  white-space: nowrap;
}

/* Teacher — only shown when the slot is tall enough to fit it */
.slot-teacher {
  font-size: 0.58rem;
  color: var(--slot-text);
  opacity: 0.6;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .day-col  { min-width: 80px; }
  .time-axis { width: 36px; }
  .axis-tick { font-size: 0.5rem; right: 4px; }
}
</style>
