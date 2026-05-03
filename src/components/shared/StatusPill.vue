<script setup>
defineProps({ status: { type: String, required: true } })

const LABELS = {
  present: 'Present', absent: 'Absent', late: 'Late',
  pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected',
}
</script>

<template>
  <span class="status-pill" :class="`pill--${status}`">
    {{ LABELS[status] ?? status }}
  </span>
</template>
