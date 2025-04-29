<template>
  <div class="stock-chart">
    <!-- Period selector buttons -->
    <ChartPeriodControls 
      v-model="selectedPeriod" 
      @period-change="handlePeriodChange"
      :options="periods"
    />
    
    <div class="relative h-72 bg-white mt-4">
      <div v-if="!priceData.length" class="h-full flex items-center justify-center">
        <p class="text-gray-500">No price data available</p>
      </div>
      <Line v-else :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ChartPeriodControls from '~/components/ChartPeriodControls.vue';
import { Line } from 'vue-chartjs';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  LinearScale, 
  PointElement, 
  CategoryScale,
  TimeScale // Import TimeScale for date axis
} from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the date adapter

// Register Chart.js components
ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  LineElement, 
  LinearScale, 
  PointElement, 
  CategoryScale,
  TimeScale // Register TimeScale
);

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
  // Ensure date and close price are valid
  return props.priceData.filter(point => 
    point && 
    point.date && 
    typeof point.close === 'number'
  );
});

// Calculate overall price change (for coloring)
const overallPriceChange = computed(() => {
  if (validPriceData.value.length < 2) return 0;
  // Use the filtered valid data
  const firstPrice = validPriceData.value[0].close;
  const lastPrice = validPriceData.value[validPriceData.value.length - 1].close;
  return lastPrice - firstPrice;
});

// Chart.js data configuration
const chartData = computed(() => {
  const labels = validPriceData.value.map(point => point.date); // Use date directly for TimeScale
  const data = validPriceData.value.map(point => point.close);
  const lineColor = overallPriceChange.value >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'; // Green or Red
  const pointBackgroundColor = overallPriceChange.value >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
  
  return {
    labels: labels,
    datasets: [
      {
        label: 'Price',
        data: data,
        borderColor: lineColor,
        backgroundColor: pointBackgroundColor, // Color for points/area if shown
        tension: 0.1, // Smooths the line slightly
        pointRadius: 1, // Smaller points
        pointHoverRadius: 5, // Larger points on hover
        borderWidth: 2 // Line thickness
      }
    ]
  };
});

// Chart.js options configuration
const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false // Hide the dataset legend
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        // Customize tooltip title (show date)
        title: function(tooltipItems) {
          const date = new Date(tooltipItems[0].parsed.x);
          return date.toLocaleDateString(); // Format date nicely
        },
        // Customize tooltip label (show price)
        label: function(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
          }
          return label;
        }
      }
    }
  },
  scales: {
    x: {
      type: 'time', // Use time scale for dates
      time: {
        unit: 'day', // Auto-detect or set specific unit (e.g., 'day', 'month')
         tooltipFormat: 'MMM dd, yyyy', // Format for tooltips
         displayFormats: { // Control how dates are displayed on the axis
             day: 'MMM dd', 
             week: 'MMM dd',
             month: 'MMM yyyy',
             year: 'yyyy'
         }
      },
      grid: {
        display: false // Hide x-axis grid lines
      },
      ticks: {
        autoSkip: true, // Automatically skip labels to prevent overlap
        maxTicksLimit: 8 // Limit the number of ticks shown
      }
    },
    y: {
      grid: {
        color: 'rgba(200, 200, 200, 0.2)' // Lighter grid lines
      },
      ticks: {
        // Format y-axis labels as currency
        callback: function(value) {
          return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
        }
      }
    }
  },
   interaction: { // Improve hover interaction
    mode: 'index',
    intersect: false
  }
}));
</script>

<style scoped>
.stock-chart {
  @apply bg-white rounded-lg p-4 shadow-md relative; /* Removed pb-6 as chart has padding */
}
</style> 