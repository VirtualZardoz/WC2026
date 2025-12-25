import { isRegistrationEnabled } from '@/lib/feature-flags';
import RegisterClient from './RegisterClient';
import Link from 'next/link';

export default async function RegisterPage() {
  const enabled = await isRegistrationEnabled();

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl text-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Registration Closed
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-4">
              New user registration is currently disabled by the administrator.
            </p>
          </div>
          <div className="mt-8">
            <Link
              href="/login"
              className="btn-primary w-full block text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <RegisterClient />;
}
