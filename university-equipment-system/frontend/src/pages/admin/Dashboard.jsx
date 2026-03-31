import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import api from '../../services/api';

// Floating background orbs with mouse repulsion
function BackgroundCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const particles = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#6366f1','#8b5cf6','#3b82f6','#10b981','#f59e0b','#ec4899','#06b6d4','#a855f7'];
    particles.current = Array.from({ length: 22 }, (_, i) => {
      const ox = Math.random() * window.innerWidth;
      const oy = Math.random() * window.innerHeight;
      return {
        x: ox, y: oy, ox, oy,
        r: Math.random() * 70 + 25,
        color: colors[i % colors.length],
        vx: 0, vy: 0,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach(p => {
        const dx = p.x - mouse.current.x;
        const dy = p.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // repulsion from mouse
        if (dist < 220 && dist > 0) {
          const force = ((220 - dist) / 220) * 0.6;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        // spring back to home
        p.vx += (p.ox - p.x) * 0.025;
        p.vy += (p.oy - p.y) * 0.025;

        p.vx *= 0.88;
        p.vy *= 0.88;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 2.5) { p.vx = (p.vx / speed) * 2.5; p.vy = (p.vy / speed) * 2.5; }
        p.x += p.vx;
        p.y += p.vy;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, p.color + '28');
        grad.addColorStop(1, p.color + '00');
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    const onMouse = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', top: 0, left: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

// Animated number counter
function Counter({ value, duration = 1.2 }) {
  const ref = useRef(null);
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    return spring.on('change', v => setDisplay(Math.round(v)));
  }, [spring]);

  return <span ref={ref}>{display}</span>;
}

const I = {
  grid:     <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  clock:    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  calendar: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  check:    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  hourglass:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/></svg>,
  box:      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  lock:     <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  alert:    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  checkCircle:<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  xCircle:  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
};

const STAT_CARDS = {
  equipment: [
    { key: 'total',            label: 'Total Types',      sub: v => `${v.total_units} units total`,  gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)', icon: I.grid },
    { key: 'short_term_count', label: 'Short-Term',       sub: () => 'Must be returned',             gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', icon: I.clock },
    { key: 'long_term_count',  label: 'Long-Term',        sub: () => 'Permanent allocation',         gradient: 'linear-gradient(135deg,#a855f7,#ec4899)', icon: I.calendar },
    { key: 'available_units',  label: 'Available Units',  sub: () => 'Ready to borrow',              gradient: 'linear-gradient(135deg,#10b981,#34d399)', icon: I.check },
  ],
  borrows: [
    { key: 'pending',          label: 'Pending',          sub: () => 'Awaiting approval',            gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)', icon: I.hourglass },
    { key: 'active',           label: 'Active Borrows',   sub: () => 'Currently in use',             gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', icon: I.box },
    { key: 'long_term_active', label: 'Long-Term Active', sub: () => 'Permanent allocations',        gradient: 'linear-gradient(135deg,#8b5cf6,#a855f7)', icon: I.lock },
    { key: 'overdue',          label: 'Overdue',          sub: () => 'Past due date',                gradient: 'linear-gradient(135deg,#ef4444,#f97316)', icon: I.alert },
    { key: 'returned',         label: 'Returned',         sub: () => 'Completed',                    gradient: 'linear-gradient(135deg,#10b981,#14b8a6)', icon: I.checkCircle },
    { key: 'lost',             label: 'Lost',             sub: () => 'Reported missing',             gradient: 'linear-gradient(135deg,#6b7280,#9ca3af)', icon: I.xCircle },
  ],
};

function StatCard({ label, value, sub, gradient, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -8, scale: 1.03, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: gradient, borderRadius: 20, padding: '22px 20px',
        color: 'white', position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', cursor: 'default',
      }}
    >
      {/* Glow bubble */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 90, height: 90, borderRadius: '50%',
        background: 'rgba(255,255,255,0.15)',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, left: -10,
        width: 70, height: 70, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />

      <div style={{ marginBottom: 10, opacity: 0.9 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>
        <Counter value={value} />
      </div>
      <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 500 }}>{sub}</div>
    </motion.div>
  );
}

function BarChart({ data, valueKey, labelKey, color = '#6366f1' }) {
  if (!data || data.length === 0) return <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 20 }}>No data available</p>;
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 90, fontSize: 12, color: '#6b7280', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item[labelKey]}</div>
          <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%` }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: 'easeOut' }}
              style={{ height: '100%', background: color, borderRadius: 99 }}
            />
          </div>
          <div style={{ width: 28, fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>{item[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : '-';

  if (loading) return (
    <div className="loading">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
        <div className="loading-spinner" />
      </motion.div>
      <p>Loading dashboard...</p>
    </div>
  );
  if (!data) return <div className="error-msg">Failed to load dashboard data.</div>;

  const { equipment, borrows, fines, users, overdue_list, pending_approvals, category_breakdown, recent_activity } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ position: 'relative', zIndex: 1 }}>
      <BackgroundCanvas />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>Admin Dashboard</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>System overview and statistics</p>
      </motion.div>

      {/* Pending alert */}
      <AnimatePresence>
        {pending_approvals > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{
              marginBottom: 24, padding: '14px 20px', borderRadius: 16,
              background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
              border: '1px solid #fbbf24', display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 4px 16px rgba(251,191,36,0.25)',
            }}>
            <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </motion.span>
            <span style={{ flex: 1, fontWeight: 600, color: '#92400e' }}>
              <strong>{pending_approvals}</strong> borrow requests are pending approval
            </span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/approvals')}
              style={{ padding: '7px 18px', borderRadius: 20, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Review Now →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Equipment Overview */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14 }}>
        Equipment Overview
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {STAT_CARDS.equipment.map((c, i) => (
          <StatCard key={c.key} delay={i * 0.08}
            label={c.label} value={equipment[c.key]} sub={c.sub(equipment)}
            gradient={c.gradient} icon={c.icon} />
        ))}
      </div>

      {/* Borrow Statistics */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 14 }}>
        Borrow Statistics
      </motion.div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {STAT_CARDS.borrows.map((c, i) => (
          <StatCard key={c.key} delay={0.3 + i * 0.07}
            label={c.label} value={borrows[c.key]} sub={c.sub()}
            gradient={c.gradient} icon={c.icon} />
        ))}
      </div>

      {/* Fine + User */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
          style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>Fine Summary</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[
                    { name: 'Outstanding', value: fines.pending_total || 0 },
                    { name: 'Collected', value: fines.paid_total || 0 },
                  ]} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={4} dataKey="value" animationBegin={300} animationDuration={1000}>
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                  <Tooltip formatter={v => `${v.toFixed(2)} THB`} />
                  <Legend iconType="circle" iconSize={9} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 130 }}>
              <motion.div whileHover={{ scale: 1.04 }} style={{ padding: '12px 14px', background: '#fef2f2', borderRadius: 14, cursor: 'default' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Outstanding</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444', marginTop: 2 }}>{fines.pending_total.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#ef4444', opacity: 0.7 }}>{fines.pending_count} records</div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} style={{ padding: '12px 14px', background: '#f0fdf4', borderRadius: 14, cursor: 'default' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Collected</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 2 }}>{fines.paid_total.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#10b981', opacity: 0.7 }}>THB paid</div>
              </motion.div>
              <div style={{ padding: '8px 14px', background: '#f9fafb', borderRadius: 12, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                Total <strong style={{ color: '#1f2937' }}>{fines.grand_total.toFixed(2)}</strong> THB
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
          style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>User Statistics</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Total', value: users.total, bg: '#ede9fe', color: '#6366f1' },
              { label: 'Students', value: users.students, bg: '#dcfce7', color: '#10b981' },
              { label: 'Staff', value: users.staff, bg: '#fef3c7', color: '#f59e0b' },
            ].map((u, i) => (
              <motion.div key={i} whileHover={{ scale: 1.06, y: -3 }}
                style={{ flex: 1, textAlign: 'center', padding: '12px 6px', background: u.bg, borderRadius: 14, cursor: 'default' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: u.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{u.label}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: u.color, marginTop: 2 }}><Counter value={u.value || 0} /></div>
              </motion.div>
            ))}
          </div>
          <div style={{ height: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={[
                { name: 'Students', value: users.students || 0 },
                { name: 'Staff', value: users.staff || 0 },
              ]} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} animationDuration={1000} animationBegin={400}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Category Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {[
          { title: 'Equipment by Category', data: category_breakdown, valueKey: 'total_units', color: '#6366f1' },
          { title: 'Currently Borrowed', data: category_breakdown.filter(c => c.borrowed_units > 0), valueKey: 'borrowed_units', color: '#10b981' },
        ].map((chart, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
            style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>{chart.title}</div>
            <BarChart data={chart.data} labelKey="category" valueKey={chart.valueKey} color={chart.color} />
          </motion.div>
        ))}
      </div>

      {/* Overdue table */}
      {overdue_list.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ background: 'white', borderRadius: 20, overflow: 'hidden', marginBottom: 24, boxShadow: '0 4px 20px rgba(239,68,68,0.1)', border: '1px solid #fecaca' }}>
          <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg,#fee2e2,#fecaca)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 15 }}>Overdue Items</div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/approvals')}
              style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Manage All
            </motion.button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Borrower</th><th>Student ID</th><th>Equipment</th>
                  <th>Due Date</th><th>Days Overdue</th><th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {overdue_list.map((item, i) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.85 + i * 0.05 }} style={{ background: '#fff5f5' }}>
                    <td className="col-name">{item.user_name}</td>
                    <td>{item.student_id || '-'}</td>
                    <td>{item.equipment_name}</td>
                    <td style={{ color: '#ef4444', fontWeight: 600 }}>{formatDate(item.due_date)}</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>{item.days_overdue} days</td>
                    <td style={{ color: '#ef4444', fontWeight: 700 }}>{(item.days_overdue * item.fine_rate_per_day).toFixed(2)} THB</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Activity chart */}
      {recent_activity.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          style={{ background: 'white', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6', marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>Borrow Requests — Last 30 Days</div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recent_activity}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#colorCount)" animationDuration={1200} dot={{ fill: '#6366f1', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
