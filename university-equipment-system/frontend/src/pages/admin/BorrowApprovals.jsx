import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { usePendingCount } from '../../context/PendingCountContext';

const STATUS_LABELS = {
  pending: 'Pending',
  borrowing: 'Borrowing',
  returned: 'Returned',
  overdue: 'Overdue',
  lost: 'Lost',
  rejected: 'Rejected',
  long_term_allocation: 'Long-Term Allocation',
};

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABELS[status] || status}</span>;
}

export default function BorrowApprovals() {
  const { pendingCount, refreshPendingCount } = usePendingCount();
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [actionDueDate, setActionDueDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [overdueCount, setOverdueCount] = useState(0);

  const fetchOverdueCount = useCallback(async () => {
    try {
      const res = await api.get('/borrows/all', { params: { status: 'borrowing' } });
      const today = new Date().toISOString().split('T')[0];
      const count = res.data.filter(b => b.due_date && b.due_date < today).length;
      setOverdueCount(count);
    } catch {}
  }, []);

  const fetchBorrows = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/borrows/all', { params });
      setBorrows(res.data);
    } catch {}
    finally { if (showLoading) setLoading(false); }
  }, [statusFilter]);

  useEffect(() => {
    fetchBorrows(true);
    fetchOverdueCount();
    const interval = setInterval(() => { fetchBorrows(false); fetchOverdueCount(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchBorrows, fetchOverdueCount]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  const openAction = (type, borrow) => {
    setActionModal({ type, borrow });
    setActionNote('');
    setActionDueDate(borrow.due_date || '');
    setError('');
  };

  const handleAction = async () => {
    const { type, borrow } = actionModal;
    setProcessing(true);
    setError('');
    try {
      if (type === 'approve') {
        await api.put(`/borrows/${borrow.id}/approve`, { admin_notes: actionNote, due_date: actionDueDate || undefined });
      } else if (type === 'reject') {
        await api.put(`/borrows/${borrow.id}/reject`, { admin_notes: actionNote });
      } else if (type === 'return') {
        await api.put(`/borrows/${borrow.id}/return`, {});
      } else if (type === 'lost') {
        await api.put(`/borrows/${borrow.id}/mark-lost`, {});
      }
      setActionModal(null);
      setSelected(null);
      fetchBorrows();
      refreshPendingCount();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const actionLabels = {
    approve: { btn: 'btn-success', text: 'Approve', title: 'Approve Borrow Request' },
    reject: { btn: 'btn-danger', text: 'Reject', title: 'Reject Borrow Request' },
    return: { btn: 'btn-primary', text: 'Confirm Return', title: 'Record Equipment Return' },
    lost: { btn: 'btn-warning', text: 'Confirm Lost', title: 'Report Equipment Lost' },
  };

  return (
    <div>
      <div className="page-header">
        <h2>Borrow Approvals</h2>
        <p>Review and manage all equipment borrow requests</p>
      </div>

      {overdueCount > 0 && (
        <div style={{
          marginBottom: 16, padding: '12px 18px', borderRadius: 12,
          background: '#fef2f2', border: '1px solid #fecaca',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
            {overdueCount} item{overdueCount > 1 ? 's' : ''} overdue — past the return deadline
          </span>
          <button
            onClick={() => setStatusFilter('borrowing')}
            style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 20, border: 'none', background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
          >
            View Overdue
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {[
          { value: 'pending', label: 'Pending', count: pendingCount },
          { value: 'borrowing', label: 'Borrowing', count: overdueCount },
          { value: 'long_term_allocation', label: 'Long-Term' },
          { value: 'returned', label: 'Returned' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'lost', label: 'Lost' },
          { value: '', label: 'All' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            style={{
              padding: '7px 18px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.2s',
              background: statusFilter === tab.value ? 'var(--primary)' : 'white',
              color: statusFilter === tab.value ? 'white' : 'var(--gray-600)',
              boxShadow: statusFilter === tab.value ? '0 2px 8px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: 6, background: '#EF4444', color: 'white',
                borderRadius: 20, fontSize: 11, fontWeight: 700,
                padding: '1px 7px', lineHeight: '18px',
              }}>
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={fetchBorrows}>Refresh</button>
      </div>

      {loading ? (
        <div className="loading"><div className="loading-spinner" /><p>Loading...</p></div>
      ) : borrows.length === 0 ? (
        <div className="empty-state"><h4>No Records Found</h4><p>No records match the selected filter.</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Borrower</th>
                  <th>Student / Staff ID</th>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Fine</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map(b => (
                  <tr key={b.id} style={b.status === 'overdue' ? { background: '#fff5f5' } : {}}>
                    <td>#{b.id?.slice(-6).toUpperCase()}</td>
                    <td className="col-name">{b.user_name}</td>
                    <td>{b.student_id || '-'}</td>
                    <td>{b.equipment_name}</td>
                    <td>
                      {b.borrow_type === 'long_term'
                        ? <span className="badge badge-long_term">Long-Term</span>
                        : <span className="badge badge-short_term">Short-Term</span>}
                    </td>
                    <td>{b.quantity}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{formatDate(b.borrow_date)}</td>
                    <td>
                      {b.borrow_type === 'long_term' ? <span className="text-muted">No deadline</span>
                        : <span style={b.status === 'overdue' ? { color: 'var(--danger)', fontWeight: 600 } : {}}>{formatDate(b.due_date)}</span>}
                    </td>
                    <td>
                      {b.borrow_type === 'long_term' ? <span className="text-muted">No fine</span>
                        : b.current_fine > 0 ? <span className="text-danger fw-600">{b.current_fine.toFixed(2)}</span>
                        : b.fine_amount > 0 ? <span className="text-danger fw-600">{b.fine_amount.toFixed(2)}</span>
                        : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(b)}>View</button>
                        {b.status === 'pending' && <>
                          <button className="btn btn-success btn-sm" onClick={() => openAction('approve', b)}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => openAction('reject', b)}>Reject</button>
                        </>}
                        {(b.status === 'borrowing' || b.status === 'overdue') && <>
                          <button className="btn btn-primary btn-sm" onClick={() => openAction('return', b)}>Return</button>
                          <button className="btn btn-warning btn-sm" onClick={() => openAction('lost', b)}>Lost</button>
                        </>}
                        {b.status === 'long_term_allocation' && (
                          <button className="btn btn-warning btn-sm" onClick={() => openAction('lost', b)}>Lost</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Borrow Record #{selected.id?.slice(-6).toUpperCase()}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <div className="info-item"><span className="info-label">Borrower</span><span className="info-value">{selected.user_name}</span></div>
                <div className="info-item"><span className="info-label">Email</span><span className="info-value">{selected.user_email}</span></div>
                <div className="info-item"><span className="info-label">Student / Staff ID</span><span className="info-value">{selected.student_id || '-'}</span></div>
                <div className="info-item"><span className="info-label">Department</span><span className="info-value">{selected.department || '-'}</span></div>
                <div className="info-item"><span className="info-label">Equipment</span><span className="info-value">{selected.equipment_name}</span></div>
                <div className="info-item"><span className="info-label">Category</span><span className="info-value">{selected.category}</span></div>
                <div className="info-item"><span className="info-label">Borrow Type</span><span className="info-value">{selected.borrow_type === 'long_term' ? 'Long-Term Allocation' : 'Short-Term Borrow'}</span></div>
                <div className="info-item"><span className="info-label">Status</span><span className="info-value"><StatusBadge status={selected.status} /></span></div>
                <div className="info-item"><span className="info-label">Quantity</span><span className="info-value">{selected.quantity} pcs</span></div>
                <div className="info-item"><span className="info-label">Purpose</span><span className="info-value">{selected.purpose || '-'}</span></div>
                <div className="info-item"><span className="info-label">Request Date</span><span className="info-value">{formatDate(selected.created_at)}</span></div>
                {selected.borrow_date && <div className="info-item"><span className="info-label">Borrow Date</span><span className="info-value">{formatDate(selected.borrow_date)}</span></div>}
                {selected.borrow_type === 'short_term' && <div className="info-item"><span className="info-label">Due Date</span><span className="info-value">{formatDate(selected.due_date)}</span></div>}
                {selected.return_date && <div className="info-item"><span className="info-label">Return Date</span><span className="info-value">{formatDate(selected.return_date)}</span></div>}
                {selected.admin_notes && <div className="info-item"><span className="info-label">Admin Notes</span><span className="info-value">{selected.admin_notes}</span></div>}
              </div>
              {selected.borrow_type === 'long_term' && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>Long-term allocation: no return deadline and no fines apply.</div>
              )}
              {(selected.current_fine > 0 || selected.fine_amount > 0) && selected.borrow_type === 'short_term' && (
                <div className="fine-box">
                  <div className="fine-label">Fine Amount</div>
                  <div className="fine-amount">{(selected.current_fine || selected.fine_amount || 0).toFixed(2)} THB</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionLabels[actionModal.type]?.title}</h3>
              <button className="modal-close" onClick={() => setActionModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-msg">{error}</div>}
              <div className="detail-box" style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>{actionModal.borrow.equipment_name}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                  Borrower: {actionModal.borrow.user_name} ({actionModal.borrow.student_id || actionModal.borrow.user_email})
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                  Type: {actionModal.borrow.borrow_type === 'long_term' ? 'Long-Term Allocation' : 'Short-Term Borrow'}
                </div>
              </div>

              {actionModal.type === 'approve' && actionModal.borrow.borrow_type === 'short_term' && (
                <div className="form-group">
                  <label>Confirm Return Due Date <span className="required">*</span></label>
                  <input type="date" min={today} value={actionDueDate} onChange={e => setActionDueDate(e.target.value)} required />
                </div>
              )}
              {actionModal.type === 'approve' && actionModal.borrow.borrow_type === 'long_term' && (
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  Approving as a long-term allocation. No return deadline and no fines will apply.
                </div>
              )}
              {actionModal.type === 'return' && (
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  {actionModal.borrow.borrow_type === 'short_term' && actionModal.borrow.due_date < today
                    ? 'This item is overdue. The system will automatically calculate the fine.'
                    : 'The equipment will be recorded as returned today.'}
                </div>
              )}
              {actionModal.type === 'lost' && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  {actionModal.borrow.borrow_type === 'long_term'
                    ? 'The allocated equipment will be reported as lost. The user will be charged the replacement value as a fine.'
                    : 'The user will be charged the replacement value of the equipment as a fine.'}
                </div>
              )}
              {(actionModal.type === 'approve' || actionModal.type === 'reject') && (
                <div className="form-group">
                  <label>Note to Borrower</label>
                  <textarea
                    placeholder="Optional note..."
                    value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn ${actionLabels[actionModal.type]?.btn}`}
                onClick={handleAction}
                disabled={processing || (actionModal.type === 'approve' && actionModal.borrow.borrow_type === 'short_term' && !actionDueDate)}
              >
                {processing ? 'Processing...' : actionLabels[actionModal.type]?.text}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
