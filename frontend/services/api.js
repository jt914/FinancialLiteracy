import { useRuntimeConfig } from '#app';

/**
 * API service for interacting with the backend
 */

/**
 * Get popular tickers
 */
export const getPopularTickers = async () => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const response = await fetch(`${API_BASE_URL}/tickers`);
    if (!response.ok) throw new Error('Failed to fetch popular tickers');
    return await response.json();
  } catch (error) {
    console.error('Error fetching popular tickers:', error);
    throw error;
  }
};

/**
 * Get user's watchlist
 */
export const getWatchlist = async () => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(`${API_BASE_URL}/tickers/watchlist`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch watchlist');
    return await response.json();
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    throw error;
  }
};

/**
 * Get ticker details
 */
export const getTickerDetails = async (symbol) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const response = await fetch(`${API_BASE_URL}/tickers/${symbol}`);
    if (!response.ok) throw new Error(`Failed to fetch details for ${symbol}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ticker details for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Add ticker to watchlist
 */
export const addToWatchlist = async (symbol) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(`${API_BASE_URL}/tickers/watchlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ symbol })
    });
    
    if (!response.ok) throw new Error(`Failed to add ${symbol} to watchlist`);
    return await response.json();
  } catch (error) {
    console.error(`Error adding ${symbol} to watchlist:`, error);
    throw error;
  }
};

/**
 * Remove ticker from watchlist
 */
export const removeFromWatchlist = async (symbol) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(`${API_BASE_URL}/tickers/watchlist/${symbol}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error(`Failed to remove ${symbol} from watchlist`);
    return await response.json();
  } catch (error) {
    console.error(`Error removing ${symbol} from watchlist:`, error);
    throw error;
  }
};

/**
 * User login
 */
export const login = async (email, password) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    // Store token for future authenticated requests
    localStorage.setItem('token', data.token);
    localStorage.setItem('isAuthenticated', 'true');
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
};

/**
 * User registration
 */
export const register = async (userData) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
};

/**
 * User logout
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAuthenticated');
}; 