const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const tiingoService = require('../services/tiingoService');

const router = express.Router();

// Get popular tickers
router.get('/', async (req, res) => {
  try {
    const tickers = await tiingoService.getTopTickers();
    res.json(tickers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
            change: prices[prices.length - 1].close - prices[prices.length - 2].close,
            changePercent: ((prices[prices.length - 1].close - prices[prices.length - 2].close) / prices[prices.length - 2].close) * 100
          };
        } catch (error) {
          return { symbol, error: 'Failed to fetch data' };
        }
      })
    );
    
    res.json(watchlistData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific ticker data
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const metadata = await tiingoService.getTickerMetadata(symbol);
    const priceData = await tiingoService.getTickerData(symbol);
    
    res.json({
      symbol,
      metadata,
      priceData
    });
  } catch (error) {
    console.error(error);
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Ticker not found' });
    }
    res.status(500).json({ message: 'Server error' });
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 