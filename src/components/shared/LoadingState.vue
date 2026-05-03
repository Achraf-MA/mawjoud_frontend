<script setup>
defineProps({ label: { type: String, default: 'Loading…' } })
</script>

<template>
  <div class="loading-state">
    <div class="dot-loader"><span/><span/><span/></div>
    <p>{{ label }}</p>
  </div>
</template>
