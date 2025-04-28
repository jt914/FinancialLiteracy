const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      email: req.user.email,
      profile: req.user.profile,
      roadmapProgress: req.user.roadmapProgress,
      watchlist: req.user.watchlist
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.post('/', auth, async (req, res) => {
  try {
    const { name, financialGoals, knowledgeLevel, riskTolerance } = req.body;
    
    // Update profile fields
    const profileFields = {};
    if (name) profileFields.name = name;
    if (financialGoals) profileFields.financialGoals = financialGoals;
    if (knowledgeLevel) profileFields.knowledgeLevel = knowledgeLevel;
    if (riskTolerance) profileFields.riskTolerance = riskTolerance;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profile: profileFields }},
      { new: true }
    ).select('-passwordHash');
    
    res.json({
      id: user._id,
      email: user.email,
      profile: user.profile,
      roadmapProgress: user.roadmapProgress,
      watchlist: user.watchlist
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 