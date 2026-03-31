const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const BorrowRecord = require('../models/BorrowRecord');
const Fine = require('../models/Fine');

async function seedDatabase() {
  // Admin
  const adminExists = await User.findOne({ email: 'admin@university.edu' });
  if (!adminExists) {
    await User.create({
      name: 'System Administrator',
      email: 'admin@university.edu',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      department: 'IT Department',
    });
    console.log('Admin seeded');
  }

  // Demo student
  const studentExists = await User.findOne({ email: 'student@university.edu' });
  if (!studentExists) {
    await User.create({
      name: 'Jane Smith',
      email: 'student@university.edu',
      password_hash: bcrypt.hashSync('student123', 10),
      role: 'student',
      student_id: 'STU2024001',
      department: 'Computer Science',
    });
    console.log('Student seeded');
  }

  // Equipment
  const count = await Equipment.countDocuments();
  if (count === 0) {
    await Equipment.insertMany([
      { name: 'MacBook Pro 16"', description: 'Apple M3 Pro laptop, 18GB RAM, 512GB SSD', category: 'Laptop', serial_number: 'MBP-2024-001', value: 2499, borrow_type: 'short_term', total_quantity: 5, available_quantity: 5, location: 'Library Room 201', condition: 'good', fine_rate_per_day: 20, image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Dell UltraSharp 27" Monitor', description: '4K UHD USB-C monitor', category: 'Monitor', serial_number: 'DELL-MON-001', value: 450, borrow_type: 'short_term', total_quantity: 10, available_quantity: 10, location: 'IT Storage Room B', condition: 'good', fine_rate_per_day: 10, image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Canon EOS R6 Camera', description: 'Full-frame mirrorless camera for media production', category: 'Camera', serial_number: 'CANON-R6-001', value: 2500, borrow_type: 'short_term', total_quantity: 3, available_quantity: 3, location: 'Media Lab', condition: 'good', fine_rate_per_day: 25, image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Casio FX-991EX Calculator', description: 'Advanced scientific calculator', category: 'Calculator', serial_number: 'CALC-FX-001', value: 25, borrow_type: 'short_term', total_quantity: 30, available_quantity: 30, location: 'Math Department Store', condition: 'good', fine_rate_per_day: 3, image_url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Safety Goggles (ANSI Z87)', description: 'Chemical splash resistant safety eyewear', category: 'Safety Equipment', serial_number: 'GOGGLE-001', value: 12, borrow_type: 'short_term', total_quantity: 60, available_quantity: 60, location: 'Chemistry Lab Store', condition: 'good', fine_rate_per_day: 2, image_url: 'https://images.unsplash.com/photo-1576319155264-99536e0be1ee?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Tektronix Oscilloscope', description: '4-channel 200MHz digital oscilloscope', category: 'Lab Equipment', serial_number: 'OSC-TEK-001', value: 3200, borrow_type: 'short_term', total_quantity: 4, available_quantity: 4, location: 'Electronics Lab', condition: 'good', fine_rate_per_day: 30, image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Epson Projector EB-2247U', description: 'WUXGA laser projector for presentations', category: 'AV Equipment', serial_number: 'PROJ-EP-001', value: 900, borrow_type: 'short_term', total_quantity: 6, available_quantity: 6, location: 'AV Equipment Room', condition: 'good', fine_rate_per_day: 15, image_url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'HP LaserJet Pro Printer', description: 'Monochrome laser printer for office use', category: 'Printer', serial_number: 'HP-LJ-001', value: 350, borrow_type: 'short_term', total_quantity: 5, available_quantity: 5, location: 'Print Center', condition: 'good', fine_rate_per_day: 10, image_url: 'https://images.unsplash.com/photo-1612815291523-0d87d8bbb498?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Lenovo ThinkPad (Staff)', description: 'Staff-allocated laptop, Intel i7, 16GB RAM', category: 'Laptop', serial_number: 'THINK-STF-001', value: 1400, borrow_type: 'long_term', total_quantity: 25, available_quantity: 25, location: 'IT Storage Room A', condition: 'good', fine_rate_per_day: 0, image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Ergonomic Office Chair', description: 'Herman Miller Aeron chair for staff offices', category: 'Furniture', serial_number: 'CHAIR-HM-001', value: 1500, borrow_type: 'long_term', total_quantity: 40, available_quantity: 40, location: 'Facilities Warehouse', condition: 'good', fine_rate_per_day: 0, image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Desktop Workstation (Admin)', description: 'Dell OptiPlex for administrative departments', category: 'Computer', serial_number: 'DELL-DT-001', value: 1100, borrow_type: 'long_term', total_quantity: 15, available_quantity: 15, location: 'Admin IT Store', condition: 'good', fine_rate_per_day: 0, image_url: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&h=300&fit=crop&q=80&auto=format' },
      { name: 'Network Switch (24-port)', description: 'Cisco managed gigabit switch', category: 'Networking', serial_number: 'CISCO-SW-001', value: 800, borrow_type: 'long_term', total_quantity: 10, available_quantity: 10, location: 'Server Room', condition: 'good', fine_rate_per_day: 0, image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=300&fit=crop&q=80&auto=format' },
    ]);
    console.log('Equipment seeded');
  }

  // Demo overdue borrow
  const demoStudent = await User.findOne({ email: 'student@university.edu' });
  const overdueExists = demoStudent
    ? await BorrowRecord.findOne({ user_id: demoStudent._id })
    : true;
  if (!overdueExists) {
    const user = demoStudent;
    const equip = await Equipment.findOne({ name: 'MacBook Pro 16"' });
    if (user && equip) {
      const dueDate = '2026-03-10'; // เกินกำหนดมา 20 วัน
      const borrowDate = '2026-03-03';
      const borrow = await BorrowRecord.create({
        user_id: user._id,
        equipment_id: equip._id,
        borrow_type: 'short_term',
        status: 'borrowing',
        quantity: 1,
        borrow_date: borrowDate,
        due_date: dueDate,
        purpose: 'ใช้ทำโปรเจคจบ',
      });
      // ลด available_quantity
      equip.available_quantity -= 1;
      await equip.save();

      // คำนวณค่าปรับ (วันนี้ - due_date) × fine_rate
      const today = new Date();
      const due = new Date(dueDate);
      const daysOverdue = Math.ceil((today - due) / 86400000);
      const fineAmount = daysOverdue * equip.fine_rate_per_day;

      await Fine.create({
        borrow_record_id: borrow._id,
        user_id: user._id,
        amount: fineAmount,
        reason: 'overdue',
        status: 'pending',
      });
      console.log(`Overdue borrow seeded — ${daysOverdue} days overdue, fine = ${fineAmount} THB`);
    }
  }
}

module.exports = seedDatabase;
