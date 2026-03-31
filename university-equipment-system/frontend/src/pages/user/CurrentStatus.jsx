import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const statIcons = {
  active: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="1"/></svg>,
  longterm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  pending: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  overdue: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

export default function CurrentStatus() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/user')
      .then(res => setDashboard(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  if (loading) return <div className="loading"><div className="loading-spinner" /><p>Loading...</p></div>;

  const { stats, due_soon, overdue_items, fine_balance, long_term_allocations } = dashboard;

  return (
    <div>
      <div className="page-header">
        <h2>Current Status</h2>
        <p>Overview of your active borrows and alerts</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card primary">
          <div className="stat-card-top"><div className="stat-label">Active Borrows</div><div className="stat-icon">{statIcons.active}</div></div>
          <div className="stat-value">{stats.active_borrows}</div>
          <div className="stat-sub">Items currently in use</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-card-top"><div className="stat-label">Long-Term Allocated</div><div className="stat-icon">{statIcons.longterm}</div></div>
          <div className="stat-value">{stats.long_term_allocations}</div>
          <div className="stat-sub">Assigned equipment</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-top"><div className="stat-label">Pending Approval</div><div className="stat-icon">{statIcons.pending}</div></div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-sub">Awaiting review</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-card-top"><div className="stat-label">Overdue</div><div className="stat-icon">{statIcons.overdue}</div></div>
          <div className="stat-value">{stats.overdue_count}</div>
          <div className="stat-sub">Past due date</div>
        </div>
      </div>

      {overdue_items.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ background: 'var(--danger-light)' }}>
            <h3 style={{ color: 'var(--danger)' }}>Overdue Items — Immediate Action Required</h3>
            <span className="badge badge-overdue">{overdue_items.length} items</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Accumulated Fine</th>
                </tr>
              </thead>
              <tbody>
                {overdue_items.map(item => (
                  <tr key={item.id} style={{ background: '#FFF5F5' }}>
                    <td className="col-name">{item.equipment_name}</td>
                    <td style={{ color: 'var(--danger)' }}>{formatDate(item.due_date)}</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{item.days_overdue} days</td>
                    <td style={{ color: 'var(--danger)', fontWeight: 700 }}>
                      {(item.days_overdue * item.fine_rate_per_day).toFixed(2)} THB
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', background: 'var(--danger-light)', borderTop: '1px solid #FFCDD2', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
            <p style={{ fontSize: 13, color: 'var(--danger)' }}>
              Please return overdue items as soon as possible to stop accumulating fines. Contact the equipment room if you need assistance.
            </p>
          </div>
        </div>
      )}

      {due_soon.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ background: 'var(--warning-light)' }}>
            <h3 style={{ color: 'var(--warning)' }}>Due Soon — Within 3 Days</h3>
            <span className="badge badge-pending">{due_soon.length} items</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Quantity</th>
                  <th>Due Date</th>
                  <th>Time Remaining</th>
                </tr>
              </thead>
              <tbody>
                {due_soon.map(item => (
                  <tr key={item.id} style={{ background: '#FFFBEB' }}>
                    <td className="col-name">{item.equipment_name}</td>
                    <td>{item.quantity} pcs</td>
                    <td style={{ color: 'var(--warning)' }}>{formatDate(item.due_date)}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 700 }}>
                      {item.days_remaining === 0 ? 'Due today' : `${item.days_remaining} days left`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {fine_balance > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>You have an outstanding fine balance of <strong>{fine_balance.toFixed(2)} THB</strong>. Please contact the equipment room.</span>
          <button className="btn btn-danger btn-sm" style={{ marginLeft: 8 }} onClick={() => navigate('/user/fines')}>View Fines</button>
        </div>
      )}

      {long_term_allocations.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3>Long-Term Allocated Equipment</h3>
            <span className="badge badge-long_term_allocation">{long_term_allocations.length} items</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Quantity</th>
                  <th>Allocated On</th>
                  <th>Due Date</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {long_term_allocations.map(item => (
                  <tr key={item.id}>
                    <td className="col-name">{item.equipment_name}</td>
                    <td>{item.category}</td>
                    <td>{item.location || '-'}</td>
                    <td>{item.quantity} pcs</td>
                    <td>{formatDate(item.borrow_date)}</td>
                    <td><span className="text-muted">No deadline</span></td>
                    <td><span className="text-muted">No fine</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', background: 'var(--purple-light)', borderTop: '1px solid #E1BEE7', borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' }}>
            <p style={{ fontSize: 13, color: 'var(--purple)' }}>
              Long-term allocations have no return deadline and no fines. Equipment remains in your care until recalled by an administrator.
            </p>
          </div>
        </div>
      )}

      {overdue_items.length === 0 && due_soon.length === 0 && fine_balance === 0 && stats.active_borrows === 0 && stats.long_term_allocations === 0 && (
        <div className="card">
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, color: 'var(--gray-300)', marginBottom: 12 }}><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
            <h4>All Clear</h4>
            <p>You have no active borrows or pending actions.</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/user/search')}>Browse Equipment</button>
          </div>
        </div>
      )}
    </div>
  );
}
