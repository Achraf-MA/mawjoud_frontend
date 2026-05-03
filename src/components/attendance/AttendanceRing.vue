<script setup>
defineProps({
  pct:     { type: Number, required: true },
  present: { type: Number, default: 0 },
  absent:  { type: Number, default: 0 },
  late:    { type: Number, default: 0 },
  total:   { type: Number, default: 0 },
})
</script>

<template>
  <div class="att-ring">
    <div class="ring-wrap">
      <svg viewBox="0 0 80 80" class="ring-svg">
        <circle cx="40" cy="40" r="32" stroke="var(--border-mid)" stroke-width="6" fill="none"/>
        <circle
          cx="40" cy="40" r="32"
          stroke="var(--accent-lt)" stroke-width="6" fill="none"
          stroke-linecap="round"
          stroke-dasharray="201"
          :stroke-dashoffset="201 - (201 * pct / 100)"
          transform="rotate(-90 40 40)"
          style="transition: stroke-dashoffset 0.8s ease"
        />
      </svg>
      <div class="ring-label">
        <span class="ring-pct">{{ pct }}<span class="ring-unit">%</span></span>
      </div>
    </div>
    <div class="ring-stats">
      <div class="ring-stat-row">
        <span class="ring-dot ring-dot--present" />
        <span class="ring-stat-name">Present</span>
        <span class="ring-stat-val">{{ present }}</span>
      </div>
      <div class="ring-stat-row">
        <span class="ring-dot ring-dot--absent" />
        <span class="ring-stat-name">Absent</span>
        <span class="ring-stat-val">{{ absent }}</span>
      </div>
      <div class="ring-stat-row">
        <span class="ring-dot ring-dot--late" />
        <span class="ring-stat-name">Late</span>
        <span class="ring-stat-val">{{ late }}</span>
      </div>
      <div class="ring-stat-row ring-stat-row--total">
        <span class="ring-stat-name">Total</span>
        <span class="ring-stat-val">{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.att-ring { display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem; }

.ring-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
.ring-svg  { width: 80px; height: 80px; }
.ring-label {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center; line-height: 1;
}
.ring-pct  { font-family: var(--ff-serif); font-size: 1.3rem; font-weight: 500; color: var(--text); }
.ring-unit { font-size: 0.65rem; color: var(--muted); }

.ring-stats { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }
.ring-stat-row { display: flex; align-items: center; gap: 0.5rem; }
.ring-stat-row--total {
  border-top: 1px solid var(--border);
  padding-top: 0.5rem; margin-top: 0.1rem;
}
.ring-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ring-dot--present { background: var(--accent-lt); }
.ring-dot--absent  { background: #b03030; }
.ring-dot--late    { background: #b87a00; }
.ring-stat-name { font-size: 0.75rem; color: var(--muted); flex: 1; }
.ring-stat-val  { font-size: 0.85rem; font-weight: 600; color: var(--text); }
</style>
