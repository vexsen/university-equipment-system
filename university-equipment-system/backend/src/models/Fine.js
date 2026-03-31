const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  borrow_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRecord', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'pending' },
  paid_at: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

schema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => { delete ret._id; delete ret.__v; return ret; }
});
schema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('Fine', schema);
