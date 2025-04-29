<template>
  <div class="max-w-md mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center">{{ isRegister ? 'Create Account' : 'Log In' }}</h1>
    
    <div class="bg-white rounded-lg shadow-md p-8">
      <div v-if="error" class="bg-red-100 p-4 rounded-lg text-red-700 mb-6">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="isRegister" class="space-y-4">
          <div>
            <label for="name" class="form-label">Full Name</label>
            <input 
              type="text" 
              id="name" 
              v-model="name" 
              class="form-input"
              required
            />
          </div>
        </div>
        
        <div class="space-y-4">
          <div>
            <label for="email" class="form-label">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              class="form-input"
              required
            />
          </div>
          
          <div>
            <label for="password" class="form-label">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              class="form-input"
              required
            />
          </div>
        </div>
        
        <div>
          <button 
            type="submit" 
            class="btn btn-primary w-full"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="inline-flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
            <span v-else>{{ isRegister ? 'Create Account' : 'Log In' }}</span>
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center">
        <button 
          @click="isRegister = !isRegister" 
          class="text-blue-500 hover:underline"
        >
          {{ isRegister ? 'Already have an account? Log in' : 'Need an account? Register' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';

const route = useRoute();
const router = useRouter();
const auth = useAuth();

const isRegister = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');

// Computed properties that reference the auth state
const isLoading = computed(() => auth.isLoading.value);
const error = computed(() => auth.error.value);

const handleSubmit = async () => {
  try {
    if (isRegister.value) {
      // Handle registration
      await auth.register({
        name: name.value,
        email: email.value,
        password: password.value
      });
      
      // After successful registration, log in
      await auth.login(email.value, password.value);
    } else {
      // Handle login
      await auth.login(email.value, password.value);
    }
    
    // Get the redirect path from the query or default to home
    const redirectPath = route.query.redirect || '/';
    router.push(redirectPath);
  } catch (err) {
    // Error handling is done in the auth composable
    console.error(err);
  }
};
</script> 