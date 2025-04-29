<template>
  <div class="bg-white rounded-lg shadow-md overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1">
    <!-- Make the card clickable with NuxtLink -->
    <NuxtLink :to="`/ticker/${ticker.symbol}`" class="block">
      <!-- Card Header -->
      <div class="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <div>
          <h3 class="font-bold text-lg text-blue-600 hover:underline">{{ ticker.symbol }}</h3>
          <p class="text-sm text-gray-600">{{ ticker.name }}</p>
        </div>
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span class="text-sm text-blue-500">View Details</span>
        </div>
      </div>
    </NuxtLink>
      
    <!-- Card Body -->
    <div class="p-4">
      <!-- Price Information -->
      <div class="flex justify-between items-baseline mb-4">
        <span class="text-2xl font-bold">${{ formatPrice(ticker.latestPrice) }}</span>
        <span 
          class="text-sm font-medium"
          :class="{'text-green-600': ticker.change >= 0, 'text-red-600': ticker.change < 0}"
        >
          {{ ticker.change >= 0 ? '+' : '' }}{{ formatPrice(ticker.change) }} ({{ formatPrice(ticker.changePercent) }}%)
        </span>
      </div>
      
      <!-- Add to Watchlist Button -->
      <button 
        @click.prevent="addToWatchlist"
        class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded flex items-center justify-center space-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Add to Watchlist</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  ticker: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['add-to-watchlist']);

const addToWatchlist = () => {
  emit('add-to-watchlist', props.ticker.symbol);
};

const formatPrice = (price) => {
  return typeof price === 'number' ? price.toFixed(2) : '0.00';
};
</script> 