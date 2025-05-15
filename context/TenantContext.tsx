import React, { createContext, useContext, useState } from 'react';

export interface Tenant {
  id: string;
  name: string;
  isPrivate: boolean;
  joinCode: string | null;
  coordinatorEmail: string;
  coordinatorFirstName: string;
  coordinatorLastName: string;
}


interface TenantContextProps {
  tenants: Tenant[];
  addTenant: (tenantData: Omit<Tenant, 'id'>) => void;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  console.log('Current tenants state:', tenants);

  const addTenant = (newTenantData: Omit<Tenant, 'id'>) => {
    const newTenant: Tenant = { id: Math.random().toString(36).substring(7), ...newTenantData };
    console.log('Adding tenant:', newTenant);
    setTenants([...tenants, newTenant]);
  };

  return (
    <TenantContext.Provider value={{ tenants, addTenant }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
};