<template>
  <div>
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 p-4 rounded-lg text-red-700 mb-6">
      {{ error }}
    </div>
    
    <div v-else class="space-y-8">
      <!-- Ticker Header -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 class="text-3xl font-bold">{{ tickerData.metadata.name }}</h1>
            <p class="text-gray-600 text-lg">{{ tickerData.symbol }}</p>
          </div>
          
          <div class="flex flex-col items-end">
            <div class="text-3xl font-bold">${{ formattedPrice }}</div>
            <div :class="[priceChange >= 0 ? 'text-green-600' : 'text-red-600']" class="flex items-center">
              <span>{{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }} ({{ priceChangePercent.toFixed(2) }}%)</span>
              <svg v-if="priceChange >= 0" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12 7a1 1 0 01-1-1V5.414l-4.293 4.293a1 1 0 01-1.414-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 5.414V6a1 1 0 01-1 1z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M12 13a1 1 0 01-1 1v1.586l-4.293-4.293a1 1 0 01-1.414 1.414l6 6a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414L13 15.586V14a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button 
            @click="toggleWatchlist"
            class="btn flex items-center px-4 py-2 rounded-lg"
            :class="[isInWatchlist ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200']"
          >
            <span v-if="isInWatchlist">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              Remove from Watchlist
            </span>
            <span v-else>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Add to Watchlist
            </span>
          </button>
        </div>
      </div>
      
      <!-- Stock Chart -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Price History</h2>
        <StockChart 
          :price-data="tickerData.priceData" 
          @period-change="handlePeriodChange"
        />
      </div>
      
      <!-- Company Info -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Company Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="space-y-2">
              <div>
                <span class="text-gray-600">Description:</span>
                <p>{{ tickerData.metadata.description }}</p>
              </div>
              <div>
                <span class="text-gray-600">Exchange:</span>
                <span class="ml-2">{{ tickerData.metadata.exchangeCode }}</span>
              </div>
              <div>
                <span class="text-gray-600">Industry:</span>
                <span class="ml-2">{{ tickerData.metadata.industry || 'N/A' }}</span>
              </div>
            </div>
          </div>
          <div>
            <div class="space-y-2">
              <div>
                <span class="text-gray-600">Market Cap:</span>
                <span class="ml-2">${{ formatMarketCap(tickerData.metadata.marketCap) }}</span>
              </div>
              <div>
                <span class="text-gray-600">52-Week High:</span>
                <span class="ml-2">${{ tickerData.metadata.high52 ? tickerData.metadata.high52.toFixed(2) : 'N/A' }}</span>
              </div>
              <div>
                <span class="text-gray-600">52-Week Low:</span>
                <span class="ml-2">${{ tickerData.metadata.low52 ? tickerData.metadata.low52.toFixed(2) : 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { getTickerDetails, addToWatchlist as apiAddToWatchlist, removeFromWatchlist as apiRemoveFromWatchlist, getWatchlist } from '~/services/api';
import StockChart from '~/components/StockChart.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuth();
const symbol = computed(() => route.params.symbol);

const tickerData = ref(null);
const loading = ref(true);
const error = ref(null);
const isInWatchlist = ref(false);

const formattedPrice = computed(() => {
  if (!tickerData.value) return '--';
  
  const priceData = tickerData.value.priceData;
  return priceData[priceData.length - 1].close.toFixed(2);
});

const priceChange = computed(() => {
  if (!tickerData.value) return 0;
  
  const priceData = tickerData.value.priceData;
  return priceData[priceData.length - 1].close - priceData[priceData.length - 2].close;
});

const priceChangePercent = computed(() => {
  if (!tickerData.value) return 0;
  
  const priceData = tickerData.value.priceData;
  const current = priceData[priceData.length - 1].close;
  const previous = priceData[priceData.length - 2].close;
  
  return ((current - previous) / previous) * 100;
});

const formatMarketCap = (value) => {
  if (!value) return 'N/A';
  
  if (value >= 1e12) return (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  
  return value.toLocaleString();
};

onMounted(async () => {
  await fetchTickerData();
});

const fetchTickerData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // In a production app, we would fetch from the API
    tickerData.value = await getTickerDetails(symbol.value);
    
    // Check if the ticker is in the watchlist (if authenticated)
    if (auth.isAuthenticated.value) {
      try {
        const userWatchlist = await getWatchlist();
        isInWatchlist.value = userWatchlist.some(item => item.symbol === symbol.value);
      } catch (watchlistError) {
        console.error('Failed to check watchlist status:', watchlistError);
        // Decide how to handle this error - maybe show a message?
        // For now, we assume it's not in the watchlist if the check fails
        isInWatchlist.value = false; 
      }
    } else {
      isInWatchlist.value = false; // Not authenticated, so not in watchlist
    }
    
    loading.value = false;
  } catch (err) {
    error.value = `Failed to load data for ${symbol.value}`;
    loading.value = false;
    console.error(err);
  }
};

const handlePeriodChange = (period) => {
  console.log(`Changing period to ${period}`);
  // In a real app, we would fetch new data for the selected period
  // This is just a placeholder for now
};

const toggleWatchlist = async () => {
  if (!auth.isAuthenticated.value) {
    // Redirect to login if not authenticated
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }
  
  try {
    if (isInWatchlist.value) {
      // In a real app, we would make the API call
      await apiRemoveFromWatchlist(symbol.value);
      isInWatchlist.value = false; // Optimistic update
    } else {
      // In a real app, we would make the API call
      await apiAddToWatchlist(symbol.value);
      isInWatchlist.value = true; // Optimistic update
    }
    // Optionally add success feedback (e.g., toast notification)
  } catch (err) {
    alert('Failed to update watchlist');
    console.error(err);
  }
};
</script> 