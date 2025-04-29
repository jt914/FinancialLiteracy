<template>
  <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
    <div class="flex justify-between items-start">
      <div>
        <NuxtLink :to="`/ticker/${ticker.symbol}`" class="text-xl font-semibold hover:text-blue-600">
          {{ ticker.symbol }}
        </NuxtLink>
        <p class="text-gray-600">{{ ticker.name }}</p>
      </div>
      <button 
        @click="$emit('add-to-watchlist', ticker.symbol)"
        class="rounded-full p-2 text-blue-500 hover:bg-blue-50"
        title="Add to watchlist"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
    
    <div class="mt-4">
      <div class="text-2xl font-bold">${{ ticker.latestPrice }}</div>
      <div :class="[ticker.change >= 0 ? 'text-green-600' : 'text-red-600']">
        {{ ticker.change >= 0 ? '+' : '' }}{{ ticker.change.toFixed(2) }} ({{ ticker.changePercent.toFixed(2) }}%)
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  ticker: {
    type: Object,
    required: true
  }
});

defineEmits(['add-to-watchlist']);
</script> 