<!--
  JustificationCard.vue
  ─────────────────────
  Displays a single justification record in the Surveillant's review queue.
  Each card shows:
    - Student identity (avatar + name + absence date + subject)
    - Current justification status (pending / accepted / rejected)
    - Parent's written comment, if provided
    - Link to the attached document, if provided
    - Accept / Reject action buttons (only when status is 'pending')
    - A "Processed on <date>" note (only when already reviewed)

  A coloured left border visually encodes the status at a glance:
    amber → pending, green → accepted, red → rejected

  Props:
    record    — a Justification object with nested attendance, student, subject
    reviewing — the ID currently being processed (shows a loader on that card)

  Emits:
    review(id, status) — when the surveillant clicks Accept or Reject
-->

<script setup>
import StatusPill from '../shared/StatusPill.vue'
import { formatDate, personInitials } from '../../composables/useDate'

defineProps({
  /** Justification record including nested attendance → student/subject */
  record:    { type: Object,          required: true },
  /** ID of the record currently being reviewed — drives the loading state */
  reviewing: { type: [Number, null],  default: null  },
})

const emit = defineEmits(['review'])

/** Build the public storage URL for an attached document */
const BASE_URL = import.meta.env.VITE_API_URL

/**
 * @param {string|null} path - Relative storage path from the backend
 * @returns {string|null}
 */
function fileUrl(path) {
  return path ? `${BASE_URL}/storage/${path}` : null
}
</script>

<template>
  <div
    class="just-card card"
    :class="`just-card--${record.status}`"
  >

    <!-- ── Card header: student identity + status ── -->
    <div class="card-top">
      <div class="student-identity">
        <!-- Avatar derived from student first/last initials -->
        <div class="avatar avatar-md avatar--dim">
          {{ personInitials(record.student_first_name, record.student_last_name) }}
        </div>
        <div class="identity-info">
          <p class="student-name">
            {{ record.student_first_name }}
            {{ record.student_last_name }}
          </p>
          <p class="absence-meta">
            Absent on {{ formatDate(record?.absent_date) }}
            <span v-if="record.subject?.name">
              · {{ record.subject.name }}
            </span>
          </p>
        </div>
      </div>

      <!-- Status pill + review date (when processed) -->
      <div class="status-wrap">
        <StatusPill :status="record.status" />
        <span v-if="record.reviewed_at" class="reviewed-date">
          {{ formatDate(record.reviewed_at) }}
        </span>
      </div>
    </div>

    <div class="rule" style="margin: 0.85rem 0;" />

    <!-- ── Card body: comment + document ── -->
    <div class="card-body">
      <!-- Parent's written comment — displayed in italic serif to
           distinguish it visually from system-generated text -->
      <div v-if="record.comment" class="comment-block">
        <p class="section-label" style="margin-bottom:0.35rem">Parent's comment</p>
        <p class="comment-text">{{ record.comment }}</p>
      </div>

      <!-- Document link — opens in a new tab -->
      <div v-if="record.file_path" class="file-block">
        <p class="section-label" style="margin-bottom:0.35rem">Attached document</p>
        <a :href="fileUrl(record.file_path)" target="_blank" rel="noopener" class="file-link">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 2h5.5L11 4.5V12H3V2z"
              stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            <path d="M8 2v3h3"
              stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
          </svg>
          View document
        </a>
      </div>

      <!-- Fallback when the parent provided neither comment nor document -->
      <p v-if="!record.comment && !record.file_path" class="no-content">
        No comment or document provided.
      </p>
    </div>

    <!-- ── Actions (pending only) ── -->
    <!-- Accept and Reject buttons are hidden once a decision has been made
         to prevent accidental re-reviews -->
    <div v-if="record.status === 'pending'" class="card-actions">
      <button
        class="btn-review btn-accept"
        :disabled="reviewing === record.id"
        @click="emit('review', record.id, 'accepted')"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5"
            stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Accept
      </button>
      <button
        class="btn-review btn-reject"
        :disabled="reviewing === record.id"
        @click="emit('review', record.id, 'rejected')"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2L2 10"
            stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Reject
      </button>
      <!-- Inline loader shown on the active card while the request is in-flight -->
      <span v-if="reviewing === record.id" class="dot-loader" style="margin-left:0.5rem">
        <span/><span/><span/>
      </span>
    </div>

    <!-- ── Processed note ── -->
    <div v-else class="processed-note">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.1"/>
        <path d="M4 6.5l2 2 3-3"
          stroke="currentColor" stroke-width="1.1"
          stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Processed {{ formatDate(record.reviewed_at) }}
    </div>

  </div>
</template>

<style scoped>
/* ── Card wrapper ─────────────────────────────────────────────────────────── */
/* The card uses a coloured left border to encode status at a glance */
.just-card {
  padding: 1.25rem 1.5rem;
  animation: cardIn 0.3s ease both;
  border-left: 3px solid var(--border-mid);
}
.just-card--pending  { border-left-color: #b87a00; }
.just-card--accepted { border-left-color: var(--accent); }
.just-card--rejected { border-left-color: #b03030; }

@keyframes cardIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.card-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 1rem;
}
.student-identity { display: flex; align-items: center; gap: 0.85rem; }
.identity-info    { display: flex; flex-direction: column; gap: 2px; }
.student-name     { font-size: 0.95rem; font-weight: 600; color: var(--text); }
.absence-meta     { font-size: 0.75rem; color: var(--muted); }

.status-wrap      { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.reviewed-date    { font-size: 0.65rem; color: var(--muted); }

/* ── Body ─────────────────────────────────────────────────────────────────── */
.card-body { display: flex; flex-direction: column; gap: 0.85rem; }

.comment-text {
  font-family: var(--ff-serif);
  font-size: 0.875rem; font-style: italic;
  color: var(--text-mid); line-height: 1.6;
}
.no-content { font-size: 0.78rem; color: var(--muted-lt); font-style: italic; }

.file-link {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 500; color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--border-strong);
  padding-bottom: 1px;
  transition: color 0.15s;
}
.file-link:hover { color: var(--accent-mid); }

/* ── Actions ──────────────────────────────────────────────────────────────── */
.card-actions { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.25rem; }

.btn-review {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-family: var(--ff-sans); font-size: 0.7rem; font-weight: 500;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 0.5rem 1rem; border-radius: var(--radius);
  cursor: pointer; transition: all 0.15s; border: 1px solid;
}
.btn-accept {
  background: var(--accent-dim); color: var(--accent);
  border-color: var(--border-strong);
}
.btn-accept:hover:not(:disabled) {
  background: var(--accent); color: #fff;
  box-shadow: 0 3px 12px var(--accent-glow);
}
.btn-reject {
  background: rgba(176,48,48,0.06); color: #b03030;
  border-color: rgba(176,48,48,0.25);
}
.btn-reject:hover:not(:disabled) {
  background: #b03030; color: #fff;
  box-shadow: 0 3px 12px rgba(176,48,48,0.25);
}
.btn-accept:disabled,
.btn-reject:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Processed note ───────────────────────────────────────────────────────── */
.processed-note {
  display: inline-flex; align-items: center; gap: 0.45rem;
  font-size: 0.72rem; color: var(--muted);
  margin-top: 0.25rem;
}

@media (max-width: 640px) {
  .card-top { flex-direction: column; }
  .status-wrap { flex-direction: row; align-items: center; }
}
</style>
