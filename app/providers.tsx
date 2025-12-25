'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import InactivityMonitor from '@/components/InactivityMonitor';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <InactivityMonitor />
      {children}
    </SessionProvider>
  );
}
