import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const REASON_LABELS = { overdue: 'Late Return', lost: 'Equipment Lost' };
const STATUS_STYLES = { pending: 'badge-overdue', paid: 'badge-approved', waived: 'badge-returned' };
const STATUS_LABELS = { pending: 'Outstanding', paid: 'Paid', waived: 'Waived' };

export default function FineBalance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fines')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  if (loading) return <div className="loading"><div className="loading-spinner" /><p>Loading...</p></div>;

  const { fines, summary } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Fine Balance</h2>
        <p>Check your outstanding fines and payment history</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card danger">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{summary.pending_total.toFixed(2)}</div>
          <div className="stat-sub">{summary.pending_count} unpaid records</div>
        </div>
        <div className="stat-card success">
          <div className="stat-label">Total Paid</div>
          <div className="stat-value">{summary.paid_total.toFixed(2)}</div>
          <div className="stat-sub">Fines already paid</div>
        </div>
        <div className="stat-card primary">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{fines.length}</div>
          <div className="stat-sub">All time</div>
        </div>
      </div>

      {summary.pending_total > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          You have an outstanding fine balance of <strong>{summary.pending_total.toFixed(2)} THB</strong>. Please contact the equipment room to settle your fines.
        </div>
      )}

      {fines.length === 0 ? (
        <div className="empty-state">
          <h4>No Fine History</h4>
          <p>You have no fine records. Thank you for returning equipment on time.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-header"><h3>Fine Records</h3></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipment</th>
                  <th>Reason</th>
                  <th>Borrow Type</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issued On</th>
                </tr>
              </thead>
              <tbody>
                {fines.map(fine => (
                  <tr key={fine.id}>
                    <td>#{fine.id}</td>
                    <td className="col-name">{fine.equipment_name}</td>
                    <td>{REASON_LABELS[fine.reason] || fine.reason}</td>
                    <td>
                      {fine.borrow_type === 'long_term'
                        ? <span className="badge badge-long_term">Long-Term</span>
                        : <span className="badge badge-short_term">Short-Term</span>}
                    </td>
                    <td>{fine.borrow_type === 'long_term' ? <span className="text-muted">No deadline</span> : formatDate(fine.due_date)}</td>
                    <td>{formatDate(fine.return_date)}</td>
                    <td style={{ fontWeight: 600, color: fine.status === 'pending' ? 'var(--danger)' : 'var(--gray-700)' }}>
                      {fine.amount.toFixed(2)} THB
                    </td>
                    <td><span className={`badge ${STATUS_STYLES[fine.status] || ''}`}>{STATUS_LABELS[fine.status] || fine.status}</span></td>
                    <td>{formatDate(fine.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><h3>Fine Policy</h3></div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-800)' }}>Short-Term Borrow Fines</h4>
              <ul style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.8, paddingLeft: 20 }}>
                <li>Daily fine charged for each day past the due date</li>
                <li>Fine rate varies by equipment type</li>
                <li>Fines accumulate until the equipment is returned</li>
                <li>Lost equipment: replacement value charged as fine</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-800)' }}>Long-Term Allocation Policy</h4>
              <ul style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.8, paddingLeft: 20 }}>
                <li>No return deadline required</li>
                <li>No fines applied under any circumstances</li>
                <li>Equipment stays in your care until recalled by admin</li>
                <li>Maintain equipment in good working condition</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
