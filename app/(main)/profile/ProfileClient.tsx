'use client';

import { useState } from 'react';

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your account and view your statistics
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* User Info */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500">Name</label>
              <p className="text-lg text-slate-900 dark:text-white">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Email</label>
              <p className="text-lg text-slate-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500">Member since</label>
              <p className="text-lg text-slate-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Statistics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-3xl font-bold text-primary-600">{stats.totalPoints}</p>
              <p className="text-sm text-slate-500">Total Points</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.exactScores}</p>
              <p className="text-sm text-slate-500">Exact Scores</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">{stats.correctResults}</p>
              <p className="text-sm text-slate-500">Correct Results</p>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-3xl font-bold text-slate-600 dark:text-slate-300">
                {stats.accuracy}%
              </p>
              <p className="text-sm text-slate-500">Accuracy</p>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-slate-500">
            {stats.totalPredictions}/104 matches predicted
          </div>
        </div>

        {/* Change Password */}
        <div className="card md:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Change Password
          </h2>

          {message && (
            <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
              {message.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input w-full mt-1"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input w-full mt-1"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input w-full mt-1"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <span className="spinner mr-2"></span>
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
