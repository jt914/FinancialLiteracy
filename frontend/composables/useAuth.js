import { ref, readonly } from 'vue';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '~/services/api';

const user = ref(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const error = ref(null);

// Initialize auth state from localStorage (if token exists)
const initAuth = () => {
  const token = localStorage.getItem('token');
  isAuthenticated.value = !!token;
  // In a real app, you would validate the token with the server
  // and fetch the user profile information
};

// Export the auth composable
export const useAuth = () => {
  // Initialize on first use
  if (process.client) {
    initAuth();
  }
  
  // Login function
  const login = async (email, password) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await apiLogin(email, password);
      user.value = response.user;
      isAuthenticated.value = true;
      return response;
    } catch (err) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Register function
  const register = async (userData) => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await apiRegister(userData);
      return response;
    } catch (err) {
      error.value = err.message || 'Registration failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Logout function
  const logout = () => {
    apiLogout();
    user.value = null;
    isAuthenticated.value = false;
  };
  
  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    login,
    register,
    logout
  };
}; 