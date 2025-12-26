import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Link from 'next/link';

async function getStats() {
  const [userCount, matchCount, predictionCount, completedMatches] = await Promise.all([
    prisma.user.count({ where: { role: 'user' } }),
    prisma.match.count(),
    prisma.prediction.count(),
    prisma.match.count({
      where: {
        realScoreHome: { not: null },
        realScoreAway: { not: null },
      },
    }),
  ]);

  return { userCount, matchCount, predictionCount, completedMatches };
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    redirect('/login');
  }

  const stats = await getStats();
  const completionPercent = stats.matchCount > 0 ? Math.round((stats.completedMatches / stats.matchCount) * 100) : 0;
  const avgPredictions = stats.userCount > 0 ? Math.round(stats.predictionCount / stats.userCount) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            World Cup 2026 Season - Overview & Controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium">System Active</span>
          </div>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Participants */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Participants</p>
            <span className="material-symbols-outlined text-primary">groups</span>
          </div>
          <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold">{stats.userCount}</p>
          <p className="text-xs text-slate-400">Active users</p>
        </div>

        {/* Matches Completed */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Matches Completed</p>
            <span className="material-symbols-outlined text-primary">sports_soccer</span>
          </div>
          <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold">
            {stats.completedMatches}<span className="text-lg text-slate-400 font-medium">/{stats.matchCount}</span>
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${completionPercent}%` }}></div>
          </div>
        </div>

        {/* Total Predictions */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Predictions</p>
            <span className="material-symbols-outlined text-primary">pending_actions</span>
          </div>
          <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold">{stats.predictionCount}</p>
          <p className="text-xs text-slate-400">Across all users</p>
        </div>

        {/* Avg Predictions */}
        <div className="flex flex-col gap-2 rounded-xl p-6 bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Avg Per User</p>
            <span className="material-symbols-outlined text-primary">analytics</span>
          </div>
          <p className="text-slate-900 dark:text-white tracking-tight text-3xl font-bold">{avgPredictions}</p>
          <p className="text-xs text-slate-400">Predictions/user</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4 mb-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Enter Results */}
          <Link
            href="/admin/matches"
            className="group flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark hover:border-primary hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">edit_square</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Enter Match Results</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Input final scores for completed matches</p>
            </div>
          </Link>

          {/* Manage Users */}
          <Link
            href="/admin/users"
            className="group flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark hover:border-primary hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">group</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Manage Users</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View users and reset passwords</p>
            </div>
          </Link>

          {/* Settings */}
          <Link
            href="/admin/settings"
            className="group flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark hover:border-primary hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 dark:text-white">Tournament Settings</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deadline, bonus matches, teams</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Tournament Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Group Stage</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {Math.min(stats.completedMatches, 48)}/48
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (Math.min(stats.completedMatches, 48) / 48) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Knockout Stage</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {Math.max(0, stats.completedMatches - 48)}/16
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (Math.max(0, stats.completedMatches - 48) / 16) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Overall</span>
              <span className="font-medium text-slate-900 dark:text-white">{completionPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${completionPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
