import { useRuntimeConfig } from '#app';

/**
 * Base API service with common functionality
 */
class ApiService {
  constructor(baseUrl) {
    this.API_BASE_URL = baseUrl;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async get(endpoint, requiresAuth = false) {
    try {
      const headers = requiresAuth ? this.getAuthHeaders() : {};
      
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        headers
      });
      
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`GET error for ${endpoint}:`, error);
      throw error;
    }
  }

  async post(endpoint, data, requiresAuth = false) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...requiresAuth ? this.getAuthHeaders() : {}
      };
      
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`POST error for ${endpoint}:`, error);
      throw error;
    }
  }

  async delete(endpoint, requiresAuth = false) {
    try {
      const headers = requiresAuth ? this.getAuthHeaders() : {};
      
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`DELETE error for ${endpoint}:`, error);
      throw error;
    }
  }

  async put(endpoint, data, requiresAuth = false) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...requiresAuth ? this.getAuthHeaders() : {}
      };
      
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error(`PUT error for ${endpoint}:`, error);
      throw error;
    }
  }
}

/**
 * Composable to use the API service within Nuxt's lifecycle
 */
export const useApiService = () => {
  const config = useRuntimeConfig();
  const apiBaseUrl = config.public.apiBase;
  
  // Create a new instance each time the composable is called
  const apiService = new ApiService(apiBaseUrl);
  
  // Create service objects for different API categories
  const tickerService = {
    getPopularTickers: () => apiService.get('/tickers'),
    getWatchlist: () => apiService.get('/tickers/watchlist', true),
    getTickerDetails: (symbol) => apiService.get(`/tickers/${symbol}`),
    getTickerDetailsWithPeriod: (symbol, period = '1D') => 
      apiService.get(`/tickers/${symbol}?period=${period}`),
    addToWatchlist: (symbol) => 
      apiService.post('/tickers/watchlist', { symbol }, true),
    removeFromWatchlist: (symbol) => 
      apiService.delete(`/tickers/watchlist/${symbol}`, true),
    explainStock: (symbol, userPreferences = {}) => 
      apiService.post('/tickers/explain', { symbol, preferences: userPreferences }, true)
  };

  const authService = {
    login: async (email, password) => {
      const data = await apiService.post('/auth/login', { email, password });
      // Store token for future authenticated requests
      localStorage.setItem('token', data.token);
      localStorage.setItem('isAuthenticated', 'true');
      return data;
    },
    register: (userData) => apiService.post('/auth/register', userData),
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
    }
  };

  const profileService = {
    getProfile: () => apiService.get('/profile', true),
    updateProfile: (profileData) => apiService.put('/profile', profileData, true)
  };

  const roadmapService = {
    getRoadmap: () => apiService.get('/roadmap', true),
    updateRoadmapProgress: (moduleId, lessonId, completed) => 
      apiService.post('/roadmap/progress', { moduleId, lessonId, completed }, true)
  };

  const accountService = {
    getAccounts: () => apiService.get('/accounts', true),
    addAccount: (accountData) => apiService.post('/accounts', accountData, true),
    updateAccount: (accountId, accountData) => 
      apiService.put(`/accounts/${accountId}`, accountData, true),
    deleteAccount: (accountId) => apiService.delete(`/accounts/${accountId}`, true)
  };

  // Return all services
  return {
    tickerService,
    authService,
    profileService,
    roadmapService,
    accountService
  };
};

// Backward compatibility exports - now these will be functions that call the services
// Only call these within the proper Nuxt context
export const getPopularTickers = async () => {
  const { tickerService } = useApiService();
  return tickerService.getPopularTickers();
};

export const getWatchlist = async () => {
  const { tickerService } = useApiService();
  return tickerService.getWatchlist();
};

export const getTickerDetails = async (symbol) => {
  const { tickerService } = useApiService();
  return tickerService.getTickerDetails(symbol);
};

export const getTickerDetailsWithPeriod = async (symbol, period = '1D') => {
  const { tickerService } = useApiService();
  return tickerService.getTickerDetailsWithPeriod(symbol, period);
};

export const addToWatchlist = async (symbol) => {
  const { tickerService } = useApiService();
  return tickerService.addToWatchlist(symbol);
};

export const removeFromWatchlist = async (symbol) => {
  const { tickerService } = useApiService();
  return tickerService.removeFromWatchlist(symbol);
};

export const explainStock = async (symbol, userPreferences = {}) => {
  const { tickerService } = useApiService();
  return tickerService.explainStock(symbol, userPreferences);
};

export const login = async (email, password) => {
  const { authService } = useApiService();
  return authService.login(email, password);
};

export const register = async (userData) => {
  const { authService } = useApiService();
  return authService.register(userData);
};

export const logout = () => {
  const { authService } = useApiService();
  authService.logout();
};

export const getProfile = async () => {
  const { profileService } = useApiService();
  return profileService.getProfile();
};

export const updateProfile = async (profileData) => {
  const { profileService } = useApiService();
  return profileService.updateProfile(profileData);
};

export const getRoadmap = async () => {
  const { roadmapService } = useApiService();
  return roadmapService.getRoadmap();
};

export const updateRoadmapProgress = async (moduleId, lessonId, completed) => {
  const { roadmapService } = useApiService();
  return roadmapService.updateRoadmapProgress(moduleId, lessonId, completed);
};

export const getAccounts = async () => {
  const { accountService } = useApiService();
  return accountService.getAccounts();
};

export const addAccount = async (accountData) => {
  const { accountService } = useApiService();
  return accountService.addAccount(accountData);
};

export const updateAccount = async (accountId, accountData) => {
  const { accountService } = useApiService();
  return accountService.updateAccount(accountId, accountData);
};

export const deleteAccount = async (accountId) => {
  const { accountService } = useApiService();
  return accountService.deleteAccount(accountId);
}; 