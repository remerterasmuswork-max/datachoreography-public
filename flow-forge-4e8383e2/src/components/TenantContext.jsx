/**
 * TenantContext: Session-scoped tenant isolation
 * Fixes global cache race condition
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/api/entities';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const [tenantId, setTenantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTenant();
  }, []);

  const loadTenant = async () => {
    try {
      const user = await User.me();
      const tid = user.tenant_id || user.email.split('@')[1] || user.id;
      setTenantId(tid);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const clearTenant = () => {
    setTenantId(null);
  };

  return (
    <TenantContext.Provider value={{ tenantId, loading, error, clearTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}

export default TenantContext;