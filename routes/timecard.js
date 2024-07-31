const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Timecard = require('../models/Timecard');
const User = require('../models/User');

// Get all timecards for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const timecards = await Timecard.find({ user: req.user.id }).sort({ weekStartDate: -1 });
    res.json(timecards);
  } catch (err) {
    console.error('Error fetching timecards:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Create a new timecard
router.post('/', auth, async (req, res) => {
  try {
    const { weekStartDate, entries, totalHours } = req.body;

    // Validate input
    if (!weekStartDate || !Array.isArray(entries) || typeof totalHours !== 'number') {
      return res.status(400).json({ msg: 'Invalid input data' });
    }

    const newTimecard = new Timecard({
      user: req.user.id,
      weekStartDate,
      entries,
      totalHours,
      completed: false
    });

    const timecard = await newTimecard.save();
    res.json(timecard);
  } catch (err) {
    console.error('Error creating timecard:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update a timecard
router.put('/:id', auth, async (req, res) => {
  try {
    console.log('Updating timecard:', req.params.id);
    console.log('Received data:', req.body);

    const { entries, totalHours, completed } = req.body;
    let timecard = await Timecard.findById(req.params.id);
    
    if (!timecard) {
      return res.status(404).json({ msg: 'Timecard not found' });
    }
    
    // Check user (allow managers to edit)
    const user = await User.findById(req.user.id);
    if (timecard.user.toString() !== req.user.id && !user.isManager) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Data validation
    if (entries && !Array.isArray(entries)) {
      return res.status(400).json({ msg: 'Invalid entries format' });
    }
    if (totalHours !== undefined && typeof totalHours !== 'number') {
      return res.status(400).json({ msg: 'Invalid totalHours format' });
    }
    
    // Update fields
    if (entries) timecard.entries = entries;
    if (totalHours !== undefined) timecard.totalHours = totalHours;
    if (completed !== undefined) timecard.completed = completed;
    
    await timecard.save();
    res.json(timecard);
  } catch (err) {
    console.error('Error updating timecard:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete a timecard
router.delete('/:id', auth, async (req, res) => {
  try {
    const timecard = await Timecard.findById(req.params.id);

    if (!timecard) {
      return res.status(404).json({ msg: 'Timecard not found' });
    }

    // Check user (allow managers to delete)
    const user = await User.findById(req.user.id);
    if (timecard.user.toString() !== req.user.id && !user.isManager) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Timecard.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Timecard removed' });
  } catch (err) {
    console.error('Error deleting timecard:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get all timecards (for managers)
router.get('/all', auth, async (req, res) => {
  try {
    // Check if user is a manager
    const user = await User.findById(req.user.id);
    if (!user.isManager) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const timecards = await Timecard.find().populate('user', ['name', 'email']).sort({ 'user': 1, 'weekStartDate': -1 });
    
    // Group timecards by user
    const groupedTimecards = timecards.reduce((acc, timecard) => {
      const userId = timecard.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          _id: userId,
          name: timecard.user.name,
          email: timecard.user.email,
          timecards: []
        };
      }
      acc[userId].timecards.push(timecard);
      return acc;
    }, {});

    res.json(Object.values(groupedTimecards));
  } catch (err) {
    console.error('Error fetching all timecards:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.get('/check-current-week', auth, async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)));
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const existingTimecard = await Timecard.findOne({
      user: req.user.id,
      weekStartDate: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });

    res.json({ exists: !!existingTimecard });
  } catch (err) {
    console.error('Error checking current week timecard:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

router.put('/:id/complete', auth, async (req, res) => {
  try {
    const timecard = await Timecard.findById(req.params.id);

    if (!timecard) {
      return res.status(404).json({ msg: 'Timecard not found' });
    }

    // Check if the user owns this timecard or is a manager
    const user = await User.findById(req.user.id);
    if (timecard.user.toString() !== req.user.id && !user.isManager) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    timecard.completed = true;
    await timecard.save();

    res.json(timecard);
  } catch (err) {
    console.error('Error completing timecard:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;