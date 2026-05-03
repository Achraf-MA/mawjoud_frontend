<script setup>
defineProps({
  eyebrow:  { type: String, default: '' },
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  date:     { type: String, default: '' },
})
</script>

<template>
  <div class="page-header">
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
    <h1 class="page-title">{{ title }}</h1>
    <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    <p v-if="date" class="page-date">{{ date }}</p>
  </div>
</template>
