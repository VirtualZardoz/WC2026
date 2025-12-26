'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeProvider';

export default function AuthHeader() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-border-light dark:border-border-dark px-6 lg:px-10 py-3 bg-surface-light dark:bg-surface-dark">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined !text-[32px]">sports_soccer</span>
        </div>
        <h2 className="text-text-main-light dark:text-text-main-dark text-lg font-bold leading-tight tracking-[-0.015em]">
          World Cup 2026 Predictor
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="hidden sm:inline text-sm font-medium text-text-main-light dark:text-text-main-dark">
          {isLoginPage ? "Don't have an account?" : 'Already have an account?'}
        </span>
        <Link
          href={isLoginPage ? '/register' : '/login'}
          className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-9 px-4 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold leading-normal tracking-[0.015em] transition-colors"
        >
          <span className="truncate">{isLoginPage ? 'Sign Up' : 'Sign In'}</span>
        </Link>
      </div>
    </header>
  );
}
