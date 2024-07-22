// backend/models/Timecard.js
// backend/models/Timecard.js
const mongoose = require('mongoose');

const TimecardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: Date, required: true },
  entries: [{
    day: { type: String, required: true },
    jobName: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    description: { type: String }
  }],
  totalHours: { type: Number, required: true },
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Timecard', TimecardSchema);
