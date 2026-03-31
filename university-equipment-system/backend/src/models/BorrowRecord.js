const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  equipment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  borrow_type: { type: String, enum: ['short_term', 'long_term'], required: true },
  status: { type: String, default: 'pending' },
  quantity: { type: Number, default: 1 },
  borrow_date: { type: String, default: null },
  due_date: { type: String, default: null },
  return_date: { type: String, default: null },
  purpose: { type: String, default: null },
  admin_notes: { type: String, default: null },
  fine_amount: { type: Number, default: 0 },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approved_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

schema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => { delete ret._id; delete ret.__v; return ret; }
});
schema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('BorrowRecord', schema);
