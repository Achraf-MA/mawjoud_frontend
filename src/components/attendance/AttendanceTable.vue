<script setup>
import StatusPill from '../shared/StatusPill.vue'
import PaginationBar from '../shared/PaginationBar.vue'
import LoadingState from '../shared/LoadingState.vue'
import EmptyState from '../shared/EmptyState.vue'
import { formatDate } from '../../composables/useDate'

defineProps({
  records:  { type: Array,   default: () => [] },
  loading:  { type: Boolean, default: false },
  page:     { type: Number,  default: 1 },
  lastPage: { type: Number,  default: 1 },
  showStudent: { type: Boolean, default: false },
})
const emit = defineEmits(['page-change'])
</script>

<template>
  <div class="card att-table-card">
    <LoadingState v-if="loading" label="Loading attendance…" />
    <EmptyState v-else-if="!records.length" title="No attendance records yet." />
    <template v-else>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th v-if="showStudent">Student</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(rec, i) in records"
              :key="rec.id"
              :class="`row--${rec.status}`"
              :style="{ animationDelay: `${i * 18}ms` }"
              class="row-in"
            >
              <td class="cell-italic">{{ formatDate(rec.date) }}</td>
              <td v-if="showStudent" class="cell-bold">
                {{ rec.student?.first_name }} {{ rec.student?.last_name }}
              </td>
              <td class="cell-bold">{{ rec.subject?.name }}</td>
              <td><StatusPill :status="rec.status" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar :page="page" :last-page="lastPage" @change="emit('page-change', $event)" />
    </template>
  </div>
</template>

<style scoped>
.att-table-card { overflow: hidden; }
.cell-italic { font-family: var(--ff-serif); font-style: italic; color: var(--text); }
.cell-bold   { font-weight: 500; color: var(--text); }
</style>
