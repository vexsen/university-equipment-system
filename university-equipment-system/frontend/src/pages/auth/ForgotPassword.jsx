import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [email, setEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMaskedEmail(res.data.email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      setResetToken(res.data.reset_token);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/auth/reset-password', { reset_token: resetToken, new_password: newPassword });
      setStep(4);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 420 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M12 7v10M8 12h8"/></svg>
          </div>
          University Equipment System
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: step > s ? 'var(--primary)' : step === s ? 'var(--primary)' : 'var(--gray-200)',
              opacity: step >= s ? 1 : 0.4,
              transition: 'all 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h2 className="auth-title">Forgot Password</h2>
            <p className="auth-subtitle">Enter your email and we'll send you an OTP code</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input type="email" required autoFocus placeholder="your@university.edu"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 10 }} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP Code'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="auth-title">Enter OTP</h2>
            <p className="auth-subtitle">We sent a 6-digit code to <strong>{maskedEmail}</strong></p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleVerifyOTP}>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => handleOtpKey(e, idx)}
                    style={{
                      width: 48, height: 56, textAlign: 'center',
                      fontSize: 24, fontWeight: 700,
                      border: `2px solid ${digit ? 'var(--primary)' : 'var(--gray-200)'}`,
                      borderRadius: 10, outline: 'none',
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 10 }} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" className="btn btn-secondary" style={{ width: '100%', borderRadius: 10, marginTop: 10 }}
                onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}>
                Resend OTP
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="auth-title">New Password</h2>
            <p className="auth-subtitle">Create a new password for your account</p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password <span className="required">*</span></label>
                <input type="password" required autoFocus placeholder="At least 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm Password <span className="required">*</span></label>
                <input type="password" required placeholder="Repeat your password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 10 }} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h2 className="auth-title">Password Reset!</h2>
            <p className="auth-subtitle">Redirecting you to login...</p>
          </div>
        )}

        {step < 4 && (
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--gray-600)' }}>
            <Link to="/login" className="auth-link">Back to Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
