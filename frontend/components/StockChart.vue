<template>
  <div class="stock-chart">
    <!-- Period selector buttons -->
    <ChartPeriodControls 
      v-model="selectedPeriod" 
      @period-change="handlePeriodChange"
      :options="periods"
    />
    
    <div class="relative h-72 bg-white">
      <!-- Placeholder for when we implement a real chart library -->
      <div v-if="!priceData.length" class="h-full flex items-center justify-center">
        <p class="text-gray-500">No price data available</p>
      </div>
      
      <div v-else class="h-full">
        <!-- Simple price visualization with improved styling -->
        <div class="relative h-full">
          <!-- Price Change Indicator Line -->
          <div 
            v-if="priceData.length && typeof priceData[0].close === 'number'"
            class="absolute left-0 right-0 h-px" 
            :style="{
              backgroundColor: 'rgba(107, 114, 128, 0.3)',
              top: `${calculateBarHeight(priceData[0].close)}%`
            }"
          ></div>
          
          <!-- Chart Area -->
          <div class="absolute left-0 top-0 right-0 bottom-0 flex items-end">
            <div 
              v-for="(point, index) in validPriceData" 
              :key="index"
              :style="{
                height: `${calculateBarHeight(point.close)}%`,
                width: `${100 / validPriceData.length}%`,
                backgroundColor: overallPriceChange >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'
              }"
              class="hover:opacity-100 transition-opacity relative group"
            >
              <!-- Tooltip on hover -->
              <div class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 mb-2 whitespace-nowrap z-10">
                <div>Date: {{ formatDate(point.date) }}</div>
                <div>Open: ${{ formatPrice(point.open) }}</div>
                <div>High: ${{ formatPrice(point.high) }}</div>
                <div>Low: ${{ formatPrice(point.low) }}</div>
                <div>Close: ${{ formatPrice(point.close) }}</div>
                <div>Volume: {{ formatVolume(point.volume) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Price Range Indicators -->
        <div class="absolute right-0 top-0 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
          ${{ formatPrice(maxPrice) }}
        </div>
        <div class="absolute right-0 bottom-0 text-xs text-gray-500 bg-white bg-opacity-75 px-1 rounded">
          ${{ formatPrice(minPrice) }}
        </div>
        
        <!-- X-axis dates (first and last) -->
        <div v-if="priceData.length" class="absolute left-0 bottom-0 text-xs text-gray-500 -mb-5">
          {{ formatDate(priceData[0]?.date) }}
        </div>
        <div v-if="priceData.length" class="absolute right-0 bottom-0 text-xs text-gray-500 -mb-5">
          {{ formatDate(priceData[priceData.length - 1]?.date) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ChartPeriodControls from '~/components/ChartPeriodControls.vue';

const props = defineProps({
  priceData: {
    type: Array,
    default: () => []
  },
  initialPeriod: {
    type: String,
    default: '1M'
  }
});

// Time period options with standardized values (uppercase consistent with API)
const periods = [
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' },
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' }
];

const selectedPeriod = ref(props.initialPeriod); // Use initialPeriod as starting point
const emit = defineEmits(['period-change']);

// Handler for period changes
const handlePeriodChange = (period) => {
  selectedPeriod.value = period;
  emit('period-change', period);
};

// Filter out invalid price data points
const validPriceData = computed(() => {
  if (!props.priceData || !Array.isArray(props.priceData)) return [];
  return props.priceData.filter(point => 
    point && 
    typeof point.close === 'number' && 
    typeof point.date !== 'undefined'
  );
});

// Calculate min and max price for scaling
const minPrice = computed(() => {
  if (!props.priceData || !props.priceData.length) return 0;
  // Safely check if low exists on each item before using it
  const validPoints = props.priceData.filter(p => typeof p.low === 'number');
  if (!validPoints.length) return 0;
  return Math.min(...validPoints.map(p => p.low));
});

const maxPrice = computed(() => {
  if (!props.priceData || !props.priceData.length) return 100;
  // Safely check if high exists on each item before using it
  const validPoints = props.priceData.filter(p => typeof p.high === 'number');
  if (!validPoints.length) return 100;
  return Math.max(...validPoints.map(p => p.high));
});

// Calculate overall price change (for coloring)
const overallPriceChange = computed(() => {
  if (!props.priceData || props.priceData.length < 2) return 0;
  // Ensure we have valid close prices at both ends
  const firstValid = props.priceData.find(p => typeof p.close === 'number');
  const lastValid = [...props.priceData].reverse().find(p => typeof p.close === 'number');
  
  if (!firstValid || !lastValid) return 0;
  return lastValid.close - firstValid.close;
});

// Calculate the height percentage for each bar
const calculateBarHeight = (price) => {
  if (typeof price !== 'number') return 50; // Default to middle if price is invalid
  if (maxPrice.value === minPrice.value) return 50;
  // Add a small buffer to prevent bars from touching the edges
  const range = maxPrice.value - minPrice.value;
  const buffer = range * 0.05;
  return ((price - (minPrice.value - buffer)) / (range + buffer * 2)) * 100;
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

// Format price with 2 decimal places
const formatPrice = (price) => {
  if (typeof price !== 'number') return 'N/A';
  return price.toFixed(2);
};

// Format volume with appropriate suffix
const formatVolume = (volume) => {
  if (typeof volume !== 'number') return 'N/A';
  if (volume >= 1000000000) {
    return (volume / 1000000000).toFixed(2) + 'B';
  }
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(2) + 'M';
  }
  if (volume >= 1000) {
    return (volume / 1000).toFixed(2) + 'K';
  }
  return volume.toString();
};
</script>

<style scoped>
.stock-chart {
  @apply bg-white rounded-lg p-4 shadow-md relative pb-6;
}
</style> 