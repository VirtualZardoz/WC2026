'use client';

import { useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Stats {
  totalPredictions: number;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  matchesWithResults: number;
  accuracy: number;
}

interface ProfileClientProps {
  user: User;
  stats: Stats;
}

export default function ProfileClient({ user, stats }: ProfileClientProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
        return;
      }

      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="max-w-[960px] mx-auto w-full px-4 md:px-10 py-8">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/"
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium leading-normal flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">home</span> Home
        </Link>
        <span className="text-slate-400 text-sm font-medium leading-normal">/</span>
        <span className="text-slate-900 dark:text-white text-sm font-medium leading-normal">Profile</span>
      </div>

      {/* Page Heading */}
      <div className="flex flex-wrap justify-between gap-3 mb-6">
        <h1 className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
          My Profile
        </h1>
      </div>

      {/* Profile Header Card */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl font-bold text-white shadow-lg ring-4 ring-slate-50 dark:ring-slate-800">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col justify-center gap-1">
              <h3 className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">
                {user.name || 'User'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-base">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="material-symbols-outlined text-slate-400 text-[18px]">calendar_month</span>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  Predictor since: {memberSince}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Points (Primary Emphasis) */}
        <div className="flex flex-col justify-between gap-2 rounded-xl p-6 bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start">
            <p className="text-white/90 text-sm font-semibold uppercase tracking-wider">Total Points</p>
            <span className="material-symbols-outlined text-white/80">emoji_events</span>
          </div>
          <div>
            <p className="text-4xl font-black leading-tight tracking-tight">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-white/80 mt-1 font-medium">
              {stats.totalPredictions}/134 matches predicted
            </p>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col justify-between gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Accuracy</p>
            <span className="material-symbols-outlined text-green-500">percent</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">{stats.accuracy}%</p>
          </div>
        </div>

        {/* Exact Scores */}
        <div className="flex flex-col justify-between gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Exact Scores</p>
            <span className="material-symbols-outlined text-purple-500 bg-purple-50 dark:bg-purple-900/20 p-1.5 rounded-full text-[20px]">target</span>
          </div>
          <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">{stats.exactScores}</p>
        </div>

        {/* Correct Results */}
        <div className="flex flex-col justify-between gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Correct Results</p>
            <span className="material-symbols-outlined text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded-full text-[20px]">check_circle</span>
          </div>
          <p className="text-slate-900 dark:text-white text-3xl font-bold leading-tight">{stats.correctResults}</p>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">lock</span>
            Security
          </h3>
        </div>
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-slate-900 dark:text-white">Change Password</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Ensure your account is secure by using a long, random password.
              </p>
            </div>

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-5 w-full max-w-md">
              {message && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  <span className="material-symbols-outlined text-lg">
                    {message.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  {message.text}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="current-password">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm p-3 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    id="current-password"
                    placeholder="Enter current password"
                    type={showCurrentPwd ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showCurrentPwd ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm p-3 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    id="new-password"
                    placeholder="Enter new password"
                    type={showNewPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNewPwd ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm p-3 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    id="confirm-password"
                    placeholder="Confirm new password"
                    type={showConfirmPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPwd ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
