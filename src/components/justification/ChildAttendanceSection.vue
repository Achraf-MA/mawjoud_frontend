<!--
  ChildAttendanceSection.vue
  ──────────────────────────
  Renders the attendance records for a single child as a labelled section
  with an avatar header and a table of records.

  The "Justify" button is shown only when:
    1. The record's status is NOT 'present' (absent or late qualify for justification)
    2. No justification has been submitted yet (rec.justification is null)

  When a justification already exists, a status pill replaces the button
  so the parent can see the outcome (pending / accepted / rejected) at a glance.

  Props:
    studentName — display name shown in the section header
    records     — array of AttendanceRecord objects belonging to this child

  Emits:
    justify(record) — when the parent clicks the Justify button for a record
-->

<script setup>
import StatusPill from '../shared/StatusPill.vue'
import { formatDate, personInitials } from '../../composables/useDate'

defineProps({
  /** Full name of the child (derived from student.first_name + last_name) */
  studentName: { type: String, required: true },
  /** All attendance records belonging to this child on the current page */
  records:     { type: Array,  required: true },
})

const emit = defineEmits(['justify'])

/**
 * Determine whether the Justify button should be shown for a given record.
 * A record is justifiable when it has a non-present status AND no existing justification.
 *
 * @param {AttendanceRecord} rec
 * @returns {boolean}
 */
function canJustify(rec) {
  return rec.status !== 'present' && !rec.justification
}
</script>

<template>
  <div class="child-section">

    <!-- ── Student header ── -->
    <div class="child-head">
      <div class="avatar avatar-md avatar--accent">
        {{ personInitials(...studentName.split(' ')) }}
      </div>
      <div class="child-meta">
        <p class="child-name">{{ studentName }}</p>
        <p class="child-summary">
          {{ records.filter(r => r.status === 'absent').length }} absences ·
          {{ records.filter(r => r.status === 'present').length }} present ·
          {{ records.filter(r => r.justification).length }} justified
        </p>
      </div>
    </div>

    <!-- ── Records table ── -->
    <div class="card records-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Justification</th>
              <!-- Right-aligned column — only visible rows with an action render content -->
              <th style="text-align:right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(rec, i) in records"
              :key="rec.id"
              :class="`row--${rec.status}`"
              :style="{ animationDelay: `${i * 20}ms` }"
              class="row-in"
            >
              <!-- Date — serif italic for visual rhythm -->
              <td style="font-family:var(--ff-serif);font-style:italic;color:var(--text)">
                {{ formatDate(rec.date) }}
              </td>

              <!-- Subject name -->
              <td style="font-weight:500;color:var(--text)">{{ rec.subject?.name ?? '—' }}</td>

              <!-- Attendance status pill -->
              <td><StatusPill :status="rec.status" /></td>

              <!-- Justification status — em-dash when none submitted -->
              <td>
                <span v-if="!rec.justification" style="color:var(--muted-lt);font-size:0.82rem">—</span>
                <StatusPill v-else :status="rec.justification.status" />
              </td>

              <!-- Action column
                   Show "Justify" only when the record is justifiable.
                   Once justified (any status), render a dash so the column stays clean. -->
              <td style="text-align:right">
                <button
                  v-if="canJustify(rec)"
                  class="btn btn-ghost justify-btn"
                  @click="emit('justify', rec)"
                >
                  Justify
                </button>
                <span v-else style="color:var(--muted-lt);font-size:0.82rem">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Child section wrapper ───────────────────────────────────────────────── */
.child-section  { display: flex; flex-direction: column; gap: 0.85rem; }

/* ── Student header ──────────────────────────────────────────────────────── */
.child-head     { display: flex; align-items: center; gap: 0.9rem; }
.child-meta     { display: flex; flex-direction: column; gap: 2px; }
.child-name     { font-family: var(--ff-serif); font-size: 1.1rem; font-weight: 500; color: var(--text); }
.child-summary  { font-size: 0.75rem; color: var(--muted); }

/* ── Records card ────────────────────────────────────────────────────────── */
.records-card  { overflow: hidden; }

/* ── Justify button — compact ghost variant ───────────────────────────────── */
.justify-btn   { font-size: 0.62rem; padding: 0.35rem 0.85rem; }
</style>
