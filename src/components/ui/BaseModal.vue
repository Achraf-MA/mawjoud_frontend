<script setup>
defineProps({ title: String, show: Boolean })
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="backdrop" @mousedown.self="emit('close')">
        <div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <div>
              <p class="section-label">{{ title }}</p>
            </div>
            <button class="close-btn" @click="emit('close')" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="rule" />
          <div class="modal-body">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 200;
  padding: 1rem;
}
.modal {
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: min(480px, 100%);
  overflow: hidden;
  position: relative;
}
.modal::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 1px;
  background: linear-gradient(90deg, var(--accent) 0%, var(--accent-lt) 40%, transparent 100%);
  opacity: 0.5;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem;
}
.close-btn {
  appearance: none; background: none; border: none;
  color: var(--muted); cursor: pointer;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
  transition: background 0.15s, color 0.15s;
}
.close-btn:hover { background: var(--surface-3); color: var(--text); }
.modal-body { padding: 1.5rem; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-active .modal, .modal-leave-active .modal { transition: transform 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(10px) scale(0.98); }
</style>
