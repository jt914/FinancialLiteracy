<template>
  <div class="stock-chart">
    <div class="flex justify-between items-center mb-4">
      <div class="flex space-x-4">
        <button 
          v-for="period in periods" 
          :key="period.value"
          @click="selectedPeriod = period.value"
          :class="[
            'px-3 py-1 rounded-md text-sm font-medium',
            selectedPeriod === period.value 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-600 hover:bg-gray-100'
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    
    <div class="relative h-64 bg-white">
      <!-- Placeholder for when we implement a real chart library -->
      <div v-if="!priceData.length" class="h-full flex items-center justify-center">
        <p class="text-gray-500">No price data available</p>
      </div>
      
      <div v-else class="h-full">
        <!-- Simple price visualization -->
        <div class="relative h-full">
          <div class="absolute left-0 top-0 right-0 bottom-0 flex items-end">
            <div 
              v-for="(point, index) in priceData" 
              :key="index"
              :style="{
                height: `${calculateBarHeight(point.close)}%`,
                width: `${100 / priceData.length}%`,
                backgroundColor: point.close > (priceData[index - 1]?.close || point.close) ? '#10B981' : '#EF4444',
                opacity: 0.7
              }"
              class="hover:opacity-100 transition-opacity"
              :title="`Date: ${formatDate(point.date)}\nPrice: $${point.close.toFixed(2)}`"
            ></div>
          </div>
        </div>
        
        <!-- Price labels -->
        <div class="absolute left-0 top-0 text-xs text-gray-500">
          ${{ maxPrice.toFixed(2) }}
        </div>
        <div class="absolute left-0 bottom-0 text-xs text-gray-500">
          ${{ minPrice.toFixed(2) }}
        </div>
        
        <!-- Hover info would go here with a proper chart library -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  priceData: {
    type: Array,
    default: () => []
  }
});

// Time period options
const periods = [
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' }
];

const selectedPeriod = ref('1m');
const emit = defineEmits(['period-change']);

// Watch for period changes and emit event
watch(selectedPeriod, (newPeriod) => {
  emit('period-change', newPeriod);
});

// Calculate min and max price for scaling
const minPrice = computed(() => {
  if (!props.priceData.length) return 0;
  return Math.min(...props.priceData.map(p => p.close));
});

const maxPrice = computed(() => {
  if (!props.priceData.length) return 0;
  return Math.max(...props.priceData.map(p => p.close));
});

// Calculate the height percentage for each bar
const calculateBarHeight = (price) => {
  if (maxPrice.value === minPrice.value) return 50;
  return ((price - minPrice.value) / (maxPrice.value - minPrice.value)) * 100;
};

// Format date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};
</script>

<style scoped>
.stock-chart {
  @apply bg-white rounded-lg p-4 shadow-md;
}
</style> 