<script setup>
import { onMounted, watch, ref, computed } from 'vue'
import Chart from 'chart.js/auto'

const props = defineProps({ data: { type: Array, default: () => [] } })

const canvas  = ref(null)
let chart = null

const present = computed(() => props.data.filter(a => a.status === 'present').length)
const absent  = computed(() => props.data.filter(a => a.status === 'absent').length)
const pct     = computed(() => props.data.length
  ? Math.round(present.value / props.data.length * 100) : 0)

function getAccent() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--accent-lt').trim() || '#4a8c68'
}
function getMuted() {
  return getComputedStyle(document.documentElement)
    .getPropertyValue('--border-mid').trim() || 'rgba(26,58,42,0.18)'
}

function draw() {
  if (!canvas.value) return
  chart?.destroy()
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: ['Present', 'Absent'],
      datasets: [{
        data: [present.value || 0, absent.value || 0],
        backgroundColor: [getAccent(), getMuted()],
        borderWidth: 0,
        cutout: '76%',
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: i => i.datasetIndex === 0,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed}`
          }
        }
      },
      animation: { duration: 700, easing: 'easeInOutQuart' }
    }
  })
}

onMounted(draw)
watch(() => props.data, draw, { deep: true })
</script>

<template>
  <div class="chart-shell">
    <div class="donut-wrap">
      <canvas ref="canvas" />
      <div class="donut-center">
        <p class="donut-pct">{{ pct }}<span class="donut-unit">%</span></p>
        <p class="donut-label">attendance</p>
      </div>
    </div>
    <div class="stats-row">
      <div class="stat">
        <p class="stat-n">{{ present }}</p>
        <p class="stat-l">Present</p>
      </div>
      <div class="stat-sep" />
      <div class="stat">
        <p class="stat-n stat-absent">{{ absent }}</p>
        <p class="stat-l">Absent</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-shell { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }

.donut-wrap { position: relative; width: 150px; height: 150px; }
.donut-wrap canvas { width: 100%!important; height: 100%!important; }

.donut-center {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center; pointer-events: none;
}
.donut-pct {
  font-family: var(--ff-serif);
  font-size: 2rem; font-weight: 500;
  color: var(--text); line-height: 1;
}
.donut-unit { font-size: 1rem; font-weight: 400; color: var(--muted); }
.donut-label {
  font-size: 0.55rem; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--muted);
  margin-top: 4px;
}

.stats-row { display: flex; align-items: center; gap: 1.5rem; }
.stat { text-align: center; }
.stat-n {
  font-family: var(--ff-serif);
  font-size: 1.4rem; font-weight: 500;
  color: var(--accent-lt); line-height: 1;
}
.stat-absent { color: var(--muted); }
.stat-l {
  font-size: 0.55rem; letter-spacing: 0.18em;
  text-transform: uppercase; color: var(--muted);
  margin-top: 3px;
}
.stat-sep {
  width: 1px; height: 24px;
  background: var(--border-mid);
}
</style>
