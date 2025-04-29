<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Popular Tickers</h1>
    
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
import { getPopularTickers, addToWatchlist as apiAddToWatchlist } from '~/services/api';
import TickerCard from '../components/TickerCard.vue';

const router = useRouter();
const auth = useAuth();
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
    
    // For demo purposes
    // alert(`Added ${symbol} to watchlist`);
  } catch (err) {
    alert('Failed to add to watchlist');
    console.error(err);
  }
};
</script> 