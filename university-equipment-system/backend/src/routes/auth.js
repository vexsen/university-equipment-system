const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const router = express.Router();

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Business Administration', 'Economics',
  'Law', 'Medicine', 'Nursing', 'Education', 'Arts', 'Science',
  'Architecture', 'Agriculture',
];

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(pw)) errors.push('at least one uppercase letter');
  if (!/[0-9]/.test(pw)) errors.push('at least one number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) errors.push('at least one special character');
  return errors;
}

async function generateId(role) {
  const prefix = role === 'staff' ? 'STF' : 'STU';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}`;
  const last = await User.findOne({ student_id: { $regex: `^${pattern}` } }).sort({ student_id: -1 });
  let seq = 1;
  if (last) {
    const num = parseInt(last.student_id.slice(pattern.length), 10);
    if (!isNaN(num)) seq = num + 1;
  }
  return `${pattern}${String(seq).padStart(3, '0')}`;
}

// Get departments list
router.get('/departments', (_req, res) => res.json(DEPARTMENTS));

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', department, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const pwErrors = validatePassword(password);
    if (pwErrors.length) return res.status(400).json({ error: 'Password must have: ' + pwErrors.join(', ') });

    if (department && !DEPARTMENTS.includes(department)) {
      return res.status(400).json({ error: 'Invalid department. Please select from the provided list.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const allowedRoles = ['student', 'staff'];
    const userRole = allowedRoles.includes(role) ? role : 'student';
    const password_hash = bcrypt.hashSync(password, 10);
    const student_id = await generateId(userRole);

    const user = await User.create({ name, email, password_hash, role: userRole, student_id, department, phone });
    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    const safeUser = user.toJSON();
    delete safeUser.password_hash;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase(), is_active: true });
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id.toString(), email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const safeUser = user.toJSON();
    delete safeUser.password_hash;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password_hash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot password — send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp_code = otp;
    user.otp_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await transporter.sendMail({
      from: `"University Equipment System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
          <h2 style="color:#1e3a8a;margin-bottom:8px">Password Reset</h2>
          <p style="color:#6b7280">Hi <strong>${user.name}</strong>, here is your OTP code:</p>
          <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#2563eb;text-align:center;padding:24px 0">${otp}</div>
          <p style="color:#6b7280;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    });

    const masked = user.email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length));
    res.json({ message: 'OTP sent', email: masked });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.otp_code !== otp) return res.status(400).json({ error: 'Invalid OTP' });
    if (!user.otp_expires || user.otp_expires < new Date()) return res.status(400).json({ error: 'OTP has expired' });

    const reset_token = jwt.sign({ id: user._id.toString(), purpose: 'reset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ reset_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;
    if (!reset_token || !new_password) return res.status(400).json({ error: 'Token and new password are required' });
    const pwErrors = validatePassword(new_password);
    if (pwErrors.length) return res.status(400).json({ error: 'Password must have: ' + pwErrors.join(', ') });

    let decoded;
    try { decoded = jwt.verify(reset_token, process.env.JWT_SECRET); } catch { return res.status(400).json({ error: 'Invalid or expired token' }); }
    if (decoded.purpose !== 'reset') return res.status(400).json({ error: 'Invalid token' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password_hash = bcrypt.hashSync(new_password, 10);
    user.otp_code = null;
    user.otp_expires = null;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
