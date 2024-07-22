// backend/models/User.js
// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false },
  isManager: { type: Boolean, default: false },
  notes: { type: String },
});

module.exports = mongoose.model('User', UserSchema);
