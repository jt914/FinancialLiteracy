<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-blue-600">Financial Literacy</h1>
          <nav class="space-x-4">
            <NuxtLink to="/" class="text-gray-700 hover:text-blue-600">Home</NuxtLink>
            <NuxtLink to="/watchlist" class="text-gray-700 hover:text-blue-600">Watchlist</NuxtLink>
            
            <!-- Show Login link if not authenticated -->
            <client-only>
              <template v-if="!isAuthenticated">
                <NuxtLink to="/login" class="text-gray-700 hover:text-blue-600">Login</NuxtLink>
              </template>
              
              <!-- Show user menu if authenticated -->
              <div v-else class="relative inline-block text-left">
                <button 
                  ref="userMenuButton" 
                  @click="toggleUserMenu" 
                  class="flex items-center text-gray-700 hover:text-blue-600 focus:outline-none"
                >
                  <span class="mr-1">Account</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <!-- Dropdown menu -->
                <div 
                  ref="userMenuDropdown"
                  v-if="userMenuOpen"
                  class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                >
                  <div class="py-1">
                    <NuxtLink to="/profile" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</NuxtLink>
                    <button 
                      @click="handleLogout" 
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </client-only>
          </nav>
        </div>
      </div>
    </header>
    <main class="container mx-auto px-4 py-8">
      <NuxtPage />
    </main>
    <footer class="bg-gray-100 py-6">
      <div class="container mx-auto px-4 text-center text-gray-500">
        &copy; 2025 Financial Literacy. All rights reserved.
      </div>
    </footer>
    
    <!-- Toast Notifications Container -->
    <ToastNotification /> 
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import ToastNotification from '~/components/ToastNotification.vue';

const router = useRouter();
const auth = useAuth();
const isAuthenticated = computed(() => auth.isAuthenticated.value);

// User dropdown menu
const userMenuOpen = ref(false);
const userMenuButton = ref(null); // Ref for the button
const userMenuDropdown = ref(null); // Ref for the dropdown

// Toggle user menu
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value;
};

// Close user menu when clicking outside
const closeUserMenu = (event) => {
  // Check if the click target exists and if the menu is open
  if (userMenuOpen.value && event.target) {
    // Check if the click was outside the button AND outside the dropdown
    const isClickInsideButton = userMenuButton.value?.contains(event.target);
    const isClickInsideDropdown = userMenuDropdown.value?.contains(event.target);
    
    if (!isClickInsideButton && !isClickInsideDropdown) {
      userMenuOpen.value = false;
    }
  }
};

// Handle logout
const handleLogout = () => {
  auth.logout();
  userMenuOpen.value = false;
  router.push('/');
};

// Add event listener for clicks outside the menu
onMounted(() => {
  document.addEventListener('click', closeUserMenu);
});

// Remove event listener when component is unmounted
onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu);
});
</script>
