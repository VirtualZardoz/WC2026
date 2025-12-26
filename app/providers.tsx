'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import InactivityMonitor from '@/components/InactivityMonitor';
import { ThemeProvider } from '@/components/ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <InactivityMonitor />
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
