'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { ThemeToggle } from './ThemeProvider';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/predictions', label: 'Predictions', icon: 'sports_soccer' },
  { href: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { href: '/results', label: 'Results', icon: 'scoreboard' },
  { href: '/profile', label: 'Profile', icon: 'person' },
];

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard', adminOnly: true },
  { href: '/admin/matches', label: 'Matches', icon: 'edit_calendar', adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: 'settings', adminOnly: true },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-full bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">sports_soccer</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-main-light dark:text-text-main-dark">
            WC 2026
          </h1>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-1 px-4 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
            >
              {item.label}
            </NavLink>
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                  Admin
                </span>
              </div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  active={isActive(item.href)}
                >
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border-light dark:border-border-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-text-main-light dark:text-text-main-dark truncate">
                {session?.user?.name || 'User'}
              </span>
              <span className="text-xs text-text-muted-light dark:text-text-muted-dark">
                {isAdmin ? 'Administrator' : 'Predictor'}
              </span>
            </div>
            <ThemeToggle />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">sports_soccer</span>
          <h2 className="font-bold text-lg text-text-main-light dark:text-text-main-dark">
            WC 2026
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-text-muted-light dark:text-text-muted-dark hover:text-text-main-light dark:hover:text-text-main-dark"
          >
            <span className="material-symbols-outlined">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-[57px] right-0 w-64 h-[calc(100vh-57px)] bg-surface-light dark:bg-surface-dark border-l border-border-light dark:border-border-dark z-50 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="mt-4 mb-2 px-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted-light dark:text-text-muted-dark">
                  Admin
                </span>
              </div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  active={isActive(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </>
          )}

          <div className="mt-auto pt-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}

function NavLink({
  href,
  icon,
  active,
  children,
  onClick,
}: {
  href: string;
  icon: string;
  active: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'text-text-muted-light dark:text-text-muted-dark hover:bg-bg-light dark:hover:bg-surface-dark-alt hover:text-text-main-light dark:hover:text-text-main-dark'
      }`}
    >
      <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>
        {icon}
      </span>
      <span className="font-medium">{children}</span>
    </Link>
  );
}
