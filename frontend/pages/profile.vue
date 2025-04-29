<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Your Profile</h1>

    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <div v-else-if="error" class="bg-red-100 p-4 rounded-lg text-red-700 mb-6">
      {{ error }}
    </div>

    <form v-else @submit.prevent="handleUpdateProfile" class="bg-white rounded-lg shadow-md p-6 space-y-6">
      <!-- Name -->
      <div>
        <label for="name" class="form-label">Name</label>
        <input type="text" id="name" v-model="profile.name" class="form-input" required>
      </div>

      <!-- Financial Goals -->
      <div>
        <label class="form-label">Financial Goals (Select up to 3)</label>
        <div class="space-y-2">
          <div v-for="goal in availableGoals" :key="goal.value" class="flex items-center">
            <input 
              type="checkbox" 
              :id="`goal-${goal.value}`" 
              :value="goal.value" 
              v-model="profile.financialGoals"
              :disabled="profile.financialGoals.length >= 3 && !profile.financialGoals.includes(goal.value)"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            >
            <label :for="`goal-${goal.value}`" class="ml-3 block text-sm text-gray-700">{{ goal.label }}</label>
          </div>
        </div>
      </div>

      <!-- Knowledge Level -->
      <div>
        <label for="knowledgeLevel" class="form-label">Financial Knowledge Level</label>
        <select id="knowledgeLevel" v-model="profile.knowledgeLevel" class="form-input" required>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <!-- Risk Tolerance -->
      <div>
        <label for="riskTolerance" class="form-label">Risk Tolerance</label>
        <select id="riskTolerance" v-model="profile.riskTolerance" class="form-input" required>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <!-- Submit Button -->
      <div class="pt-4">
        <button type="submit" class="btn btn-primary w-full md:w-auto" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : 'Save Profile' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '~/composables/useAuth';
import { useToasts } from '~/composables/useToasts';
import { getProfile, updateProfile } from '~/services/api';

definePageMeta({ middleware: 'auth' }); // Ensure user is logged in

const auth = useAuth();
const { addToast } = useToasts();
const router = useRouter();

const profile = reactive({
  name: '',
  financialGoals: [],
  knowledgeLevel: 'beginner',
  riskTolerance: 'low'
});

const availableGoals = [
  { value: 'retirement', label: 'Save for Retirement' },
  { value: 'buy_home', label: 'Buy a Home' },
  { value: 'education', label: 'Pay for Education' },
  { value: 'investment', label: 'Grow Investments' },
  { value: 'debt_reduction', label: 'Reduce Debt' },
  { value: 'emergency_fund', label: 'Build Emergency Fund' }
];

const loading = ref(true);
const error = ref(null);
const isSubmitting = ref(false);

onMounted(async () => {
  await fetchProfileData();
});

const fetchProfileData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await getProfile();
    // Assign fetched data to the reactive profile object
    profile.name = data.profile?.name || '';
    profile.financialGoals = data.profile?.financialGoals || [];
    profile.knowledgeLevel = data.profile?.knowledgeLevel || 'beginner';
    profile.riskTolerance = data.profile?.riskTolerance || 'low';
  } catch (err) {
    error.value = 'Failed to load profile data. Please try again.';
    addToast(error.value, 'error');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const handleUpdateProfile = async () => {
  isSubmitting.value = true;
  error.value = null;
  try {
    // Prepare data in the format expected by the backend
    const profileDataToUpdate = {
      name: profile.name,
      financialGoals: profile.financialGoals,
      knowledgeLevel: profile.knowledgeLevel,
      riskTolerance: profile.riskTolerance
    };
    await updateProfile(profileDataToUpdate);
    addToast('Profile updated successfully!', 'success');
  } catch (err) {
    error.value = err.message || 'Failed to update profile.';
    addToast(error.value, 'error');
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};
</script> 