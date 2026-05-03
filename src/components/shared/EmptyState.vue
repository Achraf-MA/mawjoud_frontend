<script setup>
defineProps({
  title: { type: String, default: 'Nothing here yet' },
  sub:   { type: String, default: '' },
  icon:  { type: Boolean, default: true },
})
</script>

<template>
  <div class="empty-state">
    <div v-if="icon" class="empty-icon">
      <slot name="icon">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="3" width="22" height="22" rx="3" stroke="currentColor" stroke-width="1.2"/>
          <path d="M8 10h12M8 14h8M8 18h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </slot>
    </div>
    <p class="empty-title">{{ title }}</p>
    <p v-if="sub" class="empty-sub">{{ sub }}</p>
    <slot />
  </div>
</template>
