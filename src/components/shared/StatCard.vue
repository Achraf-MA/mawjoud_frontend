<script setup>
defineProps({
  num:       { type: [Number, String], required: true },
  label:     { type: String, required: true },
  color:     { type: String, default: 'var(--text)' },
  fillClass: { type: String, default: '' },
  pct:       { type: Number, default: null },
  clickable: { type: Boolean, default: false },
  active:    { type: Boolean, default: false },
})
</script>

<template>
  <div class="stat-card" :class="{ clickable, active }">
    <span class="stat-num" :style="{ color }">
      {{ num }}<slot name="suffix" />
    </span>
    <span class="stat-label">{{ label }}</span>
    <div v-if="pct !== null" class="stat-bar">
      <div class="stat-bar-fill" :class="fillClass" :style="{ width: pct + '%' }" />
    </div>
  </div>
</template>
