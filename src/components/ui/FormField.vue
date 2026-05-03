<script setup>
defineProps({
  label:       String,
  modelValue:  [String, Number],
  type:        { type: String, default: 'text' },
  placeholder: String,
  options:     Array,
  required:    Boolean,
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="form-field">
    <label class="field-label">
      {{ label }}<span v-if="required" class="req">*</span>
    </label>

    <div class="select-wrap" v-if="type === 'select'">
      <select
        :value="modelValue"
        :required="required"
        @change="emit('update:modelValue', $event.target.value)"
      >
        <option disabled value="">— Select —</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
    </div>

    <input
      v-else
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.form-field { display: flex; flex-direction: column; gap: 0.45rem; }
.req { color: var(--accent-lt); margin-left: 2px; }

input {
  background: var(--surface-2);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius);
  color: var(--text);
  font-family: var(--ff-sans);
  font-size: 0.875rem;
  padding: 0.6rem 0.85rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
}
input::placeholder { color: var(--muted-lt); }
input:focus {
  border-color: var(--accent-lt);
  box-shadow: 0 0 0 3px var(--accent-dim);
}
</style>
