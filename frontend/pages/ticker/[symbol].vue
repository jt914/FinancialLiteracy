<template>
  <div>
    <div v-if="loading" class="p-4 flex justify-center">
      <div class="animate-pulse">
        <div class="h-12 w-48 bg-gray-300 rounded mb-4"></div>
        <div class="h-8 w-24 bg-gray-300 rounded mb-4"></div>
        <div class="h-64 bg-gray-300 rounded mb-4"></div>
        <div class="h-8 w-full bg-gray-300 rounded"></div>
      </div>
    </div>
    
    <div v-else-if="error" class="p-4 text-center">
      <p class="text-red-500">{{ error }}</p>
      <button @click="fetchData" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Try Again
      </button>
    </div>
    
    <div v-else class="p-4">
      <!-- Company Header -->
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-2xl font-bold">{{ tickerData.name || symbol }}</h1>
          <p class="text-gray-600">{{ tickerData.symbol || symbol }}</p>
        </div>
        
        <client-only>
          <WatchlistButton 
            :symbol="symbol" 
            :in-watchlist="inWatchlist" 
            @add="addToWatchlist"
            @remove="removeFromWatchlist"
          />
        </client-only>
      </div>
      
      <!-- Price Information -->
      <div class="mb-6">
        <div class="flex items-baseline">
          <span class="text-3xl font-bold mr-2">{{ formattedPrice }}</span>
          <span 
            class="text-lg"
            :class="{'text-green-600': priceChange > 0, 'text-red-600': priceChange < 0, 'text-gray-500': priceChange === 0}"
          >
            {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }} ({{ priceChangePercent }})
          </span>
        </div>
        <div class="text-sm text-gray-500 mt-1">
          Last Updated: {{ lastUpdated }}
        </div>
      </div>
      
      <!-- Stock Chart -->
      <div class="mb-6 bg-white rounded-lg shadow-md p-4">
        <div v-if="chartLoading" class="h-72 flex justify-center items-center">
          <div class="animate-pulse flex flex-col items-center">
            <div class="h-10 w-10 rounded-full border-3 border-blue-500 border-t-transparent animate-spin mb-3"></div>
            <p class="text-gray-500">Loading chart data...</p>
          </div>
        </div>
        <div v-else>
          <StockChart 
            :price-data="tickerData.prices || []"
            :initial-period="selectedPeriod" 
            @period-change="changePeriod"
          />
        </div>
      </div>
      
      <!-- Company Information -->
      <div class="bg-white rounded-lg p-4 shadow-md mb-6">
        <h2 class="text-lg font-semibold mb-2">About {{ tickerData.name || symbol }}</h2>
        <p>{{ tickerData.description || 'No company description available.' }}</p>
      </div>
      
      <!-- Key Statistics -->
      <div class="bg-white rounded-lg p-4 shadow-md mb-6">
        <h2 class="text-lg font-semibold mb-4">Key Statistics</h2>
        <div v-if="hasKeyStats" class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div v-for="(value, key) in filteredStats" :key="key" class="border-b pb-2">
            <p class="text-sm text-gray-600">{{ formatStatLabel(key) }}</p>
            <p class="font-semibold">{{ formatStatValue(key, value) }}</p>
          </div>
        </div>
        <div v-else class="text-gray-500 italic">
          No statistical data available for this ticker.
        </div>
      </div>
      
      <!-- AI Explanation Button -->
      <div class="bg-white rounded-lg p-4 shadow-md mb-6">
        <h2 class="text-lg font-semibold mb-2">Want to understand this stock better?</h2>
        <button 
          @click="getStockExplanation" 
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
          :disabled="loadingExplanation"
        >
          <span v-if="loadingExplanation" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ loadingExplanation ? 'Getting AI Explanation...' : 'Explain This Stock' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Explanation Modal -->
    <client-only>
      <ModalDialog
        v-if="true"
        :show="showExplanationModal"
        title="AI-Powered Stock Explanation"
        @close="showExplanationModal = false"
        size="lg"
      >
        <div v-if="explanation">
          <h3 class="text-xl font-semibold mb-2">{{ tickerData.name || symbol }} ({{ symbol }})</h3>
          <div class="prose max-w-none" v-html="parsedExplanation"></div>
          
          <div v-if="explanation.risks && explanation.risks.length" class="mt-4">
            <h4 class="font-semibold text-lg mb-2">Potential Risks</h4>
            <ul class="list-disc pl-5">
              <li v-for="(risk, index) in explanation.risks" :key="index" class="mb-1" v-html="parseMarkdown(risk)">
              </li>
            </ul>
          </div>
          
          <div v-if="explanation.advice" class="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 class="font-semibold text-lg mb-2">Financial Advice</h4>
            <p v-html="parseMarkdown(explanation.advice)"></p>
          </div>
        </div>
        <div v-else class="text-gray-500 italic">
          Data is loading....
        </div>
      </ModalDialog>
    </client-only>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onServerPrefetch } from 'vue';
import { 
  getTickerDetailsWithPeriod, 
  getWatchlist, 
  addToWatchlist as addToWatchlistAPI, 
  removeFromWatchlist as removeFromWatchlistAPI,
  explainStock
} from '~/services/api';
import { useToasts } from '~/composables/useToasts';
import StockChart from '~/components/StockChart.vue';
import WatchlistButton from '~/components/WatchlistButton.vue';
import ModalDialog from '~/components/ModalDialog.vue';
import { marked } from 'marked';

const route = useRoute();
const symbol = route.params.symbol;
const { addToast } = useToasts();

