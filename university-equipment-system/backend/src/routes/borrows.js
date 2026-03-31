const express = require('express');
const BorrowRecord = require('../models/BorrowRecord');
const Equipment = require('../models/Equipment');
const Fine = require('../models/Fine');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function computeOverdue(b) {
  if (b.status === 'borrowing' && b.due_date) {
    const today = new Date().toISOString().split('T')[0];
    if (b.due_date < today) {
      b.status = 'overdue';
      const msPerDay = 86400000;
      const daysOverdue = Math.ceil((new Date(today) - new Date(b.due_date)) / msPerDay);
      b.days_overdue = daysOverdue;
      b.current_fine = daysOverdue * (b.fine_rate_per_day || 10);
    }
  }
  return b;
}

function formatBorrow(doc) {
  const b = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
  const eq = b.equipment_id || {};
  const usr = b.user_id || {};
  const appr = b.approved_by || {};
  return computeOverdue({
    id: b._id || b.id,
    user_id: usr._id || usr.id || b.user_id,
    equipment_id: eq._id || eq.id || b.equipment_id,
    borrow_type: b.borrow_type,
    status: b.status,
    quantity: b.quantity,
    borrow_date: b.borrow_date,
    due_date: b.due_date,
    return_date: b.return_date,
    purpose: b.purpose,
    admin_notes: b.admin_notes,
    fine_amount: b.fine_amount,
    approved_by: appr._id || appr.id || b.approved_by,
    approved_at: b.approved_at,
    created_at: b.created_at || b.createdAt,
    equipment_name: eq.name,
    category: eq.category,
    equipment_borrow_type: eq.borrow_type,
    equipment_value: eq.value,
    fine_rate_per_day: eq.fine_rate_per_day,
    user_name: usr.name,
    user_email: usr.email,
    student_id: usr.student_id,
    department: usr.department,
    approved_by_name: appr.name || null,
  });
}

const POPULATE = [
  { path: 'equipment_id', select: 'name category borrow_type value fine_rate_per_day' },
  { path: 'user_id', select: 'name email student_id department' },
  { path: 'approved_by', select: 'name' },
];

