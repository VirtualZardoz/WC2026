import { isRegistrationEnabled } from '@/lib/feature-flags';
import RegisterClient from './RegisterClient';
import Link from 'next/link';
import AuthHeader from '@/components/AuthHeader';

export default async function RegisterPage() {
  const enabled = await isRegistrationEnabled();

  if (!enabled) {
    return (
      <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
        <AuthHeader />

        <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#0995ec 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 w-full max-w-[520px]">
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden p-8 text-center">
              <div className="mb-5 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500 mx-auto">
                <span className="material-symbols-outlined text-[32px]">lock</span>
              </div>
              <h1 className="text-2xl font-bold text-text-main-light dark:text-text-main-dark">
                Registration Closed
              </h1>
              <p className="text-text-muted-light dark:text-text-muted-dark mt-4">
                New user registration is currently disabled by the administrator.
              </p>
              <div className="mt-8">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold transition-colors shadow-md shadow-primary/20"
                >
                  <span>Back to Login</span>
                  <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-text-muted-light dark:text-text-muted-dark text-xs">
          <p>&copy; 2026 World Cup Predictor League. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return <RegisterClient />;
}
