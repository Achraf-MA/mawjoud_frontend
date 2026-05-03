<script setup>
import { DAY_LABELS } from '../../composables/useSchedule'

defineProps({
  slots:      { type: Array,   required: true },
  todayName:  { type: String,  required: true },
  nextClass:  { type: Object,  default: null },
})

function fmt(t) { return t ? t.slice(0, 5) : '' }
function teacherName(t) {
  return t ? `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim() : ''
}
</script>

<template>
  <div class="card today-card">
    <div class="card-head">
      <p class="section-label">Today's Classes</p>
      <span class="today-tag">{{ DAY_LABELS[todayName] ?? todayName }}</span>
    </div>
    <div class="rule" />
    <div class="today-body">
      <div v-if="!slots.length" class="today-empty">
        <p class="today-empty-title">No classes today</p>
        <p class="today-empty-sub">Enjoy your free day.</p>
      </div>
      <div v-else class="today-slots">
        <div
          v-for="slot in slots"
          :key="slot.id"
          class="slot-row"
          :class="{ 'slot-row--next': nextClass?.id === slot.id }"
        >
          <div class="slot-time-col">
            <span class="t-start">{{ fmt(slot.starts_at) }}</span>
            <span class="t-sep">—</span>
            <span class="t-end">{{ fmt(slot.ends_at) }}</span>
          </div>
          <div class="slot-info">
            <p class="slot-subject">{{ slot.subject?.name }}</p>
            <p class="slot-teacher">{{ teacherName(slot.teacher) }}</p>
          </div>
          <span v-if="nextClass?.id === slot.id" class="next-badge">Next</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.today-card { overflow: hidden; }
.today-tag {
  font-size: 0.6rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent); background: var(--accent-dim);
  border: 1px solid var(--border-strong); border-radius: 20px;
  padding: 0.2rem 0.7rem;
}
.today-body { padding: 1.1rem 1.25rem; }

.today-empty { text-align: center; padding: 1.5rem 0; }
.today-empty-title { font-family: var(--ff-serif); font-size: 1rem; color: var(--text); }
.today-empty-sub   { font-size: 0.78rem; color: var(--muted); margin-top: 0.25rem; }

.today-slots { display: flex; flex-direction: column; gap: 0.6rem; }

.slot-row {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
  transition: border-color 0.15s;
}
.slot-row--next { border-color: var(--accent-lt); background: var(--accent-dim); }

.slot-time-col {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  flex-shrink: 0; min-width: 52px; text-align: center;
}
.t-start { font-size: 0.85rem; font-weight: 600; color: var(--text); }
.t-sep   { font-size: 0.55rem; color: var(--muted-lt); }
.t-end   { font-size: 0.75rem; color: var(--muted); }

.slot-info { flex: 1; min-width: 0; }
.slot-subject { font-size: 0.9rem; font-weight: 600; color: var(--text); }
.slot-teacher { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

.next-badge {
  font-size: 0.52rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent); background: var(--surface);
  border: 1px solid var(--border-strong); border-radius: 20px;
  padding: 0.18rem 0.55rem; flex-shrink: 0;
}
</style>
