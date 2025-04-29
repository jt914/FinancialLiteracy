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

/**
 * Get user profile data
 */
export const getProfile = async () => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch profile');
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Update user profile data
 */
export const updateProfile = async (profileData) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required');
    
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'POST', // Assuming POST for update as per outline
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.message || 'Failed to update profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Get AI-powered explanation of a stock
 */
export const explainStock = async (symbol, userPreferences = {}) => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    // Token is optional but beneficial for personalization
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/tickers/explain`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        symbol,
        preferences: userPreferences
      })
    });
    
    if (!response.ok) {
      // If the API endpoint isn't available or returns an error, provide fallback data
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`API endpoint for stock explanation returned an error. Using fallback data for ${symbol}.`);
        return generateFallbackExplanation(symbol, userPreferences);
      }
      throw new Error(`Failed to get explanation for ${symbol}`);
    }
    
    return await response.json();
  } catch (error) {
    // In development, provide fallback data instead of failing
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Error fetching explanation, using fallback data for ${symbol}:`, error);
      return generateFallbackExplanation(symbol, userPreferences);
    }
    console.error(`Error fetching explanation for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get ticker details with specific time period
 */
export const getTickerDetailsWithPeriod = async (symbol, period = '1D') => {
  const config = useRuntimeConfig();
  const API_BASE_URL = config.public.apiBase;
  try {
    const response = await fetch(`${API_BASE_URL}/tickers/${symbol}?period=${period}`);
    
    if (!response.ok) {
      // If the API endpoint isn't available or returns an error, provide fallback data
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`API endpoint for ticker details returned an error. Using fallback data for ${symbol}.`);
        return generateFallbackTickerData(symbol, period);
      }
      throw new Error(`Failed to fetch details for ${symbol} with period ${period}`);
    }
    
    return await response.json();
  } catch (error) {
    // In development, provide fallback data instead of failing
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Error fetching ticker details, using fallback data for ${symbol}:`, error);
      return generateFallbackTickerData(symbol, period);
    }
    console.error(`Error fetching ticker details for ${symbol} with period ${period}:`, error);
    throw error;
  }
};

/**
 * Generate fallback ticker data when API is unavailable (for development)
 */
const generateFallbackTickerData = (symbol, period) => {
  // Create sample price data based on the period
  const prices = [];
  const periodDays = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    '5Y': 1825
  };
  
  const days = periodDays[period] || 30;
  const basePrice = 150 + Math.random() * 100;
  const volatility = 0.02; // 2% daily volatility
  
  const now = new Date();
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
    const changePercent = (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    currentPrice = currentPrice * (1 + changePercent);
    const close = currentPrice;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    prices.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
  }
  
  // Calculate price change based on the first and last price point
  const startPrice = prices[0].close;
  const endPrice = prices[prices.length - 1].close;
  const priceChange = endPrice - startPrice;
  const priceChangePercent = (priceChange / startPrice) * 100;
  
  return {
    symbol,
    name: getCompanyName(symbol),
    price: endPrice,
    priceChange,
    priceChangePercent,
    prices,
    description: `This is sample data for ${symbol} (${getCompanyName(symbol)}) generated because the API is unavailable. In a production environment, this would contain real company information.`,
    stats: {
      marketCap: Math.round(endPrice * 1000000000 * (Math.random() + 0.5)),
      peRatio: Math.round((10 + Math.random() * 30) * 100) / 100,
      eps: Math.round((endPrice / 15 + Math.random() * 5) * 100) / 100,
      dividend: Math.round(Math.random() * 300) / 100,
      dividendYield: Math.round(Math.random() * 500) / 100,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      avgVolume: Math.floor(Math.random() * 15000000) + 5000000,
      high52Week: Math.round((endPrice * (1.2 + Math.random() * 0.5)) * 100) / 100,
      low52Week: Math.round((endPrice * (0.5 + Math.random() * 0.3)) * 100) / 100
    }
  };
};

/**
 * Generate fallback explanation data when API is unavailable (for development)
 */
const generateFallbackExplanation = (symbol, preferences) => {
  const companyName = getCompanyName(symbol);
  const experienceLevel = preferences.experienceLevel || 'beginner';
  
  // Tailor the explanation based on user experience level
  let explanation = '';
  let risks = [];
  let advice = '';
  
  if (experienceLevel === 'beginner') {
    explanation = `<p>${companyName} (${symbol}) is a publicly traded company. When you buy shares of ${symbol}, you're buying a small piece of ownership in the company.</p>
      <p>The stock price of ${symbol} changes based on supply and demand in the market. When more people want to buy the stock than sell it, the price goes up. When more people want to sell than buy, the price goes down.</p>
      <p>This is sample data generated because the API is currently unavailable. In production, you would see a detailed AI-generated explanation of ${symbol} tailored to your preferences.</p>`;
    
    risks = [
      "All investments carry risk, and you could lose money investing in any stock, including this one.",
      "This company might face competition that could affect its business performance.",
      "Economic downturns could negatively impact this company's growth."
    ];
    
    advice = "As a beginner investor, consider learning more about diversification and only invest money you can afford to lose.";
  } else if (experienceLevel === 'intermediate') {
    explanation = `<p>${companyName} (${symbol}) is traded on the public markets. This sample data is generated because the API is currently unavailable.</p>
      <p>In production, you would receive an intermediate-level analysis of ${symbol}'s financial performance, market position, and potential growth trajectory.</p>
      <p>This would include information about the company's recent quarterly results, competitive positioning, and key metrics that intermediate investors should monitor.</p>`;
    
    risks = [
      "The company may face increasing competition in its primary markets.",
      "Regulatory changes could impact the business model and profitability.",
      "Valuation metrics might suggest the stock is trading at a premium to its peers."
    ];
    
    advice = "Consider analyzing the company's financial ratios compared to industry averages before making an investment decision.";
  } else {
    explanation = `<p>This is sample advanced analysis data for ${companyName} (${symbol}) generated because the API is currently unavailable.</p>
      <p>In production, you would receive detailed analysis of ${symbol}'s balance sheet, income statement, and cash flow statements with comparative industry metrics and forward-looking projections.</p>
      <p>The analysis would include technical indicators, institutional ownership patterns, and potential catalysts for share price movement.</p>`;
    
    risks = [
      "Current technical indicators may suggest the stock is approaching resistance levels.",
      "The company's debt structure might pose challenges in a rising interest rate environment.",
      "Forward P/E ratios indicate potential overvaluation compared to expected growth rates."
    ];
    
    advice = "Consider examining options strategies or alternative position sizing if you're looking to establish a position in this security.";
  }
  
  return {
    explanation,
    risks,
    advice
  };
};

/**
 * Helper function to get a company name from a ticker symbol
 */
const getCompanyName = (symbol) => {
  const companyNames = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'NVDA': 'NVIDIA Corporation',
    'JPM': 'JPMorgan Chase & Co.',
    'V': 'Visa Inc.',
    'WMT': 'Walmart Inc.'
  };
  
  return companyNames[symbol] || `${symbol} Corporation`;
}; 