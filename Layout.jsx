
import React from 'react';
import Navigation from './components/Navigation';
import { TenantProvider } from './components/TenantContext';

export default function Layout({ children, currentPageName }) {
  const showNav = !currentPageName.includes('Onboarding');

  return (
    <TenantProvider>
      <div className="flex min-h-screen bg-gray-50">
        {showNav && <Navigation />}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </TenantProvider>
  );
}
