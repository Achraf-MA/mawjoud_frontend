<script setup>
defineProps({
  slot:    { type: Object, required: true },
  isNext:  { type: Boolean, default: false },
  style:   { type: Object, default: () => ({}) },
})

function fmt(t) { return t ? t.slice(0, 5) : '' }
function teacherName(t) {
  if (!t) return ''
  return `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()
}
</script>

<template>
  <div
    class="timetable-slot"
    :class="{ 'timetable-slot--next': isNext }"
    :style="style"
  >
    <p class="slot-subject">{{ slot.subject?.name }}</p>
    <p class="slot-time">{{ fmt(slot.starts_at) }}–{{ fmt(slot.ends_at) }}</p>
    <p class="slot-teacher">{{ teacherName(slot.teacher) }}</p>
  </div>
</template>

<style scoped>
.timetable-slot {
  background: var(--surface);
  border: 1px solid var(--border-mid);
  border-left: 3px solid var(--accent-lt);
  border-radius: var(--radius);
  padding: 0.5rem 0.6rem;
  display: flex; flex-direction: column; gap: 2px;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: default;
}
.timetable-slot:hover { border-color: var(--accent); box-shadow: var(--shadow-sm); }
.timetable-slot--next { border-left-color: var(--accent); background: var(--accent-dim); }

.slot-subject {
  font-size: 0.75rem; font-weight: 600; color: var(--text);
  line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.slot-time   { font-size: 0.6rem; color: var(--accent-lt); font-weight: 500; }
.slot-teacher { font-size: 0.6rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
