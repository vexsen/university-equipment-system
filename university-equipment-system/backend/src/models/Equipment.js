const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  category: { type: String, required: true },
  serial_number: { type: String, default: null },
  value: { type: Number, default: 0 },
  borrow_type: { type: String, enum: ['short_term', 'long_term'], required: true, default: 'short_term' },
  total_quantity: { type: Number, default: 1 },
  available_quantity: { type: Number, default: 1 },
  location: { type: String, default: null },
  condition: { type: String, default: 'good' },
  fine_rate_per_day: { type: Number, default: 10 },
  image_url: { type: String, default: null },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

schema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => { delete ret._id; delete ret.__v; return ret; }
});
schema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('Equipment', schema);
