const express = require('express');
const auth = require('../middleware/auth');
const Account = require('../models/Account');

const router = express.Router();

// Get all accounts for a user
router.get('/', auth, async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.user._id });
    res.json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new account
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, reviewDate } = req.body;
    
    const newAccount = new Account({
      user: req.user._id,
      name,
      type,
      reviewDate: reviewDate || undefined
    });
    
    await newAccount.save();
    res.status(201).json(newAccount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an account
router.delete('/:id', auth, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    
    // Check if account exists
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    // Check if user owns the account
    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await account.remove();
    res.json({ message: 'Account removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 