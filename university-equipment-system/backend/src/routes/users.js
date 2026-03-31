const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const BorrowRecord = require('../models/BorrowRecord');
const Fine = require('../models/Fine');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { email: re }, { student_id: re }];
    }
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password_hash')
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [activeBorrows, pendingFines] = await Promise.all([
      BorrowRecord.countDocuments({ user_id: req.params.id, status: { $in: ['borrowing', 'long_term_allocation'] } }),
      Fine.aggregate([{ $match: { user_id: user._id, status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({ ...user.toJSON(), active_borrows: activeBorrows, pending_fines: pendingFines[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, role, student_id, department, phone, is_active, password } = req.body;

    if (email && email.toLowerCase() !== user.email) {
      const dup = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
      if (dup) return res.status(409).json({ error: 'Email already in use' });
      user.email = email.toLowerCase();
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (student_id !== undefined) user.student_id = student_id;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (is_active !== undefined) user.is_active = is_active;
    if (password && password.length >= 6) user.password_hash = bcrypt.hashSync(password, 10);

    await user.save();
    const updated = user.toJSON();
    delete updated.password_hash;
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot deactivate your own account' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.is_active = false;
    await user.save();
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
