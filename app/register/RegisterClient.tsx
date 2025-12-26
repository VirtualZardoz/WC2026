'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '@/components/AuthHeader';

export default function RegisterClient() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Redirect to login with success message
      router.push('/login?registered=true');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
      <AuthHeader />

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#0995ec 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Registration Card */}
        <div className="relative z-10 w-full max-w-[520px]">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden">
            {/* Header Section */}
            <div className="px-8 pt-10 pb-6 flex flex-col items-center">
              {/* Logo Icon */}
              <div className="mb-5 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[32px]">sports_soccer</span>
              </div>
              <h2 className="text-text-main-light dark:text-text-main-dark text-3xl font-black leading-tight tracking-[-0.033em] text-center">
                Create your account
              </h2>
              <p className="text-text-muted-light dark:text-text-muted-dark text-base font-normal leading-normal text-center mt-2 max-w-sm">
                Join the competition and predict the World Cup 2026 matches.
              </p>
            </div>

            {/* Form Section */}
            <div className="px-8 pb-10">
              {error && (
                <div className="alert-error mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Full Name */}
                <div className="flex flex-col">
                  <label
                    htmlFor="name"
                    className="text-text-main-light dark:text-text-main-dark text-sm font-semibold leading-normal pb-2"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base transition-colors"
                    placeholder="Lionel Messi"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col">
                  <label
                    htmlFor="email"
                    className="text-text-main-light dark:text-text-main-dark text-sm font-semibold leading-normal pb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base transition-colors"
                    placeholder="name@example.com"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col">
                  <label
                    htmlFor="password"
                    className="text-text-main-light dark:text-text-main-dark text-sm font-semibold leading-normal pb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 pr-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base transition-colors"
                      placeholder="Create a password (min. 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-text-muted-light hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col">
                  <label
                    htmlFor="confirmPassword"
                    className="text-text-main-light dark:text-text-main-dark text-sm font-semibold leading-normal pb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 pr-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base transition-colors"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-text-muted-light hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <>
                      <span className="spinner mr-2"></span>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-border-light dark:border-border-dark text-center">
                <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-primary font-bold hover:underline ml-1"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
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
