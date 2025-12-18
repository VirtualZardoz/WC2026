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
}

interface LeaderboardClientProps {
  leaderboard: LeaderboardEntry[];
  currentUserId?: string;
}

type SortField = 'points' | 'exactScores' | 'name';

export default function LeaderboardClient({
  leaderboard,
  currentUserId,
}: LeaderboardClientProps) {
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name');
    }
  };

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'points':
        comparison = b.totalPoints - a.totalPoints;
        break;
      case 'exactScores':
        comparison = b.exactScores - a.exactScores;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    return sortAsc ? -comparison : comparison;
  });

  // Calculate ranks (tied users share same rank)
  const rankedLeaderboard = sortedLeaderboard.map((entry, index, arr) => {
    let rank = 1;
    for (let i = 0; i < index; i++) {
      if (arr[i].totalPoints !== entry.totalPoints) {
        rank = i + 1;
      }
    }
    if (index > 0 && arr[index - 1].totalPoints === entry.totalPoints) {
      rank = rankedLeaderboard[index - 1]?.rank || index;
    } else {
      rank = index + 1;
    }
    return { ...entry, rank };
  });

  // Recalculate ranks properly
  let currentRank = 0;
  let currentPoints = -1;
  rankedLeaderboard.forEach((entry, index) => {
    if (entry.totalPoints !== currentPoints) {
      currentRank = index + 1;
      currentPoints = entry.totalPoints;
    }
    entry.rank = currentRank;
  });

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Leaderboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Current standings for the prediction competition
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">
            {leaderboard.length}
          </p>
          <p className="text-sm text-slate-500">Participants</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">
            {leaderboard.reduce((sum, e) => sum + e.exactScores, 0)}
          </p>
          <p className="text-sm text-slate-500">Total Exact Scores</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">
            {leaderboard[0]?.totalPoints || 0}
          </p>
          <p className="text-sm text-slate-500">Highest Score</p>
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
                  <th className="px-4 py-3 bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    Rank
                  </th>
                  <SortHeader field="name">Name</SortHeader>
                  <SortHeader field="points">Points</SortHeader>
                  <SortHeader field="exactScores">Exact Scores</SortHeader>
                  <th className="px-4 py-3 bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    Correct Results
                  </th>
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
                          <span className="ml-2 badge badge-info">You</span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 font-bold text-lg">
                      {entry.totalPoints}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-green-600 font-medium">
                        {entry.exactScores}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-amber-600">
                        {entry.correctResults}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-slate-500">
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
