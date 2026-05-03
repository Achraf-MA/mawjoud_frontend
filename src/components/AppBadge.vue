<template>
  <span class="badge" :class="variantClass">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default'
  }
})

const variantClass = computed(() => {
  return {
    absent: 'badge--absent',
    present: 'badge--present',
    late: 'badge--late',
    justified: 'badge--justified',
    pending: 'badge--pending',
    default: 'badge--default'
  }[props.variant] || 'badge--default'
})
</script>

<style scoped>
.badge {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 4px;
}

.badge--absent {
  background: var(--red-dim);
  color: var(--red-text);
}

.badge--justified {
  background: var(--gold-dim);
  color: var(--gold-2);
}
</style>