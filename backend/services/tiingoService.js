const axios = require('axios');

// API configuration
const TIINGO_API_KEY = process.env.TIINGO_API_KEY || '1e396feca3d4c9c41a2fc3f92efc98188622c2d8';
const TIINGO_API_BASE_URL = 'https://api.tiingo.com';

const tiingoClient = axios.create({
  baseURL: TIINGO_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${TIINGO_API_KEY}`
  }
});

/**
 * Fetch ticker data for a specific symbol with a specified time period
 * @param {string} symbol - The ticker symbol
 * @param {string} period - Time period ('1D', '1W', '1M', '3M', '1Y', '5Y')
 */
const getTickerData = async (symbol, period = '1M') => {
  // Calculate start date based on period
  let startDate;
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  switch(period) {
    case '1D':
      // Get yesterday's date
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '1W':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3M':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '1Y':
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '5Y':
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    default:
      // Default to 1M
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
  }
  
  // Format startDate as YYYY-MM-DD
  const formattedStartDate = startDate.toISOString().split('T')[0];
  
  // Determine appropriate sampling frequency based on period
  let resampleFreq = 'daily';
  if (period === '5Y') {
    resampleFreq = 'weekly';
  } else if (period === '1D') {
    resampleFreq = 'hourly';
  }
  
  const response = await tiingoClient.get(`/tiingo/daily/${symbol}/prices`, {
    params: {
      startDate: formattedStartDate,
      endDate: today,
      resampleFreq: resampleFreq
    }
  });
  
  // Ensure we have data
  if (!response.data || response.data.length === 0) {
    throw new Error(`No price data available for ${symbol} for period ${period}`);
  }
  
  return response.data;
};

/**
 * Fetch ticker metadata for a specific symbol
 */
const getTickerMetadata = async (symbol) => {
  const response = await tiingoClient.get(`/tiingo/daily/${symbol}`);
  return response.data;
};

/**
 * Fetch top tickers data
 */
const getTopTickers = async () => {
  // Define popular tickers
  const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX'];
  
  const promises = popularTickers.map(async (ticker) => {
    try {
      const metadata = await getTickerMetadata(ticker);
      const prices = await getTickerData(ticker, '1M');
      
      return {
        symbol: ticker,
        name: metadata.name || ticker,
        latestPrice: prices[prices.length - 1].close,
        change: prices[prices.length - 1].close - prices[0].close,
        changePercent: ((prices[prices.length - 1].close - prices[0].close) / prices[0].close) * 100,
        volume: prices[prices.length - 1].volume
      };
    } catch (error) {
      console.error(`Error processing ticker ${ticker}:`, error.message);
      throw error;
    }
  });
  
  return Promise.all(promises);
};

module.exports = {
  getTickerData,
  getTickerMetadata,
  getTopTickers
}; 