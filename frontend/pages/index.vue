<template>
  <div>
    <h1 class="text-3xl font-bold mb-2">Financial Literacy</h1>
    <p class="text-gray-600 mb-6">Search for stocks, learn about companies, and track your investments.</p>
    
    <!-- Ticker Search Component -->
    <TickerSearch />

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">Popular Tickers</h2>
      <div class="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Click any ticker card for detailed information</span>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 p-4 rounded-lg text-red-700 mb-6">
      {{ error }}
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TickerCard 
        v-for="ticker in tickers" 
        :key="ticker.symbol" 
        :ticker="ticker"
        @add-to-watchlist="addToWatchlist"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useToasts } from '~/composables/useToasts';
import { getPopularTickers, addToWatchlist as apiAddToWatchlist } from '~/services/api';
import TickerCard from '../components/TickerCard.vue';
import TickerSearch from '../components/TickerSearch.vue';

const router = useRouter();
const auth = useAuth();
const { addToast } = useToasts();
const isAuthenticated = computed(() => auth.isAuthenticated.value);

const tickers = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  await fetchPopularTickers();
});

const fetchPopularTickers = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // In a production app, we would fetch from the API
    tickers.value = await getPopularTickers();
    
    // Removed dummy data and simulation
    
    loading.value = false;
  } catch (err) {
    error.value = 'Failed to load popular tickers';
    loading.value = false;
    console.error(err);
  }
};

const addToWatchlist = async (symbol) => {
  if (!isAuthenticated.value) {
    // Redirect to login if not authenticated
    router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } });
    return;
  }
  
  try {
    // In a real app, we would make the API call
    await apiAddToWatchlist(symbol);
    addToast(`${symbol} added to watchlist`, 'success');
    
    // Removed demo code
  } catch (err) {
    // alert('Failed to add to watchlist');
    addToast('Failed to add to watchlist', 'error');
    console.error(err);
  }
};
</script> 