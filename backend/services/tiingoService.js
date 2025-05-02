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
  
  // Determine appropriate sampling frequency and endpoint based on period
  let apiUrl = `/tiingo/daily/${symbol}/prices`;
  let resampleFreq;
  let params = { // Default params for daily endpoint
    startDate: formattedStartDate,
    endDate: today,
  };

  // Simplified Resampling Logic for Reliability
  switch (period) {
    case '1D':
      // For 1D, use IEX intraday data with hourly frequency
      apiUrl = `/iex/${symbol}/prices`;
      params = {
        resampleFreq: '5min' // Standard hourly intraday
      };
      break;
    case '1W':
    case '1M':
    case '3M':
      // For up to 3M, daily data is most reliable
      resampleFreq = 'daily';
      break;
    case '1Y':
    case '5Y':
      // For 1Y and 5Y, weekly data is a reliable compromise
      resampleFreq = 'weekly';
      break;
    default:
      // Default to daily for any unexpected period
      resampleFreq = 'daily';
      // Ensure default start/end dates are set if we fall here
      params.startDate = formattedStartDate; 
      params.endDate = today;
  }

  // Add resampleFreq to params if using the daily endpoint
  if (apiUrl.includes('/tiingo/daily/')) {
    params.resampleFreq = resampleFreq;
  }

  // console.log(`Fetching Tiingo data for ${symbol}. Period: ${period}, URL: ${apiUrl}, Params:`, params);

  const response = await tiingoClient.get(apiUrl, { params });
  
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