const express = require('express');
const Fine = require('../models/Fine');
const BorrowRecord = require('../models/BorrowRecord');
const mongoose = require('mongoose');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function formatFine(f) {
  const obj = f.toObject ? f.toObject({ virtuals: true }) : f;
  const br = obj.borrow_record_id || {};
  const eq = br.equipment_id || {};
  const usr = obj.user_id || {};
  return {
    id: obj._id || obj.id,
    borrow_record_id: br._id || br.id || obj.borrow_record_id,
    user_id: usr._id || usr.id || obj.user_id,
    amount: obj.amount,
    reason: obj.reason,
    status: obj.status,
    created_at: obj.created_at || obj.createdAt,
    paid_at: obj.paid_at,
    borrow_date: br.borrow_date,
    due_date: br.due_date,
    return_date: br.return_date,
    borrow_type: br.borrow_type,
    equipment_name: eq.name,
    category: eq.category,
    user_name: usr.name,
    user_email: usr.email,
    student_id: usr.student_id,
  };
}

const POPULATE = [
  { path: 'borrow_record_id', select: 'borrow_date due_date return_date borrow_type equipment_id', populate: { path: 'equipment_id', select: 'name category' } },
  { path: 'user_id', select: 'name email student_id' },
];

router.get('/', authenticate, async (req, res) => {
  try {
    const fines = await Fine.find({ user_id: req.user.id }).populate(POPULATE).sort({ created_at: -1 });

    const agg = await Fine.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: {
        _id: null,
        pending_total: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        paid_total: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        pending_count: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      }},
    ]);
    const summary = agg[0] || { pending_total: 0, paid_total: 0, pending_count: 0 };
    res.json({ fines: fines.map(formatFine), summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const fines = await Fine.find(filter).populate(POPULATE).sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));

    const agg = await Fine.aggregate([
      { $group: {
        _id: null,
        pending_total: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
        paid_total: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
        total_count: { $sum: 1 },
      }},
    ]);
    const totals = agg[0] || { pending_total: 0, paid_total: 0, total_count: 0 };
    res.json({ fines: fines.map(formatFine), totals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/pay', authenticate, requireAdmin, async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ error: 'Fine not found' });
    if (fine.status === 'paid') return res.status(409).json({ error: 'Fine already paid' });
    fine.status = 'paid';
    fine.paid_at = new Date();
    await fine.save();
    res.json({ message: 'Fine marked as paid' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/waive', authenticate, requireAdmin, async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ error: 'Fine not found' });
    if (fine.status !== 'pending') return res.status(409).json({ error: 'Only pending fines can be waived' });
    fine.status = 'waived';
    fine.paid_at = new Date();
    await fine.save();
    res.json({ message: 'Fine waived' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
