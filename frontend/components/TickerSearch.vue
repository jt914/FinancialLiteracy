<template>
  <div class="ticker-search w-full max-w-lg mx-auto mb-8">
    <div class="flex items-center">
      <div class="relative flex-grow">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search for a ticker (e.g., AAPL, MSFT, GOOGL)"
          class="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          @keyup.enter="handleSearch"
        />
        <div v-if="searchQuery" class="absolute top-0 right-0 flex items-center h-full pr-3">
          <button 
            @click="clearSearch" 
            class="text-gray-400 hover:text-gray-600"
            title="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <button
        @click="handleSearch"
        class="ml-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
    <div v-if="error" class="mt-2 text-red-500 text-sm">
      {{ error }}
    </div>
    <div v-if="suggestions.length > 0" class="mt-2 bg-white rounded-lg shadow-lg border overflow-hidden">
      <ul>
        <li 
          v-for="suggestion in suggestions" 
          :key="suggestion.symbol"
          class="border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <NuxtLink 
            :to="`/ticker/${suggestion.symbol}`" 
            class="block px-4 py-3"
          >
            <div class="flex justify-between items-center">
              <div>
                <span class="font-bold text-blue-600">{{ suggestion.symbol }}</span> - 
                <span class="text-gray-800">{{ suggestion.name }}</span>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToasts } from '~/composables/useToasts';

const router = useRouter();
const { addToast } = useToasts();

const searchQuery = ref('');
const error = ref('');
const suggestions = ref([]);
const isLoading = ref(false);

// Common stock symbols for suggestions
const commonStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'PYPL', name: 'PayPal Holdings, Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'KO', name: 'The Coca-Cola Company' }
];

// Watch for changes in the search query to provide suggestions
watch(searchQuery, (newQuery) => {
  if (!newQuery) {
    suggestions.value = [];
    error.value = '';
    return;
  }
  
  const query = newQuery.toUpperCase();
  suggestions.value = commonStocks
    .filter(stock => 
      stock.symbol.includes(query) || 
      stock.name.toUpperCase().includes(query)
    )
    .slice(0, 5); // Limit to 5 suggestions
});

// Handle the search submission
const handleSearch = () => {
  if (!searchQuery.value) {
    error.value = 'Please enter a ticker symbol';
    return;
  }
  
  const symbol = searchQuery.value.toUpperCase().trim();
  
  // Basic validation for ticker symbol format
  if (!/^[A-Z]{1,5}$/.test(symbol)) {
    error.value = 'Please enter a valid ticker symbol (1-5 letters)';
    return;
  }
  
  // Navigate to the ticker page
  router.push(`/ticker/${symbol}`);
  searchQuery.value = '';
  suggestions.value = [];
};

// Clear the search input
const clearSearch = () => {
  searchQuery.value = '';
  suggestions.value = [];
  error.value = '';
};
</script> 