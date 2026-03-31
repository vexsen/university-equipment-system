import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const PendingCountContext = createContext({ pendingCount: 0, overdueCount: 0, refreshPendingCount: () => {} });

export function PendingCountProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);

  const refreshPendingCount = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      api.get('/borrows/all?status=pending&limit=1000'),
      api.get('/borrows/all?status=borrowing&limit=1000'),
    ]).then(([pendingRes, borrowingRes]) => {
      setPendingCount(pendingRes.data.length);
      const overdue = borrowingRes.data.filter(b => b.due_date && b.due_date < today).length;
      setOverdueCount(overdue);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 30000);
    return () => clearInterval(interval);
  }, [refreshPendingCount]);

  return (
    <PendingCountContext.Provider value={{ pendingCount, overdueCount, refreshPendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
}

export const usePendingCount = () => useContext(PendingCountContext);