// User: get own borrows
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { user_id: req.user.id };
    if (status) filter.status = status;
    const borrows = await BorrowRecord.find(filter)
      .populate(POPULATE)
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json(borrows.map(formatBorrow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all borrows
router.get('/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, user_id, equipment_id, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (user_id) filter.user_id = user_id;
    if (equipment_id) filter.equipment_id = equipment_id;
    const borrows = await BorrowRecord.find(filter)
      .populate(POPULATE)
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json(borrows.map(formatBorrow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single borrow
router.get('/:id', authenticate, async (req, res) => {
  try {
    const borrow = await BorrowRecord.findById(req.params.id).populate(POPULATE);
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });
    if (req.user.role !== 'admin' && borrow.user_id._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(formatBorrow(borrow));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create borrow request
router.post('/', authenticate, async (req, res) => {
  try {
    const { equipment_id, quantity = 1, due_date, purpose } = req.body;
    if (!equipment_id) return res.status(400).json({ error: 'Equipment ID is required' });

    const equip = await Equipment.findOne({ _id: equipment_id, is_active: true });
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });

    const qty = parseInt(quantity);
    if (equip.available_quantity < qty) return res.status(409).json({ error: `Only ${equip.available_quantity} unit(s) available` });
    if (equip.borrow_type === 'short_term' && !due_date) return res.status(400).json({ error: 'Due date is required for short-term borrowing' });
    if (equip.borrow_type === 'short_term' && due_date) {
      const today = new Date().toISOString().split('T')[0];
      if (due_date <= today) return res.status(400).json({ error: 'Due date must be in the future' });
    }

    const existing = await BorrowRecord.findOne({
      user_id: req.user.id,
      equipment_id,
      status: { $in: ['pending', 'approved', 'borrowing', 'long_term_allocation'] },
    });
    if (existing) return res.status(409).json({ error: 'You already have an active borrow request for this equipment' });

    const borrow = await BorrowRecord.create({
      user_id: req.user.id,
      equipment_id,
      borrow_type: equip.borrow_type,
      status: 'pending',
      quantity: qty,
      due_date: equip.borrow_type === 'short_term' ? due_date : null,
      purpose: purpose || null,
    });
    res.status(201).json(borrow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: approve
router.put('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const borrow = await BorrowRecord.findById(req.params.id);
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });
    if (borrow.status !== 'pending') return res.status(409).json({ error: 'Only pending requests can be approved' });

    const equip = await Equipment.findById(borrow.equipment_id);
    if (equip.available_quantity < borrow.quantity) return res.status(409).json({ error: 'Not enough equipment available' });

    const today = new Date().toISOString().split('T')[0];
    const newStatus = borrow.borrow_type === 'long_term' ? 'long_term_allocation' : 'borrowing';
    const { admin_notes, due_date } = req.body;
    const finalDueDate = borrow.borrow_type === 'short_term' ? (due_date || borrow.due_date) : null;

    borrow.status = newStatus;
    borrow.borrow_date = today;
    borrow.due_date = finalDueDate;
    borrow.approved_by = req.user.id;
    borrow.approved_at = new Date();
    borrow.admin_notes = admin_notes || null;
    await borrow.save();

    equip.available_quantity -= borrow.quantity;
    await equip.save();

    res.json({ message: 'Borrow request approved', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: reject
router.put('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const borrow = await BorrowRecord.findById(req.params.id);
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });
    if (borrow.status !== 'pending') return res.status(409).json({ error: 'Only pending requests can be rejected' });

    borrow.status = 'rejected';
    borrow.admin_notes = req.body.admin_notes || null;
    await borrow.save();
    res.json({ message: 'Borrow request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: return
router.put('/:id/return', authenticate, requireAdmin, async (req, res) => {
  try {
    const borrow = await BorrowRecord.findById(req.params.id).populate('equipment_id', 'fine_rate_per_day value');
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });

    const today = new Date().toISOString().split('T')[0];
    const enriched = computeOverdue({ ...borrow.toObject(), fine_rate_per_day: borrow.equipment_id?.fine_rate_per_day });
    if (!['borrowing', 'overdue'].includes(borrow.status) && enriched.status !== 'overdue') {
      return res.status(409).json({ error: 'Only active borrows can be returned' });
    }

    let fineAmount = 0;
    if (borrow.borrow_type === 'short_term' && borrow.due_date && today > borrow.due_date) {
      const msPerDay = 86400000;
      const daysOverdue = Math.ceil((new Date(today) - new Date(borrow.due_date)) / msPerDay);
      fineAmount = daysOverdue * (borrow.equipment_id?.fine_rate_per_day || 10);
    }

    borrow.status = 'returned';
    borrow.return_date = today;
    borrow.fine_amount = fineAmount;
    await borrow.save();

    const equip = await Equipment.findById(borrow.equipment_id._id || borrow.equipment_id);
    equip.available_quantity += borrow.quantity;
    await equip.save();

    if (fineAmount > 0) {
      await Fine.create({ borrow_record_id: borrow._id, user_id: borrow.user_id, amount: fineAmount, reason: 'overdue' });
    }

    res.json({ message: 'Equipment returned', fine_amount: fineAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: mark lost
router.put('/:id/mark-lost', authenticate, requireAdmin, async (req, res) => {
  try {
    const borrow = await BorrowRecord.findById(req.params.id).populate('equipment_id', 'value');
    if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });

    const enriched = computeOverdue({ ...borrow.toObject() });
    if (!['borrowing', 'long_term_allocation', 'overdue'].includes(borrow.status) && enriched.status !== 'overdue') {
      return res.status(409).json({ error: 'Only active borrows can be marked as lost' });
    }

    const fineAmount = borrow.equipment_id?.value || 0;
    borrow.status = 'lost';
    borrow.fine_amount = fineAmount;
    await borrow.save();

    if (fineAmount > 0) {
      await Fine.create({ borrow_record_id: borrow._id, user_id: borrow.user_id, amount: fineAmount, reason: 'lost' });
    }

    res.json({ message: 'Equipment marked as lost', fine_amount: fineAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
