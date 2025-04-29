<template>
  <div class="chart-period-controls">
    <div class="flex justify-center space-x-1 bg-gray-100 rounded-lg p-1 shadow-inner">
      <button 
        v-for="option in options" 
        :key="option.value"
        @click="handlePeriodChange(option.value)"
        class="px-4 py-1.5 rounded-md transition-all duration-200 ease-in-out text-sm font-medium"
        :class="{ 
          'bg-white shadow text-blue-600': currentValue === option.value,
          'text-gray-600 hover:bg-gray-200': currentValue !== option.value
        }"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '1M'
  },
  options: {
    type: Array,
    default: () => [
      { label: '1D', value: '1D' },
      { label: '1W', value: '1W' },
      { label: '1M', value: '1M' },
      { label: '3M', value: '3M' },
      { label: '1Y', value: '1Y' },
      { label: '5Y', value: '5Y' },
    ]
  }
});

const emit = defineEmits(['period-change', 'update:modelValue']);

// Use a ref to track the current value internally to avoid hydration mismatches
const currentValue = ref(props.modelValue);

// Update internal value when prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== currentValue.value) {
    currentValue.value = newValue;
  }
});

// Handle period change
const handlePeriodChange = (value) => {
  currentValue.value = value;
  emit('period-change', value);
  emit('update:modelValue', value);
};

// Initialize with a valid value if the current one isn't in options
onMounted(() => {
  const validOptions = props.options.map(opt => opt.value);
  if (!validOptions.includes(currentValue.value)) {
    // Default to 1M or first available option
    const defaultValue = validOptions.includes('1M') ? '1M' : validOptions[0];
    currentValue.value = defaultValue;
    emit('update:modelValue', defaultValue);
    emit('period-change', defaultValue);
  }
});
</script>

<style scoped>
.chart-period-controls {
  @apply mb-4;
}
</style> 