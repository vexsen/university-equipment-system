import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const UserBorrowContext = createContext({ userPendingCount: 0, refreshUserPending: () => {} });

export function UserBorrowProvider({ children }) {
  const [userPendingCount, setUserPendingCount] = useState(0);

  const refreshUserPending = useCallback(() => {
    api.get('/borrows?status=pending&limit=1000')
      .then(res => setUserPendingCount(res.data.length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshUserPending();
    const interval = setInterval(refreshUserPending, 5000);
    return () => clearInterval(interval);
  }, [refreshUserPending]);

  return (
    <UserBorrowContext.Provider value={{ userPendingCount, refreshUserPending }}>
      {children}
    </UserBorrowContext.Provider>
  );
}

export const useUserBorrow = () => useContext(UserBorrowContext);
