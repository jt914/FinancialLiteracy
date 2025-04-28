const express = require('express');
const auth = require('../middleware/auth');
const RoadmapStep = require('../models/RoadmapStep');
const User = require('../models/User');

const router = express.Router();

// Get roadmap steps
router.get('/', auth, async (req, res) => {
  try {
    const steps = await RoadmapStep.find().sort({ order: 1 });
    res.json(steps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update roadmap progress
router.post('/progress', auth, async (req, res) => {
  try {
    const { stepId, completed } = req.body;
    
    // Validate step ID
    const step = await RoadmapStep.findById(stepId);
    if (!step) {
      return res.status(404).json({ message: 'Step not found' });
    }
    
    let user;
    if (completed) {
      // Add to progress if not already there
      user = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { roadmapProgress: stepId }},
        { new: true }
      ).select('-passwordHash');
    } else {
      // Remove from progress
      user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { roadmapProgress: stepId }},
        { new: true }
      ).select('-passwordHash');
    }
    
    res.json({ roadmapProgress: user.roadmapProgress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 