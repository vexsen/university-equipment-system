const express = require('express');
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const BorrowRecord = require('../models/BorrowRecord');
const Fine = require('../models/Fine');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/admin', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [allEquip, borrowStats, fineAgg, userStats, overdueList, pendingCount, categoryBreakdown, recentActivity] = await Promise.all([
      Equipment.find({ is_active: true }),
      BorrowRecord.aggregate([
        { $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          active: { $sum: { $cond: [{ $eq: ['$status', 'borrowing'] }, 1, 0] } },
          long_term_active: { $sum: { $cond: [{ $eq: ['$status', 'long_term_allocation'] }, 1, 0] } },
          returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'borrowing'] }, { $lt: ['$due_date', today] }] }, 1, 0] } },
        }},
      ]),
      Fine.aggregate([
        { $group: {
          _id: null,
          pending_total: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
          paid_total: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] } },
          grand_total: { $sum: '$amount' },
          pending_count: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        }},
      ]),
      Promise.all([
        User.countDocuments({ role: { $ne: 'admin' }, is_active: true }),
        User.countDocuments({ role: 'student', is_active: true }),
        User.countDocuments({ role: 'staff', is_active: true }),
      ]),
      BorrowRecord.countDocuments({ status: 'pending' }),
      Equipment.aggregate([
        { $match: { is_active: true } },
        { $group: { _id: '$category', equipment_count: { $sum: 1 }, total_units: { $sum: '$total_quantity' }, borrowed_units: { $sum: { $subtract: ['$total_quantity', '$available_quantity'] } } } },
        { $sort: { total_units: -1 } }, { $limit: 8 },
        { $project: { category: '$_id', equipment_count: 1, total_units: 1, borrowed_units: 1, _id: 0 } },
      ]),
      BorrowRecord.aggregate([
        { $match: { status: 'borrowing', due_date: { $lt: today } } },
        { $lookup: { from: 'equipment', localField: 'equipment_id', foreignField: '_id', as: 'equip' } },
        { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'usr' } },
        { $unwind: '$equip' }, { $unwind: '$usr' },
        { $project: { id: '$_id', due_date: 1, quantity: 1, equipment_name: '$equip.name', fine_rate_per_day: '$equip.fine_rate_per_day', user_name: '$usr.name', user_email: '$usr.email', student_id: '$usr.student_id' } },
        { $sort: { due_date: 1 } }, { $limit: 10 },
      ]),
      BorrowRecord.aggregate([
        { $match: { created_at: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    const eqStats = allEquip.reduce((a, e) => {
      a.total++; a.total_units += e.total_quantity; a.available_units += e.available_quantity;
      if (e.borrow_type === 'short_term') a.short_term_count++; else a.long_term_count++;
      return a;
    }, { total: 0, short_term_count: 0, long_term_count: 0, total_units: 0, available_units: 0 });

    const bs = borrowStats[0] || { total: 0, pending: 0, active: 0, long_term_active: 0, returned: 0, lost: 0, overdue: 0 };
    const fs = fineAgg[0] || { pending_total: 0, paid_total: 0, grand_total: 0, pending_count: 0 };

    res.json({
      equipment: eqStats,
      borrows: bs,
      fines: fs,
      users: { total: userStats[0], students: userStats[1], staff: userStats[2] },
      overdue_list: overdueList,
      pending_approvals: pendingCount,
      category_breakdown: categoryBreakdown,
      recent_activity: recentActivity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/user', authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const uid = new mongoose.Types.ObjectId(req.user.id);

    const [statsAgg, dueSoon, overdueItems, fineAgg, longTermItems] = await Promise.all([
      BorrowRecord.aggregate([
        { $match: { user_id: uid } },
        { $group: {
          _id: null,
          total_requests: { $sum: 1 },
          active_borrows: { $sum: { $cond: [{ $eq: ['$status', 'borrowing'] }, 1, 0] } },
          long_term_allocations: { $sum: { $cond: [{ $eq: ['$status', 'long_term_allocation'] }, 1, 0] } },
          returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          overdue_count: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'borrowing'] }, { $lt: ['$due_date', today] }] }, 1, 0] } },
        }},
      ]),
      BorrowRecord.find({ user_id: uid, status: 'borrowing', due_date: { $gte: today, $lte: threeDaysLater } })
        .populate('equipment_id', 'name fine_rate_per_day').sort({ due_date: 1 }),
      BorrowRecord.find({ user_id: uid, status: 'borrowing', due_date: { $lt: today } })
        .populate('equipment_id', 'name fine_rate_per_day').sort({ due_date: 1 }),
      Fine.aggregate([
        { $match: { user_id: uid, status: 'pending' } },
        { $group: { _id: null, pending_total: { $sum: '$amount' } } },
      ]),
      BorrowRecord.find({ user_id: uid, status: 'long_term_allocation' })
        .populate('equipment_id', 'name category location').sort({ borrow_date: -1 }),
    ]);

    const myStats = statsAgg[0] || { total_requests: 0, active_borrows: 0, long_term_allocations: 0, returned: 0, pending: 0, overdue_count: 0 };

    const todayDate = new Date(today);
    res.json({
      stats: myStats,
      due_soon: dueSoon.map(b => ({
        id: b._id, due_date: b.due_date, quantity: b.quantity,
        equipment_name: b.equipment_id?.name, fine_rate_per_day: b.equipment_id?.fine_rate_per_day,
        days_remaining: Math.ceil((new Date(b.due_date) - todayDate) / 86400000),
      })),
      overdue_items: overdueItems.map(b => ({
        id: b._id, due_date: b.due_date, quantity: b.quantity,
        equipment_name: b.equipment_id?.name, fine_rate_per_day: b.equipment_id?.fine_rate_per_day,
        days_overdue: Math.ceil((todayDate - new Date(b.due_date)) / 86400000),
      })),
      fine_balance: fineAgg[0]?.pending_total || 0,
      long_term_allocations: longTermItems.map(b => ({
        id: b._id, borrow_date: b.borrow_date, quantity: b.quantity,
        equipment_name: b.equipment_id?.name, category: b.equipment_id?.category, location: b.equipment_id?.location,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
