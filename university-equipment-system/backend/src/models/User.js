const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['student', 'staff', 'admin'], default: 'student' },
  student_id: { type: String, default: null, unique: true, sparse: true },
  department: { type: String, default: null },
  phone: { type: String, default: null },
  is_active: { type: Boolean, default: true },
  otp_code: { type: String, default: null },
  otp_expires: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

schema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => { delete ret._id; delete ret.__v; return ret; }
});
schema.virtual('id').get(function () { return this._id.toHexString(); });

module.exports = mongoose.model('User', schema);
