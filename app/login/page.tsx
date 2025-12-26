'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthHeader from '@/components/AuthHeader';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/predictions';
  const registered = searchParams.get('registered');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
      <div className="mb-8">
        <h2 className="text-text-main-light dark:text-text-main-dark text-[28px] font-bold leading-tight tracking-[-0.015em] mb-2">
          Welcome Back
        </h2>
        <p className="text-text-muted-light dark:text-text-muted-dark text-base">
          Enter your details to access your dashboard.
        </p>
      </div>

      {registered && (
        <div className="alert-success mb-6">
          Registration successful! Please sign in with your credentials.
        </div>
      )}

      {error && (
        <div className="alert-error mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-text-main-light dark:text-text-main-dark text-sm font-medium leading-normal"
          >
            Email Address
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base"
              placeholder="name@example.com"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-light">
              <span className="material-symbols-outlined text-[20px]">mail</span>
            </div>
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-text-main-light dark:text-text-main-dark text-sm font-medium leading-normal"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-bg-dark text-text-main-light dark:text-text-main-dark focus:outline-0 focus:ring-2 focus:ring-primary/20 focus:border-primary h-12 px-4 pr-12 placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark text-base"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted-light hover:text-text-main-light dark:hover:text-text-main-dark transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="spinner mr-2"></span>
              Signing in...
            </>
          ) : (
            <>
              <span className="truncate">Sign In</span>
              <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-border-light dark:border-border-dark text-center">
        <p className="text-text-muted-light dark:text-text-muted-dark text-sm">
          New to the 2026 Predictor?{' '}
          <Link
            href="/register"
            className="text-primary font-bold hover:underline ml-1"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginFormFallback() {
  return (
    <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
      <div className="mb-8">
        <div className="h-8 w-48 bg-border-light dark:bg-border-dark rounded animate-pulse mb-2"></div>
        <div className="h-5 w-64 bg-border-light dark:bg-border-dark rounded animate-pulse"></div>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-5 w-24 bg-border-light dark:bg-border-dark rounded animate-pulse"></div>
          <div className="h-12 w-full bg-border-light dark:bg-border-dark rounded-lg animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 w-20 bg-border-light dark:bg-border-dark rounded animate-pulse"></div>
          <div className="h-12 w-full bg-border-light dark:bg-border-dark rounded-lg animate-pulse"></div>
        </div>
        <div className="h-12 w-full bg-border-light dark:bg-border-dark rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
      <AuthHeader />

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-5 dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#0995ec 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="w-full max-w-[1000px] bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px]">
          {/* Left Side: Hero Image/Branding */}
          <div className="hidden md:flex w-1/2 bg-primary/5 relative flex-col justify-between p-10 overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1200&q=80"
                alt="Football stadium atmosphere"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-primary/40 mix-blend-multiply"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center mb-6 border border-white/30 text-white">
                <span className="material-symbols-outlined">emoji_events</span>
              </div>
              <h1 className="text-white text-3xl font-bold leading-tight mb-3">
                Join the League
              </h1>
              <p className="text-white/80 text-base font-medium leading-relaxed max-w-sm">
                Predict every match of the 2026 World Cup. Compete with friends, climb the leaderboard, and prove your football knowledge.
              </p>
            </div>
          </div>

          {/* Right Side: Login Form */}
          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-text-muted-light dark:text-text-muted-dark text-xs">
        <p>&copy; 2026 World Cup Predictor League. All rights reserved.</p>
      </footer>
    </div>
  );
}
