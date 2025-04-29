<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Your Watchlist</h1>
    
    <div v-if="!isAuthenticated" class="bg-yellow-50 p-6 rounded-lg mb-6 text-center">
      <p class="text-yellow-700 mb-4">You need to be logged in to view your watchlist.</p>
      <NuxtLink to="/login" class="btn btn-primary">
        Log in
      </NuxtLink>
    </div>
    
    <div v-else-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 p-4 rounded-lg text-red-700 mb-6">
      {{ error }}
    </div>
    
    <div v-else-if="watchlist.length === 0" class="bg-gray-50 p-6 rounded-lg text-center">
      <p class="text-gray-600 mb-4">Your watchlist is empty.</p>
      <NuxtLink to="/" class="text-blue-500 hover:underline">
        Browse popular tickers
      </NuxtLink>
    </div>
    
    <div v-else>
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
          <thead class="bg-gray-100">
            <tr>
              <th class="py-3 px-4 text-left text-gray-700 font-semibold">Symbol</th>
              <th class="py-3 px-4 text-left text-gray-700 font-semibold">Name</th>
              <th class="py-3 px-4 text-right text-gray-700 font-semibold">Price</th>
              <th class="py-3 px-4 text-right text-gray-700 font-semibold">Change</th>
              <th class="py-3 px-4 text-center text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="ticker in watchlist" :key="ticker.symbol" class="hover:bg-gray-50">
              <td class="py-4 px-4">
                <NuxtLink :to="`/ticker/${ticker.symbol}`" class="font-medium text-blue-600 hover:underline">
                  {{ ticker.symbol }}
                </NuxtLink>
              </td>
              <td class="py-4 px-4 text-gray-700">{{ ticker.name }}</td>
              <td class="py-4 px-4 text-right font-medium">${{ ticker.latestPrice.toFixed(2) }}</td>
              <td class="py-4 px-4 text-right" :class="[ticker.change >= 0 ? 'text-green-600' : 'text-red-600']">
                {{ ticker.change >= 0 ? '+' : '' }}{{ ticker.change.toFixed(2) }} ({{ ticker.changePercent.toFixed(2) }}%)
              </td>
              <td class="py-4 px-4 text-center">
                <button 
                  @click="removeFromWatchlist(ticker.symbol)"
                  class="text-red-500 hover:text-red-700"
                  title="Remove from watchlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { getWatchlist, removeFromWatchlist as apiRemoveFromWatchlist } from '~/services/api';

const auth = useAuth();
const isAuthenticated = computed(() => auth.isAuthenticated.value);
const watchlist = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  if (isAuthenticated.value) {
    await fetchWatchlist();
  } else {
    loading.value = false;
  }
});

const fetchWatchlist = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // In a production app, we would fetch from the API
    watchlist.value = await getWatchlist();
    
    // Removed dummy data and simulation
    
    loading.value = false;
  } catch (err) {
    error.value = 'Failed to load your watchlist';
    loading.value = false;
    console.error(err);
  }
};

const removeFromWatchlist = async (symbol) => {
  try {
    // In a real app, we would make the API call
    await apiRemoveFromWatchlist(symbol);
    
    // For demo purposes - REMOVED
    // watchlist.value = watchlist.value.filter(ticker => ticker.symbol !== symbol);
    // alert(`Removed ${symbol} from watchlist`);

    // Refresh the watchlist after successful removal
    await fetchWatchlist(); 
    // Optionally add success feedback (e.g., toast notification)

  } catch (err) {
    alert('Failed to remove from watchlist');
    console.error(err);
  }
};
</script> 