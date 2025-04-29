<template>
  <div>
    <button 
      v-if="!inWatchlist" 
      @click="handleAddToWatchlist"
      class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      Add to Watchlist
    </button>
    
    <button 
      v-else
      @click="handleRemoveFromWatchlist"
      class="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      In Watchlist
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import { useRouter } from 'vue-router';
import { useToasts } from '~/composables/useToasts';

const props = defineProps({
  symbol: {
    type: String,
    required: true
  },
  inWatchlist: {
    type: Boolean,
    default: false
  }
});

const auth = useAuth();
const router = useRouter();
const { addToast } = useToasts();

const emit = defineEmits(['add', 'remove']);

// If the user clicks the button but isn't authenticated, redirect to login
const handleAuthCheck = () => {
  if (!auth.isAuthenticated.value) {
    router.push({ 
      path: '/login', 
      query: { redirect: router.currentRoute.value.fullPath }
    });
    return false;
  }
  return true;
};

const handleAddToWatchlist = () => {
  if (handleAuthCheck()) {
    emit('add');
  }
};

const handleRemoveFromWatchlist = () => {
  if (handleAuthCheck()) {
    emit('remove');
  }
};
</script> 