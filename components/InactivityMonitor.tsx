'use client';

import { useEffect, useCallback, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';

// Inactivity timeout in milliseconds (30 minutes)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;
// Warning before logout (5 minutes)
const WARNING_BEFORE_LOGOUT = 5 * 60 * 1000;

export default function InactivityMonitor() {
  const { data: session } = useSession();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const logout = useCallback(() => {
    signOut({ callbackUrl: '/login?reason=inactivity' });
  }, []);

  const showWarning = useCallback(() => {
    if (warningShownRef.current) return;
    warningShownRef.current = true;

    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('Session Expiring', {
        body: 'You will be logged out in 5 minutes due to inactivity.',
        icon: '/favicon.ico',
      });
    }

    // Also show an alert as fallback
    const stayLoggedIn = window.confirm(
      'You will be logged out in 5 minutes due to inactivity.\n\nClick OK to stay logged in.'
    );

    if (stayLoggedIn) {
      resetTimer();
    }
  }, []);

  const resetTimer = useCallback(() => {
    warningShownRef.current = false;

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Set warning timer
    warningRef.current = setTimeout(() => {
      showWarning();
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_LOGOUT);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [logout, showWarning]);

  useEffect(() => {
    // Only run if user is logged in
    if (!session) return;

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [session, resetTimer]);

  // This component doesn't render anything
  return null;
}
