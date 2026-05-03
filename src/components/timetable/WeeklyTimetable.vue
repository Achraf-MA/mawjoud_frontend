<script setup>
import TimetableSlot from './TimetableSlot.vue'
import EmptyState from '../shared/EmptyState.vue'
import { DAY_LABELS } from '../../composables/useSchedule'

const props = defineProps({
  schedule:    { type: Object, required: true },
  activeDays:  { type: Array,  required: true },
  sortedSlots: { type: Function, required: true },
  slotStyle:   { type: Function, required: true },
  todayName:   { type: String, default: '' },
  nextClassId: { type: [Number, null], default: null },
})

const HOURS = [8,9,10,11,12,13,14,15,16,17]
</script>

<template>
  <div class="card timetable-card">
    <EmptyState v-if="!activeDays.length" title="No schedule available yet." :icon="false" />
    <div v-else class="timetable">

      <!-- Time axis -->
      <div class="time-col">
        <div class="time-corner" />
        <div class="time-axis">
          <div v-for="h in HOURS" :key="h" class="time-tick">
            {{ String(h).padStart(2,'0') }}:00
          </div>
        </div>
      </div>

      <!-- Day columns -->
      <div class="days-wrap">
        <div
          v-for="day in activeDays"
          :key="day"
          class="day-col"
          :class="{ 'day-col--today': day === todayName }"
        >
          <div class="day-header">
            <span class="day-name">{{ DAY_LABELS[day].slice(0,3).toUpperCase() }}</span>
            <span v-if="day === todayName" class="today-dot" />
          </div>
          <div class="day-body">
            <TimetableSlot
              v-for="slot in sortedSlots(day)"
              :key="slot.id"
              :slot="slot"
              :isNext="day === todayName && nextClassId === slot.id"
              :style="slotStyle(slot)"
            />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.timetable-card { overflow: hidden; }

.timetable {
  display: flex;
  min-height: 480px;
}

.time-col { display: flex; flex-direction: column; flex-shrink: 0; width: 52px; }
.time-corner { height: 44px; border-bottom: 1px solid var(--border-mid); }
.time-axis { display: flex; flex-direction: column; flex: 1; }
.time-tick {
  flex: 1;
  display: flex; align-items: flex-start; justify-content: flex-end;
  padding-right: 0.6rem; padding-top: 4px;
  font-size: 0.58rem; color: var(--muted-lt); font-weight: 500;
  border-right: 1px solid var(--border);
}

.days-wrap { display: flex; flex: 1; overflow-x: auto; }
.day-col {
  flex: 1; min-width: 120px;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--border);
}
.day-col:last-child { border-right: none; }
.day-col--today { background: var(--accent-dim); }

.day-header {
  height: 44px;
  display: flex; align-items: center; justify-content: center; gap: 0.45rem;
  border-bottom: 1px solid var(--border-mid);
  flex-shrink: 0;
}
.day-name { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; color: var(--muted); }
.day-col--today .day-name { color: var(--accent); }
.today-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent-lt); }

.day-body {
  flex: 1; padding: 0.5rem 0.4rem;
  display: flex; flex-direction: column; gap: 0.4rem;
}

@media (max-width: 640px) {
  .day-col { min-width: 100px; }
  .time-tick { font-size: 0.52rem; padding-right: 0.4rem; }
}
</style>
