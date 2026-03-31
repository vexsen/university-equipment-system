import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { pageTransition, staggerContainer, cardItem, fadeUp } from '../../utils/animations';

const CATEGORY_STYLE = {
  'Laptop': { bg: '#E3F2FD', color: '#1565C0', icon: '💻' },
  'Monitor': { bg: '#E8EAF6', color: '#283593', icon: '🖥️' },
  'Camera': { bg: '#F3E5F5', color: '#6A1B9A', icon: '📷' },
  'Calculator': { bg: '#E8F5E9', color: '#2E7D32', icon: '🔢' },
  'Safety Equipment': { bg: '#FFF3E0', color: '#E65100', icon: '🥽' },
  'Lab Equipment': { bg: '#E0F7FA', color: '#00695C', icon: '🔬' },
  'AV Equipment': { bg: '#FCE4EC', color: '#880E4F', icon: '📽️' },
  'Printer': { bg: '#ECEFF1', color: '#37474F', icon: '🖨️' },
  'Furniture': { bg: '#FBE9E7', color: '#BF360C', icon: '🪑' },
  'Networking': { bg: '#E0F2F1', color: '#004D40', icon: '🌐' },
  'Computer': { bg: '#E3F2FD', color: '#0D47A1', icon: '🖥️' },
};

function EquipmentImage({ item }) {
  const [imgError, setImgError] = useState(false);
  const style = CATEGORY_STYLE[item.category] || { bg: '#F5F5F5', color: '#616161', icon: '📦' };

  if (item.image_url && !imgError) {
    return (
      <div style={{ width: '100%', height: 180, position: 'relative', overflow: 'hidden', background: '#f0f0f0' }}>
        <img
          src={item.image_url}
          alt={item.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: 180,
      background: `linear-gradient(135deg, ${style.bg}, ${style.bg}cc)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 48 }}>{style.icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: style.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {item.category}
      </span>
    </div>
  );
}

function AvailabilityBadge({ item }) {
  if (item.borrow_type === 'long_term') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#8E24AA', background: '#F3E5F5', padding: '3px 10px', borderRadius: 20 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8E24AA', display: 'inline-block' }} />
        Long-Term Allocation
      </span>
    );
  }
  if (item.available_quantity > 0) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#2E7D32', background: '#E8F5E9', padding: '3px 10px', borderRadius: 20 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#43A047', display: 'inline-block' }} />
        {item.available_quantity} available
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#C62828', background: '#FFEBEE', padding: '3px 10px', borderRadius: 20 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E53935', display: 'inline-block' }} />
      Unavailable
    </span>
  );
}

export default function SearchEquipment() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [borrowType, setBorrowType] = useState('');
  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/equipment/categories');
      setCategories(res.data);
    } catch {}
  }, []);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (borrowType) params.borrow_type = borrowType;
      const res = await api.get('/equipment', { params });
      setEquipment(res.data.equipment);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, borrowType]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => {
    const t = setTimeout(fetchEquipment, 300);
    return () => clearTimeout(t);
  }, [fetchEquipment]);

  const isDisabled = (item) => item.borrow_type === 'short_term' && item.available_quantity === 0;

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="show">
      <div className="page-header">
        <h2>Browse Equipment</h2>
        <p>Browse and request available equipment</p>
      </div>

      {/* Search & Filter */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', padding: '16px 20px', marginBottom: 24, boxShadow: 'var(--shadow)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 220px', position: 'relative' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--gray-400)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text" placeholder="Search equipment name..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 38, margin: 0 }}
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto', minWidth: 150, margin: 0 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={borrowType} onChange={e => setBorrowType(e.target.value)} style={{ width: 'auto', minWidth: 140, margin: 0 }}>
          <option value="">All Types</option>
          <option value="short_term">Short-Term Borrow</option>
          <option value="long_term">Long-Term Allocation</option>
        </select>
        {(search || category || borrowType) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setCategory(''); setBorrowType(''); }}>
            Clear Filters
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" variants={fadeUp} initial="hidden" animate="show" className="loading">
          <div className="loading-spinner" /><p>Loading...</p>
        </motion.div>
      ) : equipment.length === 0 ? (
        <motion.div key="empty" variants={fadeUp} initial="hidden" animate="show" style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 6 }}>No Equipment Found</h4>
          <p style={{ fontSize: 13, color: 'var(--gray-400)' }}>Try adjusting your search filters</p>
        </motion.div>
      ) : (
        <motion.div key="results" variants={fadeUp} initial="hidden" animate="show">
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 14 }}>
            Found <strong style={{ color: 'var(--gray-800)' }}>{equipment.length}</strong> results
          </div>
          <motion.div
            variants={staggerContainer} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}
          >
            {equipment.map((item) => {
              const style = CATEGORY_STYLE[item.category] || { bg: '#F5F5F5', color: '#616161' };
              const disabled = isDisabled(item);
              return (
                <motion.div key={item.id} variants={cardItem}
                  whileHover={!disabled ? { y: -6, scale: 1.02, boxShadow: '0 12px 32px rgba(0,0,0,0.13)' } : {}}
                  whileTap={!disabled ? { scale: 0.98 } : {}}
                  style={{
                    background: 'white', borderRadius: 16,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: 'var(--shadow)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    opacity: disabled ? 0.7 : 1,
                  }}
                >
                  {/* Image */}
                  <div style={{ position: 'relative' }}>
                    <EquipmentImage item={item} />
                    {/* Category chip overlay */}
                    <div style={{
                      position: 'absolute', top: 10, left: 10,
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 700,
                      color: style.color,
                      letterSpacing: '0.04em',
                    }}>
                      {item.category}
                    </div>
                    {/* Borrow type badge */}
                    {item.borrow_type === 'long_term' && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        background: '#8E24AA', color: 'white',
                        padding: '3px 8px', borderRadius: 20,
                        fontSize: 10, fontWeight: 700,
                      }}>
                        Long-Term
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3, margin: 0 }}>
                      {item.name}
                    </h4>
                    {item.description && (
                      <p style={{ fontSize: 12.5, color: 'var(--gray-500)', margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {item.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13, flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {item.location}
                        </div>
                      )}
                      {item.borrow_type === 'short_term' && item.fine_rate_per_day > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-500)' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          Fine {item.fine_rate_per_day} THB/day
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <AvailabilityBadge item={item} />
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={disabled}
                      onClick={() => navigate(`/user/borrow/${item.id}`)}
                      style={{ flexShrink: 0, borderRadius: 20 }}
                    >
                      Request
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
