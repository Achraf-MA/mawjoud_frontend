<!--
  JustificationModal.vue
  ──────────────────────
  A modal form that allows a parent to submit a justification for a specific
  absence or late arrival. Accepts an optional written comment and an optional
  supporting document (PDF, JPG, PNG).

  The form uses FormData (multipart/form-data) rather than JSON because the
  file field requires multipart encoding — the apiFetch wrapper handles this
  automatically when it detects a FormData body.

  Props:
    show     — controls modal visibility
    record   — the Attendance record being justified (must be absent or late)

  Emits:
    close    — when the user dismisses the modal
    submitted — after a successful submission so the parent can reload records
-->

<script setup>
import { ref, watch } from 'vue'
import { submitJustification } from '../../services/parent'
import { formatDate } from '../../composables/useDate'
import BaseModal from '../ui/BaseModal.vue'
import StatusPill from '../shared/StatusPill.vue'

const props = defineProps({
  show:   { type: Boolean,      required: true },
  record: { type: Object,       default: null  },
})

const emit = defineEmits(['close', 'submitted'])

// ── Local form state ──────────────────────────────────────────────────────────
const comment  = ref('')
const file     = ref(null)
const fileInput = ref(null)
const saving   = ref(false)
const error    = ref('')
const success  = ref(false)

// Reset the form every time a new record is selected so stale data
// from a previous submission doesn't bleed into the next one
watch(() => props.record, () => {
  comment.value = ''
  file.value    = null
  error.value   = ''
  success.value = false
})

// ── File handling ─────────────────────────────────────────────────────────────

/**
 * Capture the selected file from the hidden file input.
 * Validates type and size (max 2 MB) immediately on selection
 * so the user gets feedback before attempting to submit.
 */
function onFileChange(e) {
  const selected = e.target.files?.[0] ?? null
  if (!selected) { file.value = null; return }

  const allowed = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowed.includes(selected.type)) {
    error.value = 'Only PDF, JPG, and PNG files are accepted.'
    file.value  = null
    e.target.value = ''
    return
  }
  if (selected.size > 2 * 1024 * 1024) {
    error.value = 'File must be 2 MB or smaller.'
    file.value  = null
    e.target.value = ''
    return
  }

  error.value = ''
  file.value  = selected
}

// ── Submission ────────────────────────────────────────────────────────────────

/**
 * Submit the justification via FormData.
 * On success we wait 1.2 s to show the confirmation, then close the modal
 * and notify the parent component to reload its attendance records.
 */
