<template>
  <div class="bg-gray-50 min-h-screen py-8">
    <div v-if="loading" class="container mx-auto px-4 flex justify-center">
      <!-- Loading Skeleton -->
      <div class="animate-pulse w-full max-w-4xl">
        <div class="h-10 w-3/5 bg-gray-300 rounded mb-2"></div>
        <div class="h-6 w-1/4 bg-gray-300 rounded mb-6"></div>
        <div class="h-8 w-1/3 bg-gray-300 rounded mb-6"></div>
        <div class="h-72 bg-gray-300 rounded mb-8"></div>
        <div class="h-32 bg-gray-300 rounded mb-8"></div>
        <div class="h-48 bg-gray-300 rounded"></div>
      </div>
    </div>
    
    <div v-else-if="error" class="container mx-auto px-4 text-center">
      <div class="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <h2 class="text-xl font-semibold text-red-600 mb-4">Error Loading Data</h2>
        <p class="text-gray-700 mb-4">{{ error }}</p>
        <button @click="fetchData" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150">
          Try Again
        </button>
      </div>
    </div>
    
    <div v-else class="container mx-auto px-4 max-w-4xl">
      <!-- Company Header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div class="mb-4 sm:mb-0">
          <h1 class="text-3xl font-bold text-gray-800">{{ tickerData.name || symbol }}</h1>
          <p class="text-lg text-gray-500">{{ tickerData.symbol || symbol }}</p>
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
      <div class="mb-8">
        <div class="flex items-baseline space-x-3">
          <span class="text-4xl font-bold text-gray-900">{{ formattedPrice }}</span>
          <span 
            class="text-xl font-medium"
            :class="{
              'text-green-600': priceChange >= 0, 
              'text-red-600': priceChange < 0
            }"
          >
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }} 
            ({{ priceChangePercent }})
          </span>
        </div>
      </div>
      
      <!-- Stock Chart -->
      <div class="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
        <StockChart 
          :price-data="tickerData.prices || []"
          :initial-period="selectedPeriod" 
          @period-change="changePeriod"
        />
      </div>
      
      <!-- Cards Section -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Company Information Card -->
        <div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 class="text-xl font-semibold text-gray-800 mb-3">About {{ tickerData.name || symbol }}</h2>
          <p class="text-gray-700 leading-relaxed">{{ tickerData.description || 'No company description available.' }}</p>
        </div>
        
        <!-- Key Statistics Card -->
        <div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Key Statistics</h2>
          <div v-if="hasKeyStats" class="grid grid-cols-2 gap-x-4 gap-y-3">
            <div v-for="(value, key) in filteredStats" :key="key">
              <p class="text-sm text-gray-500">{{ formatStatLabel(key) }}</p>
              <p class="font-semibold text-gray-800">{{ formatStatValue(key, value) }}</p>
            </div>
          </div>
          <div v-else class="text-gray-500 italic">
            No statistical data available for this ticker.
          </div>
        </div>
      </div>

      <!-- AI Explanation Button Card -->
       <div class="mt-6 bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
        <h2 class="text-xl font-semibold text-gray-800 mb-3">AI-Powered Insights</h2>
        <p class="text-gray-700 mb-4">Get a personalized explanation of this stock based on your profile.</p>
        <button 
          @click="getStockExplanation" 
          class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-semibold transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loadingExplanation"
        >
          <span v-if="loadingExplanation" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
          <span>{{ loadingExplanation ? 'Generating Explanation...' : 'Explain This Stock For Me' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Explanation Modal (no style changes needed here, relies on ModalDialog component) -->
     <client-only>
      <ModalDialog
        v-if="true" 
        :show="showExplanationModal"
        title="AI-Powered Stock Explanation"
        @close="showExplanationModal = false"
        size="lg"
      >
        <div v-if="explanation" class="prose max-w-none">
          <h3 class="text-xl font-semibold mb-2">{{ tickerData.name || symbol }} ({{ symbol }})</h3>
          <div v-html="parsedExplanation"></div>
          
          <div v-if="explanation.risks && explanation.risks.length" class="mt-6">
            <h4 class="font-semibold text-lg mb-2">Potential Risks</h4>
            <ul class="list-disc pl-5">
              <li v-for="(risk, index) in explanation.risks" :key="index" class="mb-1" v-html="parseMarkdown(risk)"></li>
            </ul>
          </div>
          
          <div v-if="explanation.advice" class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="font-semibold text-lg mb-2">Personalized Advice</h4>
            <p v-html="parseMarkdown(explanation.advice)"></p>
          </div>
        </div>
        <div v-else-if="loadingExplanation" class="flex justify-center items-center py-10">
           <span class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></span>
           <span class="text-gray-600">Generating personalized explanation...</span>
        </div>
         <div v-else class="text-gray-500 italic py-10 text-center">
          Could not load explanation.
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
    loading.value = true;
    error.value = null;
    tickerData.value = {}; // Clear previous data
    explanation.value = null; // Clear previous explanation
    
    // Get ticker data with selected period
    const data = await getTickerDetailsWithPeriod(symbol, selectedPeriod.value);
    tickerData.value = data;
    
    // Get user's watchlist
    if (process.client) { // Only fetch watchlist on client-side
      try {
        const watchlistData = await getWatchlist();
        watchlist.value = watchlistData;
      } catch (watchlistError) {
        console.error('Error fetching watchlist:', watchlistError);
        // Optional: addToast('Could not load watchlist status', 'warning');
      }
    }
    
  } catch (err) {
    // Check if the error has a specific message from the backend
    const message = err.response?.data?.message || 'Failed to load ticker data. Please try again.';
    error.value = message;
    console.error('Error fetching ticker data:', err);
    addToast('Error loading ticker data', 'error');
  } finally {
    loading.value = false;
  }
};

