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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new timecard
router.post('/', auth, async (req, res) => {
  try {
    const { weekStartDate, entries, totalHours } = req.body;

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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a timecard
router.put('/:id', auth, async (req, res) => {
  try {
    const { entries, totalHours, completed } = req.body;

    let timecard = await Timecard.findById(req.params.id);

    if (!timecard) {
      return res.status(404).json({ msg: 'Timecard not found' });
    }

    // Check user
    if (timecard.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    timecard.entries = entries || timecard.entries;
    timecard.totalHours = totalHours || timecard.totalHours;
    timecard.completed = completed !== undefined ? completed : timecard.completed;

    await timecard.save();

    res.json(timecard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a timecard
router.delete('/:id', auth, async (req, res) => {
  try {
    const timecard = await Timecard.findById(req.params.id);

    if (!timecard) {
      return res.status(404).json({ msg: 'Timecard not found' });
    }

    // Make sure user owns the timecard
    if (timecard.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Timecard.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Timecard removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
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
          id: userId,
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
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;