async function submit() {
  error.value   = ''
  success.value = false
  saving.value  = true

  try {
    await submitJustification(props.record.id, {
      comment: comment.value,
      file:    file.value,
    })

    success.value = true

    // Brief pause so the user sees the confirmation before the modal closes
    setTimeout(() => {
      emit('submitted')
      emit('close')
    }, 1200)

  } catch (e) {
    error.value = e.message || 'Failed to submit justification. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseModal title="Submit justification" :show="show" @close="emit('close')">
    <div class="modal-body">

      <!-- ── Absence context ── -->
      <!-- Displayed read-only so the parent can confirm they are justifying
           the correct absence before submitting -->
      <div class="context-grid" v-if="record">
        <div class="context-row">
          <span class="field-label">Student</span>
          <span class="context-val">
            {{ record.student?.first_name }} {{ record.student?.last_name }}
          </span>
        </div>
        <div class="context-row">
          <span class="field-label">Date</span>
          <span class="context-val">{{ formatDate(record.date) }}</span>
        </div>
        <div class="context-row">
          <span class="field-label">Subject</span>
          <span class="context-val">{{ record.subject?.name }}</span>
        </div>
        <div class="context-row">
          <span class="field-label">Status</span>
          <StatusPill :status="record.status" />
        </div>
      </div>

      <div class="rule" style="margin: 1rem 0;" />

      <!-- ── Form ── -->
      <form class="just-form" @submit.prevent="submit">

        <!-- Written reason — optional -->
        <div class="form-group">
          <label class="field-label">
            Reason
            <span class="optional">(optional)</span>
          </label>
          <textarea
            v-model="comment"
            class="just-textarea"
            placeholder="Briefly explain the reason for this absence…"
            rows="3"
          />
        </div>

        <!-- Document upload — optional -->
        <!-- Uses a styled div that proxies clicks to a hidden file input,
             which gives us full control over the appearance -->
        <div class="form-group">
          <label class="field-label">
            Supporting document
            <span class="optional">(optional)</span>
          </label>
          <div class="file-drop" @click="fileInput.click()">
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              class="file-hidden"
              @change="onFileChange"
            />
            <!-- Upload icon -->
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" class="file-icon">
              <path d="M10 13V4M10 4L7 7M10 4l3 3"
                stroke="currentColor" stroke-width="1.2"
                stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1"
                stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <span v-if="file" class="file-selected">{{ file.name }}</span>
            <span v-else class="file-prompt">Click to upload PDF, JPG or PNG (max 2 MB)</span>
          </div>
        </div>

        <!-- Error message — shown only on submission failure -->
        <Transition name="err">
          <p v-if="error" class="form-error">{{ error }}</p>
        </Transition>

        <!-- Success confirmation — shown briefly before auto-close -->
        <Transition name="err">
          <div v-if="success" class="form-success">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/>
              <path d="M4.5 7l2 2 3-3"
                stroke="currentColor" stroke-width="1.2"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Justification submitted successfully.
          </div>
        </Transition>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="saving || success">
            <span v-if="saving" class="dot-loader" style="display:inline-flex;gap:3px">
              <span/><span/><span/>
            </span>
            <span v-else>Submit</span>
          </button>
        </div>

      </form>
    </div>
  </BaseModal>
</template>

<style scoped>
/* ── Context summary ──────────────────────────────────────────────────────── */
.context-grid  { display: flex; flex-direction: column; gap: 0.6rem; }
.context-row   { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.context-val   { font-size: 0.875rem; font-weight: 500; color: var(--text); }

/* ── Form ─────────────────────────────────────────────────────────────────── */
.just-form     { display: flex; flex-direction: column; gap: 1rem; }
.optional      { font-weight: 400; letter-spacing: 0; text-transform: none; color: var(--muted-lt); }

.just-textarea {
  width: 100%; resize: vertical; min-height: 80px;
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius);
  color: var(--text); font-family: var(--ff-sans);
  font-size: 0.875rem; padding: 0.65rem 0.85rem;
  outline: none; transition: border-color 0.2s, box-shadow 0.2s;
}
.just-textarea:focus {
  border-color: var(--accent-lt);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

/* ── File drop zone ───────────────────────────────────────────────────────── */
.file-drop {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px dashed var(--border-mid);
  border-radius: var(--radius);
  cursor: pointer; color: var(--muted);
  transition: border-color 0.2s, background 0.2s;
}
.file-drop:hover  { border-color: var(--accent-lt); background: var(--accent-dim); color: var(--accent); }
.file-hidden      { display: none; }
.file-icon        { flex-shrink: 0; }
.file-selected    { font-size: 0.82rem; font-weight: 500; color: var(--accent); }
.file-prompt      { font-size: 0.78rem; }

/* ── Feedback messages ────────────────────────────────────────────────────── */
.form-success {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.78rem; color: var(--accent);
  background: var(--accent-dim); border: 1px solid var(--border-strong);
  border-radius: var(--radius); padding: 0.6rem 0.85rem;
}

/* ── Transitions ──────────────────────────────────────────────────────────── */
.err-enter-active, .err-leave-active { transition: opacity 0.2s, transform 0.2s; }
.err-enter-from,   .err-leave-to     { opacity: 0; transform: translateY(-4px); }

@media (max-width: 640px) {
  .context-row { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
}
</style>
