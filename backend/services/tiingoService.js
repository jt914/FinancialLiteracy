const axios = require('axios');

const TIINGO_API_KEY = '1e396feca3d4c9c41a2fc3f92efc98188622c2d8';
const TIINGO_API_BASE_URL = 'https://api.tiingo.com';

const tiingoClient = axios.create({
  baseURL: TIINGO_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${TIINGO_API_KEY}`
  }
});

/**
 * Fetch ticker data for a specific symbol
 */
const getTickerData = async (symbol) => {
  try {
    const response = await tiingoClient.get(`/tiingo/daily/${symbol}/prices`, {
      params: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        endDate: new Date().toISOString().split('T')[0], // today
        resampleFreq: 'daily'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    throw error;
  }
};

/**
 * Fetch ticker metadata for a specific symbol
 */
const getTickerMetadata = async (symbol) => {
  try {
    const response = await tiingoClient.get(`/tiingo/daily/${symbol}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ticker metadata:', error);
    throw error;
  }
};

/**
 * Fetch top tickers data
 */
const getTopTickers = async () => {
  // Define popular tickers
  const popularTickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NFLX'];
  
  try {
    const promises = popularTickers.map(async (ticker) => {
      const metadata = await getTickerMetadata(ticker);
      const prices = await getTickerData(ticker);
      return {
        symbol: ticker,
        name: metadata.name,
        latestPrice: prices[prices.length - 1].close,
        change: prices[prices.length - 1].close - prices[prices.length - 2].close,
        changePercent: ((prices[prices.length - 1].close - prices[prices.length - 2].close) / prices[prices.length - 2].close) * 100,
        volume: prices[prices.length - 1].volume
      };
    });
    
    return Promise.all(promises);
  } catch (error) {
    console.error('Error fetching top tickers:', error);
    throw error;
  }
};

module.exports = {
  getTickerData,
  getTickerMetadata,
  getTopTickers
}; 