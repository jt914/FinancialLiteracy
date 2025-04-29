const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const tiingoService = require('../services/tiingoService');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Get popular tickers
router.get('/', async (req, res) => {
  try {
    const tickers = await tiingoService.getTopTickers();
    res.json(tickers);
  } catch (error) {
    console.error('Error fetching popular tickers:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch popular tickers',
      message: error.message 
    });
  }
});

// Get user's watchlist
router.get('/watchlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Get data for each ticker in watchlist
    const watchlistData = await Promise.all(
      user.watchlist.map(async (symbol) => {
        try {
          const metadata = await tiingoService.getTickerMetadata(symbol);
          const prices = await tiingoService.getTickerData(symbol);
          
          return {
            symbol,
            name: metadata.name,
            latestPrice: prices[prices.length - 1].close,
            change: prices[prices.length - 1].close - prices[0].close,
            changePercent: ((prices[prices.length - 1].close - prices[0].close) / prices[0].close) * 100
          };
        } catch (error) {
          return { symbol, error: 'Failed to fetch data' };
        }
      })
    );
    
    res.json(watchlistData);
  } catch (error) {
    console.error('Error fetching watchlist:', error.message);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

// Get specific ticker data with optional period
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const period = req.query.period || '1M'; // Default to 1M if no period specified
    
    // Get basic metadata and price data
    const metadata = await tiingoService.getTickerMetadata(symbol);
    const priceData = await tiingoService.getTickerData(symbol, period);
    
    // Calculate price change from first to last data point
    const firstPrice = priceData[0].close;
    const lastPrice = priceData[priceData.length - 1].close;
    const priceChange = lastPrice - firstPrice;
    const priceChangePercent = (priceChange / firstPrice) * 100;
    
    // Format response to match frontend expectations
    // Note: We only include fields that Tiingo API actually provides
    const response = {
      symbol: symbol,
      name: metadata.name || `${symbol}`,
      price: lastPrice,
      priceChange: priceChange,
      priceChangePercent: priceChangePercent,
      prices: priceData,
      description: metadata.description || '',
      stats: {
        // Only include fields that we have
        volume: priceData[priceData.length - 1].volume || null
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error(`Error fetching ticker data for ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch ticker data',
      symbol: req.params.symbol,
      message: error.message
    });
  }
});

// AI explanation of a stock
router.post('/explain', async (req, res) => {
  try {
    const { symbol, preferences } = req.body;
    const userId = req.user?._id; // Get user ID if authenticated
    
    // Get basic data about the ticker for the explanation
    const metadata = await tiingoService.getTickerMetadata(symbol);
    let priceData = await tiingoService.getTickerData(symbol, '1Y');
    
    // Calculate basic metrics
    const currentPrice = priceData[priceData.length - 1].close;
    const yearAgoPrice = priceData[0].close;
    const yearlyChange = ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100;

    // Prepare stock data for the explanation
    const stockData = {
      symbol,
      name: metadata.name || symbol,
      price: currentPrice,
      priceChange: currentPrice - yearAgoPrice,
      priceChangePercent: yearlyChange,
      description: metadata.description || '',
      stats: {
        volume: priceData[priceData.length - 1].volume || 0
      }
    };
    
    // Get user profile data if user is authenticated
    let userData = {
      // Default values if user is not authenticated or has no preferences
      knowledgeLevel: preferences?.experienceLevel || 'beginner',
      riskTolerance: preferences?.riskTolerance || 'moderate',
      financialGoals: []
    };
    
    // If user is authenticated, try to get their profile data
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user && user.profile) {
          userData = {
            knowledgeLevel: user.profile.knowledgeLevel || userData.knowledgeLevel,
            riskTolerance: user.profile.riskTolerance || userData.riskTolerance,
            financialGoals: user.profile.financialGoals || []
          };
        }
      } catch (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Continue with default values
      }
    }
    
    // Merge with any provided preferences (which override profile data)
    if (preferences) {
      if (preferences.experienceLevel) userData.knowledgeLevel = preferences.experienceLevel;
      if (preferences.riskTolerance) userData.riskTolerance = preferences.riskTolerance;
    }
    
    // Generate personalized explanation using Gemini API
    const explanation = await geminiService.generateStockExplanation(stockData, userData);
    
    res.json(explanation);
    
  } catch (error) {
    console.error('Error generating stock explanation:', error);
    res.status(500).json({ 
      error: 'Failed to generate stock explanation',
      message: error.message 
    });
  }
});

// Add ticker to watchlist
router.post('/watchlist', auth, async (req, res) => {
  try {
    const { symbol } = req.body;
    
    // Validate ticker exists
    try {
      await tiingoService.getTickerMetadata(symbol);
    } catch (error) {
      return res.status(404).json({ message: 'Ticker not found' });
    }
    
    // Add to watchlist if not already there
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { watchlist: symbol }},
      { new: true }
    );
    
    res.json({ watchlist: user.watchlist });
  } catch (error) {
    console.error('Error adding to watchlist:', error.message);
    res.status(500).json({ message: 'Failed to add to watchlist' });
  }
});

// Remove ticker from watchlist
router.delete('/watchlist/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Remove from watchlist
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { watchlist: symbol }},
      { new: true }
    );
    
    res.json({ watchlist: user.watchlist });
  } catch (error) {
    console.error('Error removing from watchlist:', error.message);
    res.status(500).json({ message: 'Failed to remove from watchlist' });
  }
});

module.exports = router; 