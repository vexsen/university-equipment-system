import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';

const INITIAL_FORM = { name: '', description: '', category: '', serial_number: '', value: '', borrow_type: 'short_term', total_quantity: 1, location: '', condition: 'good', fine_rate_per_day: 10, image_url: '' };

function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
    } catch (err) {
      alert('Failed to upload image: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Preview */}
      {value ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '2px solid var(--primary-light)' }}>
          <img
            src={value} alt="preview"
            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)', color: 'white',
              border: 'none', borderRadius: 20, padding: '4px 10px',
              fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}
          >
            ✕ Remove
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--gray-300)'}`,
            borderRadius: 12,
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'var(--primary-xlight)' : 'var(--gray-50)',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--gray-700)' }}>
            {uploading ? 'Uploading...' : 'Click or drag an image file here'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 4 }}>PNG, JPG, WEBP — max 5MB</div>
        </div>
      )}

      {/* Tabs: upload or URL */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{ flex: 1 }}
        >
          {uploading ? (
            <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid var(--gray-300)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 6 }} />Uploading...</>
          ) : (
            <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload from device</>
          )}
        </button>
        <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>or</span>
        <div style={{ flex: 2, position: 'relative' }}>
          <input
            type="url"
            placeholder="Paste image URL..."
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ margin: 0, fontSize: 12, padding: '6px 12px' }}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
}

