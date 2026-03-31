import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DEPARTMENTS = [
  'Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Business Administration', 'Economics',
  'Law', 'Medicine', 'Nursing', 'Education', 'Arts', 'Science',
  'Architecture', 'Agriculture',
];

function getPasswordStrength(pw) {
  const checks = {
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  let level = 'weak';
  if (passed >= 4) level = 'strong';
  else if (passed >= 3) level = 'medium';
  return { checks, passed, level };
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'student', department: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const pwStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (pwStrength.passed < 4) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      const user = await register(data);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/search');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = { weak: '#DC2626', medium: '#D97706', strong: '#16A34A' };
  const strengthLabel = { weak: 'Weak', medium: 'Medium', strong: 'Strong' };
  const strengthWidth = { weak: '33%', medium: '66%', strong: '100%' };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M12 7v10M8 12h8"/></svg>
          </div>
          University Equipment System
        </div>
        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Register to access the equipment portal</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input type="text" required placeholder="Your full name" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label>Account Type <span className="required">*</span></label>
              <select value={form.role} onChange={set('role')}>
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <input type="email" required placeholder="your@university.edu" value={form.email} onChange={set('email')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department / Faculty</label>
              <select value={form.department} onChange={set('department')}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" placeholder="Contact number (optional)" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          {/* Auto-generated ID notice */}
          <div className="auto-id-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>{form.role === 'student' ? 'Student' : 'Staff'} ID will be automatically generated (e.g. {form.role === 'student' ? 'STU-2026001' : 'STF-2026001'})</span>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password <span className="required">*</span></label>
              <input type="password" required placeholder="Strong password" value={form.password} onChange={set('password')} />
              {form.password && (
                <div className="pw-strength">
                  <div className="pw-strength-bar">
                    <div className="pw-strength-fill" style={{ width: strengthWidth[pwStrength.level], background: strengthColor[pwStrength.level] }} />
                  </div>
                  <span className="pw-strength-label" style={{ color: strengthColor[pwStrength.level] }}>{strengthLabel[pwStrength.level]}</span>
                  <ul className="pw-checklist">
                    <li className={pwStrength.checks.length ? 'pass' : ''}>
                      {pwStrength.checks.length ? '✓' : '✗'} At least 8 characters
                    </li>
                    <li className={pwStrength.checks.uppercase ? 'pass' : ''}>
                      {pwStrength.checks.uppercase ? '✓' : '✗'} Uppercase letter (A-Z)
                    </li>
                    <li className={pwStrength.checks.number ? 'pass' : ''}>
                      {pwStrength.checks.number ? '✓' : '✗'} Number (0-9)
                    </li>
                    <li className={pwStrength.checks.special ? 'pass' : ''}>
                      {pwStrength.checks.special ? '✓' : '✗'} Special character (!@#$%...)
                    </li>
                  </ul>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Confirm Password <span className="required">*</span></label>
              <input type="password" required placeholder="Re-enter your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <div className="form-hint" style={{ color: 'var(--danger)' }}>Passwords do not match</div>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length > 0 && (
                <div className="form-hint" style={{ color: 'var(--success)' }}>✓ Passwords match</div>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4, borderRadius: 10 }} disabled={loading || pwStrength.passed < 4}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
