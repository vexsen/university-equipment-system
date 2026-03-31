import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { pageTransition, staggerContainer, rowItem, fadeUp, modalOverlay, modalContent } from '../../utils/animations';

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

export default function MyBorrows() {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBorrow, setSelectedBorrow] = useState(null);

  const fetchBorrows = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/borrows', { params });
      setBorrows(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows(true);
    const interval = setInterval(() => fetchBorrows(false), 5000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="show">
      <div className="page-header">
        <h2>My Borrow History</h2>
        <p>All your equipment borrow requests and records</p>
      </div>

      <div className="filter-row">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="borrowing">Borrowing</option>
          <option value="long_term_allocation">Long-Term Allocation</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
          <option value="lost">Lost</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchBorrows}>Refresh</button>
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" variants={fadeUp} initial="hidden" animate="show" className="loading">
          <div className="loading-spinner" /><p>Loading...</p>
        </motion.div>
      ) : borrows.length === 0 ? (
        <motion.div key="empty" variants={fadeUp} initial="hidden" animate="show" className="empty-state">
          <h4>No Records Found</h4>
          <p>{statusFilter ? 'No records match this status.' : 'You have not submitted any borrow requests yet.'}</p>
        </motion.div>
      ) : (
        <motion.div key="table" variants={fadeUp} initial="hidden" animate="show" className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Fine</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {borrows.map(b => (
                  <tr key={b.id}>
                    <td>#{b.id?.slice(-6).toUpperCase()}</td>
                    <td className="col-name">{b.equipment_name}</td>
                    <td>
                      {b.borrow_type === 'long_term'
                        ? <span className="badge badge-long_term">Long-Term</span>
                        : <span className="badge badge-short_term">Short-Term</span>}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>{formatDate(b.borrow_date)}</td>
                    <td>
                      {b.borrow_type === 'long_term' ? <span className="text-muted">No deadline</span> : formatDate(b.due_date)}
                    </td>
                    <td>{formatDate(b.return_date)}</td>
                    <td>
                      {b.borrow_type === 'long_term' ? (
                        <span className="text-muted">No fine</span>
                      ) : b.current_fine > 0 ? (
                        <span className="text-danger fw-600">{b.current_fine.toFixed(2)} THB</span>
                      ) : b.fine_amount > 0 ? (
                        <span className="text-danger fw-600">{b.fine_amount.toFixed(2)} THB</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedBorrow(b)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {selectedBorrow && (
        <motion.div className="modal-overlay" variants={modalOverlay} initial="hidden" animate="show" exit="exit" onClick={() => setSelectedBorrow(null)}>
          <motion.div className="modal" variants={modalContent} initial="hidden" animate="show" exit="exit" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Borrow Details #{selectedBorrow.id}</h3>
              <button className="modal-close" onClick={() => setSelectedBorrow(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <div className="info-item"><span className="info-label">Equipment</span><span className="info-value">{selectedBorrow.equipment_name}</span></div>
                <div className="info-item"><span className="info-label">Category</span><span className="info-value">{selectedBorrow.category}</span></div>
                <div className="info-item"><span className="info-label">Borrow Type</span><span className="info-value">{selectedBorrow.borrow_type === 'long_term' ? 'Long-Term Allocation' : 'Short-Term Borrow'}</span></div>
                <div className="info-item"><span className="info-label">Status</span><span className="info-value"><StatusBadge status={selectedBorrow.status} /></span></div>
                <div className="info-item"><span className="info-label">Quantity</span><span className="info-value">{selectedBorrow.quantity} pcs</span></div>
                <div className="info-item"><span className="info-label">Request Date</span><span className="info-value">{formatDate(selectedBorrow.created_at)}</span></div>
                <div className="info-item"><span className="info-label">Borrow Date</span><span className="info-value">{formatDate(selectedBorrow.borrow_date)}</span></div>
                {selectedBorrow.borrow_type === 'short_term' && (
                  <div className="info-item"><span className="info-label">Due Date</span><span className="info-value">{formatDate(selectedBorrow.due_date)}</span></div>
                )}
                {selectedBorrow.return_date && (
                  <div className="info-item"><span className="info-label">Return Date</span><span className="info-value">{formatDate(selectedBorrow.return_date)}</span></div>
                )}
                {selectedBorrow.purpose && (
                  <div className="info-item"><span className="info-label">Purpose</span><span className="info-value">{selectedBorrow.purpose}</span></div>
                )}
                {selectedBorrow.approved_by_name && (
                  <div className="info-item"><span className="info-label">Approved By</span><span className="info-value">{selectedBorrow.approved_by_name}</span></div>
                )}
                {selectedBorrow.admin_notes && (
                  <div className="info-item"><span className="info-label">Admin Notes</span><span className="info-value">{selectedBorrow.admin_notes}</span></div>
                )}
              </div>

              {selectedBorrow.borrow_type === 'long_term' && (
                <div className="alert alert-info" style={{ marginTop: 16 }}>
                  Long-term allocation: no return deadline and no fines apply.
                </div>
              )}

              {selectedBorrow.borrow_type === 'short_term' && (selectedBorrow.current_fine > 0 || selectedBorrow.fine_amount > 0) && (
                <div className="fine-box">
                  <div className="fine-label">
                    {selectedBorrow.status === 'overdue' ? 'Current Accumulated Fine' : 'Fine Charged'}
                  </div>
                  <div className="fine-amount">
                    {(selectedBorrow.current_fine || selectedBorrow.fine_amount || 0).toFixed(2)} THB
                  </div>
                  {selectedBorrow.days_overdue && (
                    <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                      {selectedBorrow.days_overdue} days overdue at {selectedBorrow.fine_rate_per_day} THB/day
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBorrow(null)}>Close</button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
