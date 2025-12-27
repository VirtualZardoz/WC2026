'use client';

import { useState, useMemo } from 'react';
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
type PhaseFilter = 'all' | 'group' | 'knockout' | 'bonus';

export default function LeaderboardClient({
  leaderboard,
  currentUserId,
  currentUserRole,
  bonusMatchesCount,
}: LeaderboardClientProps) {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortAsc, setSortAsc] = useState(false);
  const [phase, setPhase] = useState<PhaseFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

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
    if (phase === 'bonus') return entry.bonusMatchPoints;
    return entry.totalPoints;
  };

  // Calculate ranks FIRST based on points (before any user sorting)
  const pointsSortedLeaderboard = [...leaderboard].sort((a, b) => getPoints(b) - getPoints(a));
  let currentRank = 0;
  let currentVal = -1;
  const rankMap = new Map<string, number>();
  pointsSortedLeaderboard.forEach((entry, index) => {
    const val = getPoints(entry);
    if (val !== currentVal) {
      currentRank = index + 1;
      currentVal = val;
    }
    rankMap.set(entry.id, currentRank);
  });

  // Now apply user's sort preference for display
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

  // Add ranks from the pre-calculated map
  const rankedLeaderboard = sortedLeaderboard.map((entry) => ({
    ...entry,
    rank: rankMap.get(entry.id) || 0,
  }));

  // Filter by search
  const filteredLeaderboard = rankedLeaderboard.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Current user stats
  const currentUserEntry = rankedLeaderboard.find(e => e.id === currentUserId);
  const topScore = rankedLeaderboard[0]?.totalPoints || 0;
  const totalExactScores = leaderboard.reduce((sum, e) => sum + e.exactScores, 0);

  // Calculate percentile for exact scores
  const getExactScorePercentile = (exactScores: number) => {
    const betterCount = leaderboard.filter(e => e.exactScores < exactScores).length;
    return Math.round((betterCount / leaderboard.length) * 100);
  };

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

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-400';
    if (rank === 2) return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-400 border-orange-300';
    return '';
  };

  const getRowStyle = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-primary';
    if (rank === 1) return 'bg-yellow-50/30 dark:bg-yellow-900/10';
    if (rank === 2) return 'bg-slate-50/50 dark:bg-slate-800/20';
    if (rank === 3) return 'bg-orange-50/30 dark:bg-orange-900/10';
    return '';
  };

  const SortHeader = ({
    field,
    children,
    className = '',
  }: {
    field: SortField;
    children: React.ReactNode;
    className?: string;
  }) => (
    <th
      className={`py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        {sortField === field && (
          <span className="material-symbols-outlined text-primary text-sm">
            {sortAsc ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
              Tournament Leaderboard
            </h1>
            {leaderboard.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            FIFA World Cup 2026 • {leaderboard.length} participants
          </p>
        </div>
        <button
          id="export-csv"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          Export CSV
        </button>
      </div>

      {/* User Stats Summary */}
      {currentUserEntry && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Your Rank */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Your Rank</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 rounded p-1">trophy</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
                #{currentUserEntry.rank}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                of {leaderboard.length} players
              </p>
            </div>
          </div>

          {/* Total Points */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Points</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 rounded p-1">scoreboard</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
                {currentUserEntry.totalPoints.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {topScore - currentUserEntry.totalPoints} pts behind leader
              </p>
            </div>
          </div>

          {/* Exact Scores */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="flex justify-between items-start mb-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Exact Scores</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 rounded p-1">target</span>
            </div>
            <div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
                {currentUserEntry.exactScores}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Top {100 - getExactScorePercentile(currentUserEntry.exactScores)}%
              </p>
            </div>
          </div>

          {/* Bonus Points */}
          <div className="bg-primary rounded-xl p-5 shadow-md flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[100px]">military_tech</span>
            </div>
            <div className="flex justify-between items-start mb-2 relative z-10">
              <p className="text-white/80 text-sm font-medium">Bonus Matches</p>
              <span className="material-symbols-outlined bg-white/20 rounded p-1">stars</span>
            </div>
            <div className="relative z-10">
              <p className="text-white text-xl font-bold tracking-tight">
                {currentUserEntry.bonusMatchPoints} pts
              </p>
              <div className="w-full bg-black/20 rounded-full h-2 mt-3">
                <div
                  className="bg-white h-2 rounded-full transition-all"
                  style={{ width: `${bonusMatchesCount > 0 ? (currentUserEntry.bonusMatchExact / bonusMatchesCount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-white/80 mt-1">
                {currentUserEntry.bonusMatchExact}/{bonusMatchesCount} exact predictions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search - Sticky */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6 sticky top-0 z-40">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Phase Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full md:w-auto">
            {(['all', 'group', 'knockout', 'bonus'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  phase === p
                    ? 'bg-white dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                } ${p === 'bonus' ? 'flex items-center gap-1' : ''}`}
              >
                {p === 'bonus' && <span className="material-symbols-outlined text-amber-500 text-sm">star</span>}
                {p === 'all' ? 'Overall' : p === 'group' ? 'Group Stage' : p === 'knockout' ? 'Knockout' : 'Bonus'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-slate-400">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm placeholder-slate-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-900 dark:text-white transition-all"
              placeholder="Find a participant..."
            />
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">leaderboard</span>
          <p className="text-slate-500 dark:text-slate-400">No participants yet</p>
        </div>
      ) : (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-16 text-center">
                    Rank
                  </th>
                  <SortHeader field="name">Participant</SortHeader>
                  <SortHeader field="points" className="text-right">
                    {phase === 'all' ? 'Total' : phase === 'group' ? 'Group' : phase === 'knockout' ? 'Knockout' : 'Bonus'} Pts
                  </SortHeader>
                  <SortHeader field="exactScores" className="text-center hidden sm:table-cell">
                    Exact
                  </SortHeader>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center hidden md:table-cell">
                    Correct
                  </th>
                  <SortHeader field="bonus" className="text-center hidden lg:table-cell">
                    Bonus
                  </SortHeader>
                  <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center hidden lg:table-cell">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeaderboard.slice(0, visibleCount).map((entry) => {
                  const isCurrentUser = entry.id === currentUserId;
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${getRowStyle(entry.rank, isCurrentUser)}`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-center">
                        {entry.rank <= 3 ? (
                          <div className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto ${getRankBadgeStyle(entry.rank)}`}>
                            {entry.rank === 1 && (
                              <span className="material-symbols-outlined text-yellow-500 text-sm absolute -top-3 -right-1">crown</span>
                            )}
                            {entry.rank}
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500">{entry.rank}</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-6">
                        <Link
                          href={`/leaderboard/${entry.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className={`h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary font-bold ${
                            entry.rank <= 3 ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                          } ${entry.rank === 1 ? 'ring-yellow-400' : entry.rank === 2 ? 'ring-slate-300' : entry.rank === 3 ? 'ring-orange-300' : ''}`}>
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {entry.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Points */}
                      <td className="py-4 px-6 text-right">
                        <span className={`font-bold text-lg font-mono ${entry.rank <= 3 || isCurrentUser ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                          {getPoints(entry).toLocaleString()}
                        </span>
                      </td>

                      {/* Exact Scores */}
                      <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-300 font-mono hidden sm:table-cell">
                        {entry.exactScores}
                      </td>

                      {/* Correct Results */}
                      <td className="py-4 px-6 text-center text-slate-600 dark:text-slate-300 font-mono hidden md:table-cell">
                        {entry.correctResults}
                      </td>

                      {/* Bonus */}
                      <td className="py-4 px-6 text-center hidden lg:table-cell">
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {entry.bonusMatchPoints}
                        </span>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-6 text-center text-slate-500 text-sm hidden lg:table-cell">
                        {entry.predictedCount}/104
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {filteredLeaderboard.length > visibleCount && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-center bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setVisibleCount(prev => prev + 20)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-lg">expand_more</span>
                Load more participants ({filteredLeaderboard.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
