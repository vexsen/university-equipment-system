import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const REASON_LABELS = { overdue: 'Late Return', lost: 'Equipment Lost' };
const STATUS_BADGE = { pending: 'badge-overdue', paid: 'badge-approved', waived: 'badge-returned' };
const STATUS_LABELS = { pending: 'Outstanding', paid: 'Paid', waived: 'Waived' };

export default function FineManagement() {
  const [data, setData] = useState({ fines: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/fines/all', { params });
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchFines(); }, [fetchFines]);

  const handlePay = async (id) => {
    setProcessing(id + '-pay');
    try {
      await api.put(`/fines/${id}/pay`);
      fetchFines();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to record payment.');
    } finally {
      setProcessing(null);
    }
  };

  const handleWaive = async (id) => {
    if (!confirm('Waive this fine? This action cannot be undone.')) return;
    setProcessing(id + '-waive');
    try {
      await api.put(`/fines/${id}/waive`);
      fetchFines();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to waive fine.');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  const { fines, totals } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Fine Management</h2>
        <p>Review, collect, and manage all fine records</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card danger">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{(totals.pending_total || 0).toFixed(2)}</div>
          <div className="stat-sub">Awaiting payment</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Collected</div>
          <div className="stat-value">{(totals.paid_total || 0).toFixed(2)}</div>
          <div className="stat-sub">Paid</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{totals.total_count || 0}</div>
          <div className="stat-sub">All time</div>
        </div>
      </div>

      <div className="filter-row">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Outstanding</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchFines}>Refresh</button>
      </div>

      {loading ? (
        <div className="loading"><div className="loading-spinner" /><p>Loading...</p></div>
      ) : fines.length === 0 ? (
        <div className="empty-state"><h4>No Fine Records Found</h4><p>No records match the selected filter.</p></div>
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
                  <th>Borrow Type</th>
                  <th>Reason</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Amount (THB)</th>
                  <th>Status</th>
                  <th>Issued On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.map(fine => (
                  <tr key={fine.id} style={fine.status === 'pending' ? { background: '#fff5f5' } : {}}>
                    <td>#{fine.id?.slice(-6).toUpperCase()}</td>
                    <td className="col-name">{fine.user_name}</td>
                    <td>{fine.student_id || '-'}</td>
                    <td>{fine.equipment_name}</td>
                    <td>
                      {fine.borrow_type === 'long_term'
                        ? <span className="badge badge-long_term">Long-Term</span>
                        : <span className="badge badge-short_term">Short-Term</span>}
                    </td>
                    <td>{REASON_LABELS[fine.reason] || fine.reason}</td>
                    <td>{fine.borrow_type === 'long_term' ? <span className="text-muted">No deadline</span> : formatDate(fine.due_date)}</td>
                    <td>{formatDate(fine.return_date)}</td>
                    <td style={{ fontWeight: 600, color: fine.status === 'pending' ? 'var(--danger)' : 'inherit' }}>
                      {fine.amount.toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[fine.status] || ''}`}>
                        {STATUS_LABELS[fine.status] || fine.status}
                      </span>
                    </td>
                    <td>{formatDate(fine.created_at)}</td>
                    <td>
                      {fine.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" disabled={processing === fine.id + '-pay'} onClick={() => handlePay(fine.id)}>
                            {processing === fine.id + '-pay' ? '...' : 'Mark Paid'}
                          </button>
                          <button className="btn btn-secondary btn-sm" disabled={processing === fine.id + '-waive'} onClick={() => handleWaive(fine.id)}>
                            {processing === fine.id + '-waive' ? '...' : 'Waive'}
                          </button>
                        </div>
                      )}
                      {fine.status !== 'pending' && (
                        <span className="text-muted" style={{ fontSize: 12 }}>
                          {fine.status === 'paid' ? `Paid ${formatDate(fine.paid_at)}` : `Waived ${formatDate(fine.paid_at)}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
