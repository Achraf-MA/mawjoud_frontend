<script setup>
defineProps({
  page:     { type: Number, required: true },
  lastPage: { type: Number, required: true },
})
const emit = defineEmits(['change'])
</script>

<template>
  <div v-if="lastPage > 1" class="pagination">
    <button class="btn btn-ghost" :disabled="page <= 1" @click="emit('change', page - 1)">Previous</button>
    <span class="page-indicator">Page {{ page }} of {{ lastPage }}</span>
    <button class="btn btn-ghost" :disabled="page >= lastPage" @click="emit('change', page + 1)">Next</button>
  </div>
</template>
