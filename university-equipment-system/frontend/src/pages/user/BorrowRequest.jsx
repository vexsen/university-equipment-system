import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useUserBorrow } from '../../context/UserBorrowContext';

export default function BorrowRequest() {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { refreshUserPending } = useUserBorrow();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ quantity: 1, due_date: '', purpose: '' });

  useEffect(() => {
    api.get(`/equipment/${equipmentId}`)
      .then(res => setEquipment(res.data))
      .catch(() => setError('Equipment not found.'))
      .finally(() => setLoading(false));
  }, [equipmentId]);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/borrows', {
        equipment_id: equipmentId,
        quantity: parseInt(form.quantity),
        due_date: equipment.borrow_type === 'short_term' ? form.due_date : undefined,
        purpose: form.purpose,
      });
      setSuccess('Borrow request submitted successfully. Please wait for admin approval.');
      refreshUserPending();
      setTimeout(() => navigate('/user/borrow-history'), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><div className="loading-spinner" /><p>Loading...</p></div>;
  if (error && !equipment) return (
    <div>
      <div className="error-msg">{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate('/user/search')}>Back to Search</button>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/user/search')} style={{ marginBottom: 12 }}>
          ← Back to Search
        </button>
        <h2>Borrow Request Form</h2>
        <p>Fill in the details below to submit your borrow request</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><h3>Request Details</h3></div>
          <div className="card-body">
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Equipment</label>
                <input type="text" value={equipment?.name} readOnly style={{ background: 'var(--gray-50)', cursor: 'default' }} />
              </div>

              <div className="form-group">
                <label>Borrow Type</label>
                <input
                  type="text"
                  value={equipment?.borrow_type === 'long_term' ? 'Long-Term Allocation (No deadline, no fines)' : 'Short-Term Borrow (Return date required)'}
                  readOnly style={{ background: 'var(--gray-50)', cursor: 'default' }}
                />
              </div>

              {equipment?.borrow_type === 'short_term' && equipment?.total_quantity > 1 && (
                <div className="form-group">
                  <label>Quantity <span className="required">*</span></label>
                  <input
                    type="number" min="1" max={equipment.available_quantity}
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    required
                  />
                  <div className="form-hint">{equipment.available_quantity} units available</div>
                </div>
              )}

              {equipment?.borrow_type === 'short_term' && (
                <div className="form-group">
                  <label>Return Due Date <span className="required">*</span></label>
                  <input
                    type="date" required min={tomorrow}
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  />
                  <div className="form-hint">
                    Late return fine: {equipment?.fine_rate_per_day} THB/day
                  </div>
                </div>
              )}

              {equipment?.borrow_type === 'long_term' && (
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  This is a long-term allocation. No return date is required and no fines will be charged. The allocation will remain active until recalled by an administrator.
                </div>
              )}

              <div className="form-group">
                <label>Purpose / Reason <span className="required">*</span></label>
                <textarea
                  required placeholder="Describe the purpose and how you plan to use this equipment..."
                  value={form.purpose}
                  onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/user/search')}>Cancel</button>
                <button
                  type="submit" className="btn btn-primary"
                  disabled={submitting || (equipment?.borrow_type === 'short_term' && equipment?.available_quantity === 0)}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            {equipment?.image_url && (
              <div style={{ height: 200, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <img src={equipment.image_url} alt={equipment.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}
            <div className="card-header"><h3>Equipment Details</h3></div>
            <div className="card-body">
              <div className="info-row">
                <div className="info-item"><span className="info-label">Name</span><span className="info-value">{equipment?.name}</span></div>
                <div className="info-item"><span className="info-label">Category</span><span className="info-value">{equipment?.category}</span></div>
                {equipment?.serial_number && (
                  <div className="info-item"><span className="info-label">Serial Number</span><span className="info-value">{equipment.serial_number}</span></div>
                )}
                <div className="info-item">
                  <span className="info-label">Condition</span>
                  <span className="info-value">
                    {equipment?.condition === 'good' ? 'Good' : equipment?.condition === 'fair' ? 'Fair' : 'Poor'}
                  </span>
                </div>
                {equipment?.location && (
                  <div className="info-item"><span className="info-label">Location</span><span className="info-value">{equipment.location}</span></div>
                )}
                {equipment?.borrow_type === 'short_term' && (
                  <div className="info-item"><span className="info-label">Available</span><span className="info-value">{equipment?.available_quantity} / {equipment?.total_quantity} pcs</span></div>
                )}
                {equipment?.description && (
                  <div className="info-item"><span className="info-label">Description</span><span className="info-value">{equipment.description}</span></div>
                )}
              </div>
            </div>
          </div>

          {equipment?.borrow_type === 'short_term' && (
            <div className="card">
              <div className="card-header"><h3>Fine Policy</h3></div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
                  Late returns are charged <strong>{equipment?.fine_rate_per_day} THB per day</strong>.
                  If the equipment is lost, a replacement fine of <strong>{equipment?.value?.toLocaleString()} THB</strong> will be charged.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
