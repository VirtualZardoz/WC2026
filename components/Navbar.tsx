'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            <Link
              href="/"
              className="flex items-center text-xl font-bold text-primary-600"
            >
              <span className="mr-2">⚽</span>
              WC 2026
            </Link>

            {session && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                <NavLink href="/predictions">Predictions</NavLink>
                <NavLink href="/leaderboard">Leaderboard</NavLink>
                <NavLink href="/results">Results</NavLink>
                {isAdmin && (
                  <NavLink href="/admin" className="text-amber-600">
                    Admin
                  </NavLink>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {session ? (
              <>
                <Link
                  href="/profile"
                  className="text-slate-600 dark:text-slate-300 hover:text-primary-600"
                >
                  {session.user?.name}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {session && (
              <>
                <MobileNavLink href="/predictions">Predictions</MobileNavLink>
                <MobileNavLink href="/leaderboard">Leaderboard</MobileNavLink>
                <MobileNavLink href="/results">Results</MobileNavLink>
                <MobileNavLink href="/profile">Profile</MobileNavLink>
                {isAdmin && (
                  <MobileNavLink href="/admin">Admin</MobileNavLink>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            )}
            {!session && (
              <>
                <MobileNavLink href="/login">Login</MobileNavLink>
                <MobileNavLink href="/register">Register</MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md ${className}`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-base font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-700"
    >
      {children}
    </Link>
  );
}