export default function EquipmentManagement() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [borrowTypeFilter, setBorrowTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/equipment/categories');
      setCategories(res.data);
    } catch {}
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (borrowTypeFilter) params.borrow_type = borrowTypeFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/equipment', { params });
      setEquipment(res.data.equipment);
    } catch {}
    finally { setLoading(false); }
  }, [search, borrowTypeFilter, categoryFilter]);

  useEffect(() => {
    const t = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(t);
  }, [fetchEquipment]);

  const openCreate = () => {
    setEditItem(null);
    setForm(INITIAL_FORM);
    setError('');
    setAddingCategory(false);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description || '', category: item.category,
      serial_number: item.serial_number || '', value: item.value, borrow_type: item.borrow_type,
      total_quantity: item.total_quantity, location: item.location || '',
      condition: item.condition, fine_rate_per_day: item.fine_rate_per_day,
      image_url: item.image_url || '',
    });
    setError('');
    setAddingCategory(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.category) { setError('Please select or add a Category.'); return; }
    setError('');
    setSaving(true);
    try {
      if (editItem) {
        await api.put(`/equipment/${editItem.id}`, form);
      } else {
        await api.post('/equipment', form);
      }
      setShowModal(false);
      fetchEquipment();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/equipment/${id}`);
      setDeleteConfirm(null);
      fetchEquipment();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete.');
    }
  };

  const conditionLabel = (c) => ({ good: 'Good', fair: 'Fair', poor: 'Poor' }[c] || c);

  return (
    <div>
      <div className="page-header flex justify-between align-center">
        <div>
          <h2>Equipment Management</h2>
          <p>Add, edit, and manage all equipment in the system</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>Add Equipment</button>
      </div>

      <div className="filter-row">
        <input
          type="text" placeholder="Search equipment..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }}
        />
        <select value={borrowTypeFilter} onChange={e => setBorrowTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="short_term">Short-Term</option>
          <option value="long_term">Long-Term</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setBorrowTypeFilter(''); setCategoryFilter(''); }}>Clear</button>
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
                  <th>Image</th>
                  <th>Equipment Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Total Qty</th>
                  <th>Available</th>
                  <th>Value (THB)</th>
                  <th>Fine/Day</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map(item => (
                  <tr key={item.id}>
                    <td>#{item.id?.slice(-6).toUpperCase()}</td>
                    <td>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 6, display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div style={{ width: 48, height: 36, background: 'var(--gray-100)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>
                      )}
                    </td>
                    <td className="col-name">{item.name}</td>
                    <td>{item.category}</td>
                    <td>
                      {item.borrow_type === 'long_term'
                        ? <span className="badge badge-long_term">Long-Term</span>
                        : <span className="badge badge-short_term">Short-Term</span>}
                    </td>
                    <td>{item.total_quantity} pcs</td>
                    <td>
                      <span style={{ color: item.available_quantity === 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        {item.available_quantity}
                      </span>
                    </td>
                    <td>{item.value?.toLocaleString()}</td>
                    <td>{item.borrow_type === 'long_term' ? <span className="text-muted">No fine</span> : `${item.fine_rate_per_day} THB/day`}</td>
                    <td><span className={`badge badge-${item.condition}`}>{conditionLabel(item.condition)}</span></td>
                    <td>{item.location || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {equipment.length === 0 && (
                  <tr><td colSpan="12" style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No equipment found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Equipment' : 'Add New Equipment'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="error-msg">{error}</div>}
                <div className="form-row">
                  <div className="form-group">
                    <label>Equipment Name <span className="required">*</span></label>
                    <input type="text" required value={form.name} onChange={set('name')} placeholder="Equipment Name" />
                  </div>
                  <div className="form-group">
                    <label>Category <span className="required">*</span></label>
                    {!addingCategory ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select required value={form.category} onChange={set('category')} style={{ flex: 1, margin: 0 }}>
                          <option value="">-- Select Category --</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button type="button" onClick={() => { setAddingCategory(true); setNewCategory(''); }}
                          style={{ padding: '0 14px', borderRadius: 10, border: '1px dashed #6366f1', background: 'white', color: '#6366f1', fontWeight: 700, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>
                          +
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input autoFocus type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                          placeholder="New category name..." style={{ flex: 1, margin: 0 }} />
                        <button type="button"
                          onClick={() => {
                            const trimmed = newCategory.trim();
                            if (!trimmed) return;
                            if (!categories.includes(trimmed)) setCategories(c => [...c, trimmed]);
                            setForm(f => ({ ...f, category: trimmed }));
                            setAddingCategory(false);
                          }}
                          style={{ padding: '0 14px', borderRadius: 10, border: 'none', background: '#6366f1', color: 'white', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                          Add
                        </button>
                        <button type="button" onClick={() => setAddingCategory(false)}
                          style={{ padding: '0 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={form.description} onChange={set('description')} placeholder="Equipment description" rows={2} />
                </div>
                <div className="form-group">
                  <label>Equipment Image</label>
                  <ImageUploader
                    value={form.image_url}
                    onChange={url => setForm(f => ({ ...f, image_url: url }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Serial Number</label>
                    <input type="text" value={form.serial_number} onChange={set('serial_number')} placeholder="Optional" />
                  </div>
                  <div className="form-group">
                    <label>Storage Location</label>
                    <input type="text" value={form.location} onChange={set('location')} placeholder="Room / Building" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Borrow Type <span className="required">*</span></label>
                    <select value={form.borrow_type} onChange={set('borrow_type')} disabled={!!editItem}>
                      <option value="short_term">Short-Term (Return required)</option>
                      <option value="long_term">Long-Term Allocation (Permanent)</option>
                    </select>
                    {editItem && <div className="form-hint">Borrow type cannot be changed after creation</div>}
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <select value={form.condition} onChange={set('condition')}>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Quantity (pcs)</label>
                    <input type="number" min="1" value={form.total_quantity} onChange={set('total_quantity')} />
                  </div>
                  <div className="form-group">
                    <label>Replacement Value (THB)</label>
                    <input type="number" min="0" step="0.01" value={form.value} onChange={set('value')} placeholder="0.00" />
                  </div>
                </div>
                {form.borrow_type === 'short_term' && (
                  <div className="form-group">
                    <label>Late Fine (THB/day)</label>
                    <input type="number" min="0" step="0.01" value={form.fine_rate_per_day} onChange={set('fine_rate_per_day')} />
                    <div className="form-hint">Fine charged per day for late returns</div>
                  </div>
                )}
                {form.borrow_type === 'long_term' && (
                  <div className="alert alert-info">
                    Long-term equipment has no fine. Rate will be set to 0 automatically.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>x</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--gray-700)' }}>
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                Equipment with active borrows cannot be deleted.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Delete Equipment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
