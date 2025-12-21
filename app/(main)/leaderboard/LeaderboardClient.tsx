'use client';

import { useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  predictedCount: number;
  groupPoints: number;
  knockoutPoints: number;
  bonusMatchExact: number;
  bonusMatchPoints: number;
}

interface LeaderboardClientProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
  currentUserRole?: string;
  bonusMatchesCount: number;
}

type SortField = 'points' | 'exactScores' | 'name' | 'bonus';
type PhaseFilter = 'all' | 'group' | 'knockout';

export default function LeaderboardClient({
  leaderboard,
  currentUserId,
  currentUserRole,
  bonusMatchesCount,
}: LeaderboardClientProps) {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortAsc, setSortAsc] = useState(false);
  const [phase, setPhase] = useState<PhaseFilter>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name');
    }
  };

  const getPoints = (entry: LeaderboardEntry) => {
    if (phase === 'group') return entry.groupPoints;
    if (phase === 'knockout') return entry.knockoutPoints;
    return entry.totalPoints;
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'points':
        comparison = getPoints(b) - getPoints(a);
        break;
      case 'exactScores':
        comparison = b.exactScores - a.exactScores;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'bonus':
        comparison = b.bonusMatchPoints - a.bonusMatchPoints;
        break;
    }
    return sortAsc ? -comparison : comparison;
  });

  // Calculate ranks
  let currentRank = 0;
  let currentVal = -1;
  const rankedLeaderboard = sortedLeaderboard.map((entry, index) => {
    const val = getPoints(entry);
    if (val !== currentVal) {
      currentRank = index + 1;
      currentVal = val;
    }
    return { ...entry, rank: currentRank };
  });

  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Total Points', 'Exact Scores', 'Correct Results', 'Group Points', 'Knockout Points', 'Bonus Match Points', 'Bonus Exact', 'Predictions'];
    const rows = rankedLeaderboard.map(e => [
      e.rank,
      e.name,
      e.email,
      e.totalPoints,
      e.exactScores,
      e.correctResults,
      e.groupPoints,
      e.knockoutPoints,
      e.bonusMatchPoints,
      e.bonusMatchExact,
      `${e.predictedCount}/104`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      className="px-4 py-3 bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <span className="text-primary-500">{sortAsc ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Leaderboard
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Current standings for the prediction competition
          </p>
        </div>
        
        {currentUserRole === 'admin' && (
          <button
            id="export-csv"
            onClick={handleExportCSV}
            className="btn-secondary flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Filters and Stats */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Filter by Phase
          </label>
          <div className="flex space-x-2">
            {(['all', 'group', 'knockout'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  phase === p
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {p === 'all'
                  ? 'All Matches'
                  : p === 'group'
                  ? 'Group Stage'
                  : 'Knockout Stage'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-primary-600">
              {leaderboard.length}
            </p>
            <p className="text-xs text-slate-500">Participants</p>
          </div>
          <div className="card text-center py-4">
            <p className="text-2xl font-bold text-green-600">
              {leaderboard.reduce((sum, e) => sum + e.exactScores, 0)}
            </p>
            <p className="text-xs text-slate-500">Total Exact</p>
          </div>
          <div className="card text-center py-4 hidden md:block">
            <p className="text-2xl font-bold text-amber-600">
              {leaderboard[0] ? getPoints(leaderboard[0]) : 0}
            </p>
            <p className="text-xs text-slate-500">Top Score</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No participants yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200 w-20">
                    Rank
                  </th>
                  <SortHeader field="name">Name</SortHeader>
                  <SortHeader field="points">Points</SortHeader>
                  <SortHeader field="exactScores">Exact</SortHeader>
                  <SortHeader field="bonus">Bonus ⭐</SortHeader>
                  <th className="px-4 py-3 bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    Predictions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankedLeaderboard.map((entry) => (
                  <tr
                    key={entry.id}
                    className={
                      entry.id === currentUserId
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <span
                        className={`font-bold ${
                          entry.rank === 1
                            ? 'text-yellow-500'
                            : entry.rank === 2
                            ? 'text-slate-400'
                            : entry.rank === 3
                            ? 'text-amber-600'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {entry.rank === 1
                          ? '🥇'
                          : entry.rank === 2
                          ? '🥈'
                          : entry.rank === 3
                          ? '🥉'
                          : `#${entry.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <Link
                        href={`/leaderboard/${entry.id}`}
                        className="font-medium text-slate-900 dark:text-white hover:text-primary-600"
                      >
                        {entry.name}
                        {entry.id === currentUserId && (
                          <span className="ml-2 badge badge-info text-[10px] py-0 px-1">You</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-bold">
                      {getPoints(entry)}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-green-600 font-medium">
                        {entry.exactScores}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-amber-600 font-bold">
                          {entry.bonusMatchPoints} pts
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {entry.bonusMatchExact}/{bonusMatchesCount} exact
                        </span>
                      </div>
                      {entry.bonusMatchExact === bonusMatchesCount && bonusMatchesCount > 0 && (
                        <span className="inline-block mt-1 badge badge-warning text-[8px] py-0 px-1">Perfect Bonus!</span>
                      )}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                      {entry.predictedCount}/104
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
