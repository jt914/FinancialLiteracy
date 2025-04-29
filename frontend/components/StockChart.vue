<template>
  <div class="stock-chart">
    <!-- Period selector buttons -->
    <ChartPeriodControls 
      v-model="selectedPeriod" 
      @period-change="handlePeriodChange"
      :options="periods"
    />
    
    <div class="relative h-72 bg-white rounded-lg p-2">
      <!-- Placeholder for when there's no data -->
      <div v-if="!priceData.length" class="h-full flex items-center justify-center">
        <p class="text-gray-500">No price data available</p>
      </div>
      
      <div v-else-if="loading" class="h-full flex items-center justify-center">
        <div class="animate-pulse flex flex-col items-center">
          <div class="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-2"></div>
          <p class="text-gray-500">Loading chart data...</p>
        </div>
      </div>
      
      <div v-else class="h-full">
        <LineChart
          :chartData="chartData"
          :options="chartOptions"
          class="h-full w-full"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import ChartPeriodControls from '~/components/ChartPeriodControls.vue';
import { Line as LineChart } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

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

const selectedPeriod = ref(props.initialPeriod);
const loading = ref(false);
const emit = defineEmits(['period-change']);

// Handler for period changes
const handlePeriodChange = (period) => {
  loading.value = true;
  selectedPeriod.value = period;
  emit('period-change', period);
  // Reset loading after a brief delay to show the loading state
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

// Filter out invalid price data points
const validPriceData = computed(() => {
  if (!props.priceData || !Array.isArray(props.priceData)) return [];
  return props.priceData.filter(point => 
    point && 
    typeof point.close === 'number' && 
    typeof point.date !== 'undefined'
  ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Ensure data is sorted by date
});

// Chart data formatting for Chart.js
const chartData = computed(() => {
  const pricePoints = validPriceData.value;
  
  if (!pricePoints.length) {
    return {
      labels: [],
      datasets: [{
        data: []
      }]
    };
  }
  
  // Format dates for x-axis
  const labels = pricePoints.map(point => formatDate(point.date));
  
  // Set color based on price trend
  const firstPrice = pricePoints[0].close;
  const lastPrice = pricePoints[pricePoints.length - 1].close;
  const isPriceUp = lastPrice >= firstPrice;
  
  const gradientColor = isPriceUp ? 
    'rgba(16, 185, 129, 0.1)' : 
    'rgba(239, 68, 68, 0.1)';
  
  const lineColor = isPriceUp ? 
    'rgba(16, 185, 129, 1)' : 
    'rgba(239, 68, 68, 1)';
  
  return {
    labels,
    datasets: [
      {
        label: 'Price',
        data: pricePoints.map(point => point.close),
        borderColor: lineColor,
        backgroundColor: gradientColor,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.3,
        fill: true
      }
    ]
  };
});

// Chart.js options
const chartOptions = computed(() => {
  const pricePoints = validPriceData.value;
  
  // Calculate min and max with padding for y-axis
  let min = 0;
  let max = 100;
  
  if (pricePoints.length) {
    const validLows = pricePoints.filter(p => typeof p.low === 'number').map(p => p.low);
    const validHighs = pricePoints.filter(p => typeof p.high === 'number').map(p => p.high);
    
    if (validLows.length && validHighs.length) {
      min = Math.min(...validLows);
      max = Math.max(...validHighs);
      
      // Add some padding
      const range = max - min;
      min = Math.max(0, min - (range * 0.05));
      max = max + (range * 0.05);
    }
  }
  
  // Format the tooltip to show more data
  const tooltipCallback = {
    label: function(context) {
      const dataIndex = context.dataIndex;
      const dataPoint = pricePoints[dataIndex];
      
      if (!dataPoint) return [];
      
      return [
        `Price: $${formatPrice(dataPoint.close)}`,
        `Open: $${formatPrice(dataPoint.open)}`,
        `High: $${formatPrice(dataPoint.high)}`,
        `Low: $${formatPrice(dataPoint.low)}`,
        `Volume: ${formatVolume(dataPoint.volume)}`
      ];
    }
  };
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: tooltipCallback,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        padding: 10,
        cornerRadius: 4,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxTicksLimit: 8,
          maxRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(226, 232, 240, 0.5)'
        },
        min,
        max,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          },
          font: {
            size: 10
          }
        }
      }
    },
    elements: {
      line: {
        borderJoinStyle: 'round'
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    animation: {
      duration: 600
    }
  };
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format based on selected period
    if (selectedPeriod.value === '1D') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (selectedPeriod.value === '1W') {
      return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
    } else if (selectedPeriod.value === '1M' || selectedPeriod.value === '3M') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
    }
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

// Set loading to false after component is mounted and data received
onMounted(() => {
  loading.value = false;
});
</script>

<style scoped>
.stock-chart {
  @apply bg-white rounded-lg p-4 shadow-md relative pb-6;
}
</style> 