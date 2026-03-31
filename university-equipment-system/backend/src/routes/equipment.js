const express = require('express');
const Equipment = require('../models/Equipment');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { search, category, borrow_type, page = 1, limit = 20 } = req.query;
    const filter = { is_active: true };
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { description: re }, { category: re }, { serial_number: re }];
    }
    if (category) filter.category = category;
    if (borrow_type) filter.borrow_type = borrow_type;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [equipment, total] = await Promise.all([
      Equipment.find(filter).sort({ name: 1 }).skip(offset).limit(parseInt(limit)),
      Equipment.countDocuments(filter),
    ]);
    res.json({ equipment, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', authenticate, async (req, res) => {
  try {
    const cats = await Equipment.distinct('category', { is_active: true });
    res.json(cats.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const equip = await Equipment.findOne({ _id: req.params.id, is_active: true });
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });
    res.json(equip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, serial_number, value, borrow_type, total_quantity, location, condition, fine_rate_per_day, image_url } = req.body;
    if (!name || !category || !borrow_type) return res.status(400).json({ error: 'Name, category, and borrow type are required' });
    if (!['short_term', 'long_term'].includes(borrow_type)) return res.status(400).json({ error: 'Borrow type must be short_term or long_term' });

    const qty = parseInt(total_quantity) || 1;
    const rate = borrow_type === 'long_term' ? 0 : (parseFloat(fine_rate_per_day) || 10);

    const equip = await Equipment.create({
      name, description, category, serial_number, value: parseFloat(value) || 0,
      borrow_type, total_quantity: qty, available_quantity: qty,
      location, condition: condition || 'good', fine_rate_per_day: rate, image_url: image_url || null,
    });
    res.status(201).json(equip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const equip = await Equipment.findOne({ _id: req.params.id, is_active: true });
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });

    const { name, description, category, serial_number, value, location, condition, fine_rate_per_day, total_quantity, image_url } = req.body;

    const newTotal = parseInt(total_quantity) || equip.total_quantity;
    const diff = newTotal - equip.total_quantity;
    const newAvailable = Math.max(0, equip.available_quantity + diff);

    Object.assign(equip, {
      name: name || equip.name,
      description: description !== undefined ? description : equip.description,
      category: category || equip.category,
      serial_number: serial_number !== undefined ? serial_number : equip.serial_number,
      value: parseFloat(value) || equip.value,
      location: location !== undefined ? location : equip.location,
      condition: condition || equip.condition,
      fine_rate_per_day: equip.borrow_type === 'long_term' ? 0 : (parseFloat(fine_rate_per_day) || equip.fine_rate_per_day),
      total_quantity: newTotal,
      available_quantity: newAvailable,
      image_url: image_url !== undefined ? image_url : equip.image_url,
    });
    await equip.save();
    res.json(equip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const equip = await Equipment.findOne({ _id: req.params.id, is_active: true });
    if (!equip) return res.status(404).json({ error: 'Equipment not found' });

    const BorrowRecord = require('../models/BorrowRecord');
    const activeBorrows = await BorrowRecord.countDocuments({
      equipment_id: req.params.id,
      status: { $in: ['pending', 'approved', 'borrowing', 'long_term_allocation'] },
    });
    if (activeBorrows > 0) return res.status(409).json({ error: 'Cannot delete equipment with active borrow records' });

    equip.is_active = false;
    await equip.save();
    res.json({ message: 'Equipment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
