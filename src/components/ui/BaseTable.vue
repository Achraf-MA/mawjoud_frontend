<script setup>
defineProps({
  columns: { type: Array,   default: () => [] },
  rows:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false },
  empty:   { type: String,  default: 'No records found.' },
})
</script>

<template>
  <div class="table-wrap">
    <div v-if="loading" class="table-state">
      <div class="dot-loader"><span/><span/><span/></div>
      <p>Loading…</p>
    </div>
    <div v-else-if="!rows.length" class="table-state">
      <p class="empty-msg">{{ empty }}</p>
    </div>
    <div v-else class="table-scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns" :key="col.key"
              :style="col.width ? `width:${col.width}` : ''"
            >{{ col.label }}</th>
            <th v-if="$slots.actions" class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows" :key="row.id ?? i"
            :style="{ animationDelay: `${i * 20}ms` }"
            class="row-in"
          >
            <td v-for="col in columns" :key="col.key">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="td-actions">
              <slot name="actions" :row="row" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-wrap { width: 100%; }
.table-scroll { overflow-x: auto; }

.table-state {
  display: flex; flex-direction: column;
  align-items: center; gap: 0.75rem;
  padding: 3.5rem 0;
  color: var(--muted); font-size: 0.82rem;
}
.empty-msg { font-style: italic; }

table { width: 100%; border-collapse: collapse; }

thead th {
  font-family: var(--ff-sans);
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--muted);
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-mid);
  white-space: nowrap;
}
.th-actions { text-align: right; }

tbody tr {
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
tbody tr:last-child { border-bottom: none; }
tbody tr:hover { background: var(--accent-dim); }

@keyframes rowIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.row-in { animation: rowIn 0.3s ease both; }

tbody td {
  padding: 0.8rem 1rem;
  font-size: 0.875rem; font-weight: 400;
  color: var(--text-mid);
  vertical-align: middle;
}
.td-actions { text-align: right; }
</style>
