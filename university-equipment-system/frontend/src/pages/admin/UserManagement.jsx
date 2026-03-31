import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const ROLE_LABELS = { student: 'Student', staff: 'Staff', admin: 'Admin' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data);
    } catch {}
    finally { setLoading(false); }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const openEdit = (user) => {
    setEditModal(user);
    setForm({ name: user.name, email: user.email, role: user.role, student_id: user.student_id || '', department: user.department || '', phone: user.phone || '', password: '' });
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      await api.put(`/users/${editModal.id}`, data);
      setEditModal(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!confirm(`Suspend account for ${user.name}?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to suspend account.');
    }
  };

  const handleActivate = async (user) => {
    if (!confirm(`Unsuspend account for ${user.name}?`)) return;
    try {
      await api.put(`/users/${user.id}`, { is_active: true });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unsuspend account.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <p>View and manage all registered users in the system</p>
      </div>

      <div className="filter-row">
        <input
          type="text" placeholder="Search name, email, student ID..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }}
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setRoleFilter(''); }}>Clear</button>
      </div>

      {loading ? (
        <div className="loading"><div className="loading-spinner" /><p>Loading...</p></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Student / Staff ID</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={!u.is_active ? { opacity: 0.5 } : {}}>
                    <td>#{u.id?.slice(-6).toUpperCase()}</td>
                    <td className="col-name">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-long_term_allocation' : u.role === 'staff' ? 'badge-borrowing' : 'badge-returned'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>{u.student_id || '-'}</td>
                    <td>{u.department || '-'}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-available' : 'badge-returned'}`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>{formatDate(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelected(u)}>View</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        {u.role !== 'admin' && (
                          u.is_active
                            ? <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u)}>Suspend</button>
                            : <button className="btn btn-success btn-sm" onClick={() => handleActivate(u)}>Unsuspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>User Profile</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-row">
                <div className="info-item"><span className="info-label">Full Name</span><span className="info-value">{selected.name}</span></div>
                <div className="info-item"><span className="info-label">Email</span><span className="info-value">{selected.email}</span></div>
                <div className="info-item"><span className="info-label">Account Type</span><span className="info-value">{ROLE_LABELS[selected.role] || selected.role}</span></div>
                <div className="info-item"><span className="info-label">Student / Staff ID</span><span className="info-value">{selected.student_id || 'N/A'}</span></div>
                <div className="info-item"><span className="info-label">Department</span><span className="info-value">{selected.department || 'N/A'}</span></div>
                <div className="info-item"><span className="info-label">Phone</span><span className="info-value">{selected.phone || 'N/A'}</span></div>
                <div className="info-item"><span className="info-label">Account Status</span><span className="info-value">{selected.is_active ? 'Active' : 'Suspended'}</span></div>
                <div className="info-item"><span className="info-label">Registered</span><span className="info-value">{formatDate(selected.created_at)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
              <button className="btn btn-primary" onClick={() => { setSelected(null); openEdit(selected); }}>Edit Profile</button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User</h3>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input type="text" required value={form.name} onChange={set('name')} />
                  </div>
                  <div className="form-group">
                    <label>Account Type <span className="required">*</span></label>
                    <select value={form.role} onChange={set('role')}>
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input type="email" required value={form.email} onChange={set('email')} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Student / Staff ID</label>
                    <input type="text" value={form.student_id} onChange={set('student_id')} />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input type="text" value={form.department} onChange={set('department')} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <input type="password" placeholder="Leave blank to keep current" value={form.password} onChange={set('password')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
