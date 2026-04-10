import React from 'react';
import GlobalHeader from '../navigation/GlobalHeader';

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <GlobalHeader />
      <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
