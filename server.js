// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

//app.use(cors());
app.use(cors({
  origin: 'https://tcfront.onrender.com'
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Import routes
const authRoutes = require('./routes/auth');
const timecardRoutes = require('./routes/timecard');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/timecard', timecardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