// Handle period change from chart component
const changePeriod = (period) => {
  if (selectedPeriod.value === period) return; // Avoid refetch if period didn't change
  selectedPeriod.value = period;
  fetchData(); // Refetch data for the new period
};

// Watchlist actions
const addToWatchlist = async () => {
  try {
    await addToWatchlistAPI(symbol);
    // Optimistically update UI
    watchlist.value = [...watchlist.value, { symbol: symbol }]; 
    addToast(`${symbol} added to watchlist`, 'success');
  } catch (err) {
     // Revert optimistic update on error if needed
     watchlist.value = watchlist.value.filter(item => item.symbol !== symbol);
    console.error('Error adding to watchlist:', err);
    addToast('Failed to add to watchlist', 'error');
  }
};

const removeFromWatchlist = async () => {
  const originalWatchlist = [...watchlist.value];
  try {
     // Optimistically update UI
     watchlist.value = watchlist.value.filter(item => item.symbol !== symbol);
    await removeFromWatchlistAPI(symbol);
    addToast(`${symbol} removed from watchlist`, 'success');
  } catch (err) {
    // Revert optimistic update on error
    watchlist.value = originalWatchlist;
    console.error('Error removing from watchlist:', err);
    addToast('Failed to remove from watchlist', 'error');
  }
};

// Get AI-powered explanation of the stock
const getStockExplanation = async () => {
  if (loadingExplanation.value) return;
  try {
    loadingExplanation.value = true;
    explanation.value = null; // Clear previous explanation
    showExplanationModal.value = true;
    
    // TODO: Get user preferences dynamically from profile/settings
    const userPreferences = {
      experienceLevel: 'beginner', 
      riskTolerance: 'moderate' 
    };
    
    const data = await explainStock(symbol, userPreferences);
    explanation.value = data;
    
  } catch (err) {
    console.error('Error getting stock explanation:', err);
    addToast('Failed to load stock explanation', 'error');
    // Optionally close modal or show error message inside
     explanation.value = { error: 'Could not generate explanation at this time.' }; 
  } finally {
    loadingExplanation.value = false;
  }
};

// Format key statistics for display
const formatStatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const formatStatValue = (key, value) => {
  if (value === null || value === undefined) return 'N/A';
  
  // Handle market cap specifically for better formatting
  if (key === 'marketCap') {
      if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toLocaleString()}`;
  }
  
  if (typeof value === 'number') {
      if (key.toLowerCase().includes('price') || key.toLowerCase().includes('value') || key.toLowerCase().includes('eps')) {
        return `$${value.toFixed(2)}`;
      }
      if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('ratio') || key.toLowerCase().includes('yield')) {
        return `${value.toFixed(2)}%`;
      }
      if (key.toLowerCase().includes('volume')) {
          if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
          if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
          if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
        return value.toLocaleString();
      }
       return value.toLocaleString(); // Default number formatting
  }
  
  return value; // Return as string if not a number
};

// Computed properties
const formattedPrice = computed(() => {
  if (!tickerData.value || typeof tickerData.value.price !== 'number') return '$0.00';
  return `$${tickerData.value.price.toFixed(2)}`;
});

const priceChange = computed(() => {
  if (!tickerData.value || typeof tickerData.value.priceChange !== 'number') return 0;
  return tickerData.value.priceChange;
});

const priceChangePercent = computed(() => {
  if (!tickerData.value || typeof tickerData.value.priceChangePercent !== 'number') return '0.00%';
  // Add plus sign for positive change
  const sign = tickerData.value.priceChangePercent >= 0 ? '+' : '';
  return `${sign}${tickerData.value.priceChangePercent.toFixed(2)}%`;
});

const filteredStats = computed(() => {
  const stats = tickerData.value?.stats || {};
  // Define a preferred order or filter specific stats if needed
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
  // Ensure watchlist is an array before checking
  return Array.isArray(watchlist.value) && watchlist.value.some(item => item && item.symbol === symbol);
});

// Parse markdown content safely
const parseMarkdown = (content) => {
  if (!content) return '';
  try {
     // Basic sanitization or use a dedicated library if complex HTML is allowed
    return marked(content);
  } catch (e) {
    console.error('Error parsing markdown:', e);
    return 'Error displaying content'; // Avoid rendering potentially broken HTML
  }
};

// Computed property for parsed explanation
const parsedExplanation = computed(() => {
   if (explanation.value?.error) {
       return `<p class="text-red-500">${explanation.value.error}</p>`;
   }
  if (!explanation.value || !explanation.value.explanation) return '';
  return parseMarkdown(explanation.value.explanation);
});

// Server-side prefetch (remains the same)
onServerPrefetch(async () => {
  await fetchData();
});

// Load data on component mount (client-side, remains the same)
onMounted(() => {
  if (process.client) {
    // Check if data was already fetched server-side
    if (!tickerData.value || Object.keys(tickerData.value).length === 0) {
        fetchData();
    }
  }
});
</script>

<style scoped>
/* Add any component-specific styles here if needed */
/* Using Tailwind utility classes primarily */
</style> 