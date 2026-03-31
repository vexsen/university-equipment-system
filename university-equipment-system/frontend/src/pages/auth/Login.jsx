import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { scaleIn, fadeUp } from '../../utils/animations';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/user/search');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div className="auth-card" variants={scaleIn} initial="hidden" animate="show">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M12 7v10M8 12h8"/></svg>
          </div>
          University Equipment System
        </div>
        <h2 className="auth-title">Sign In</h2>
        <p className="auth-subtitle">Enter your credentials to access the portal</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email <span className="required">*</span></label>
            <input
              id="email" type="email" required autoFocus
              placeholder="your@university.edu"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password <span className="required">*</span></label>
            <input
              id="password" type="password" required
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 4 }}>
            <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
              Forgot password?
            </Link>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4, borderRadius: 10 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Register here</Link>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} style={{ marginTop: 24, padding: '14px 16px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--gray-200)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Demo Accounts</div>
          <div style={{ fontSize: 12, color: 'var(--gray-700)', lineHeight: 1.7 }}>
            <strong>Admin:</strong> admin@university.edu / admin123<br />
            <strong>Student:</strong> student@university.edu / student123
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
