const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/university_equipment';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected:', MONGO_URI))
  .catch(err => { console.error('MongoDB connection error:', err.message); process.exit(1); });

module.exports = mongoose;
