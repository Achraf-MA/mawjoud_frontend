<script setup>
defineProps({
  classes:         { type: Array,  default: () => [] },
  subjects:        { type: Array,  default: () => [] },
  selectedClass:   { type: String, default: '' },
  selectedSubject: { type: String, default: '' },
})
const emit = defineEmits(['update:selectedClass', 'update:selectedSubject', 'markAll'])
</script>

<template>
  <div class="card session-panel">
    <div class="panel-head">
      <p class="section-label">Session</p>
      <div class="status-indicator">
        <span class="pulse" />
        <span class="status-text">Active</span>
      </div>
    </div>
    <div class="rule" />
    <div class="panel-body">
      <div class="field">
        <label class="field-label">Class</label>
        <div class="select-wrap">
          <select
            :value="selectedClass"
            @change="emit('update:selectedClass', $event.target.value)"
          >
            <option disabled value="">Select class</option>
            <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Subject</label>
        <div class="select-wrap">
          <select
            :value="selectedSubject"
            @change="emit('update:selectedSubject', $event.target.value)"
          >
            <option disabled value="">Select subject</option>
            <option v-for="s in subjects" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>

      <button class="btn btn-primary mark-all-btn" @click="emit('markAll')">
        Mark all present
      </button>
    </div>
  </div>
</template>

<style scoped>
.session-panel { overflow: hidden; }

.panel-head {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem;
}

.status-indicator {
  display: flex; align-items: center; gap: 0.45rem;
}
.status-text {
  font-size: 0.58rem; font-weight: 600;
  letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--accent-lt);
}

.panel-body {
  padding: 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
}

.field { display: flex; flex-direction: column; gap: 0.45rem; }

.mark-all-btn {
  width: 100%;
  justify-content: center;
  margin-top: 0.25rem;
  font-size: 0.68rem;
}
</style>