// State
const loading = ref(true);
const chartLoading = ref(false);
const error = ref(null);
const tickerData = ref({});
const watchlist = ref([]);
const selectedPeriod = ref('1M');
const showExplanationModal = ref(false);
const explanation = ref(null);
const loadingExplanation = ref(false);

// Fetch ticker data based on selected period
const fetchData = async () => {
  try {
    if (selectedPeriod.value === '1D') {
      chartLoading.value = true;
    } else {
      loading.value = true;
    }
    error.value = null;
    
    // Get ticker data with selected period
    const data = await getTickerDetailsWithPeriod(symbol, selectedPeriod.value);
    tickerData.value = data;
    
    // Get user's watchlist
    if (process.client) { // Only fetch watchlist on client-side to avoid hydration mismatch
      try {
        const watchlistData = await getWatchlist();
        watchlist.value = watchlistData;
      } catch (watchlistError) {
        console.error('Error fetching watchlist:', watchlistError);
        // Don't set main error, just log it
      }
    }
    
  } catch (err) {
    console.error(err);
    if (selectedPeriod.value === '1D') {
      error.value = 'Unable to load 1-day data. This may be because the market is closed or the data is not available. Please try another time period.';
      addToast('1-day data not available, try another period', 'warning');
    } else {
      error.value = 'Failed to load ticker data. Please try again.';
      addToast('Error loading ticker data', 'error');
    }
  } finally {
    loading.value = false;
    chartLoading.value = false;
  }
};

// Handle period change from chart component
const changePeriod = (period) => {
  selectedPeriod.value = period;
  chartLoading.value = true;
  fetchData();
};

// Watchlist actions
const addToWatchlist = async () => {
  try {
    await addToWatchlistAPI(symbol);
    watchlist.value.push({ symbol: symbol });
    addToast(`${symbol} added to watchlist`, 'success');
  } catch (err) {
    console.error('Error adding to watchlist:', err);
    addToast('Failed to add to watchlist', 'error');
  }
};

const removeFromWatchlist = async () => {
  try {
    await removeFromWatchlistAPI(symbol);
    watchlist.value = watchlist.value.filter(item => item.symbol !== symbol);
    addToast(`${symbol} removed from watchlist`, 'success');
  } catch (err) {
    console.error('Error removing from watchlist:', err);
    addToast('Failed to remove from watchlist', 'error');
  }
};

// Get AI-powered explanation of the stock
const getStockExplanation = async () => {
  try {
    loadingExplanation.value = true;
    showExplanationModal.value = true;
    
    // Get explanation based on user preferences
    // In a real app, these preferences might come from user settings
    const userPreferences = {
      experienceLevel: 'beginner', // beginner, intermediate, advanced
      interestAreas: ['growth', 'dividends', 'longTerm'],
      riskTolerance: 'moderate'
    };
    
    const data = await explainStock(symbol, userPreferences);
    explanation.value = data;
  } catch (err) {
    console.error('Error getting stock explanation:', err);
    addToast('Failed to load stock explanation', 'error');
  } finally {
    loadingExplanation.value = false;
  }
};

// Format key statistics for display
const formatStatLabel = (key) => {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const formatStatValue = (key, value) => {
  if (!value && value !== 0) return 'N/A';
  
  if (key.includes('price') || key.includes('value') || key.includes('cap')) {
    return `$${Number(value).toFixed(2)}`;
  }
  if (key.includes('percent') || key.includes('ratio') || key.includes('yield')) {
    return `${Number(value).toFixed(2)}%`;
  }
  if (key.includes('volume')) {
    return value.toLocaleString();
  }
  return value;
};

// Computed properties
const formattedPrice = computed(() => {
  if (!tickerData.value || !tickerData.value.price) return '$0.00';
  return `$${tickerData.value.price.toFixed(2)}`;
});

const priceChange = computed(() => {
  if (!tickerData.value || typeof tickerData.value.priceChange !== 'number') return 0;
  return tickerData.value.priceChange;
});

const priceChangePercent = computed(() => {
  if (!tickerData.value || typeof tickerData.value.priceChangePercent !== 'number') return '0.00%';
  return `${tickerData.value.priceChangePercent.toFixed(2)}%`;
});

const filteredStats = computed(() => {
  // Only include stats that have values
  const stats = tickerData.value?.stats || {};
  return Object.entries(stats)
    .filter(([_, value]) => value !== null && value !== undefined)
    .reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
});

const hasKeyStats = computed(() => {
  return Object.keys(filteredStats.value).length > 0;
});

const inWatchlist = computed(() => {
  return watchlist.value.some(item => item.symbol === symbol);
});

// Parse markdown content
const parseMarkdown = (content) => {
  if (!content) return '';
  return marked(content);
};

// Computed property for parsed explanation
const parsedExplanation = computed(() => {
  if (!explanation.value || !explanation.value.explanation) return '';
  return parseMarkdown(explanation.value.explanation);
});

// Additional computed properties
const lastUpdated = computed(() => {
  if (!tickerData.value || !tickerData.value.prices || !tickerData.value.prices.length) {
    return 'N/A';
  }
  
  // Get the last data point
  const latestPoint = [...tickerData.value.prices].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0];
  
  if (!latestPoint || !latestPoint.date) return 'N/A';
  
  const date = new Date(latestPoint.date);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Server-side prefetch
onServerPrefetch(async () => {
  await fetchData();
});

// Load data on component mount (client-side)
onMounted(() => {
  if (process.client) {
    fetchData();
  }
});
</script> 