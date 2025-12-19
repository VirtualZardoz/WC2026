'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Team {
  id: string;
  name: string;
  code: string;
  group: string | null;
  flagEmoji: string | null;
}

interface Match {
  id: string;
  matchNumber: number;
  stage: string;
  group: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  realScoreHome: number | null;
  realScoreAway: number | null;
  isBonusMatch: boolean;
}

interface AdminMatchesClientProps {
  matches: Match[];
}

export default function AdminMatchesClient({ matches }: AdminMatchesClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    matchId: string;
    home: number;
    away: number;
    matchName: string;
  } | null>(null);

  const filteredMatches = matches.filter((match) => {
    // Status filter
    const hasResult = match.realScoreHome !== null && match.realScoreAway !== null;
    if (filter === 'pending' && hasResult) return false;
    if (filter === 'completed' && !hasResult) return false;

    // Stage filter
    if (stageFilter !== 'all' && match.stage !== stageFilter) return false;

    return true;
  });

  const startEditing = (match: Match) => {
    setEditingMatch(match.id);
    setHomeScore(match.realScoreHome?.toString() ?? '');
    setAwayScore(match.realScoreAway?.toString() ?? '');
  };

  const cancelEditing = () => {
    setEditingMatch(null);
    setHomeScore('');
    setAwayScore('');
  };

  const confirmSave = (match: Match) => {
    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 20 || away > 20) {
      alert('Please enter valid scores (0-20)');
      return;
    }

    const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? 'Home';
    const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? 'Away';

    setConfirmModal({
      matchId: match.id,
      home,
      away,
      matchName: `${homeName} vs ${awayName}`,
    });
  };

  const saveResult = async () => {
    if (!confirmModal) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/matches/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: confirmModal.matchId,
          homeScore: confirmModal.home,
          awayScore: confirmModal.away,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to save result');
        return;
      }

      setConfirmModal(null);
      setEditingMatch(null);
      setHomeScore('');
      setAwayScore('');
      router.refresh();
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const stageNames: { [key: string]: string } = {
    group: 'Group Stage',
    round32: 'Round of 32',
    round16: 'Round of 16',
    quarter: 'Quarter-finals',
    semi: 'Semi-finals',
    third: 'Third Place',
    final: 'Final',
  };

  const pendingCount = matches.filter(
    (m) => m.realScoreHome === null || m.realScoreAway === null
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Enter Match Results
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {pendingCount} matches pending results
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="flex flex-wrap gap-4">
          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="flex space-x-2">
              {(['all', 'pending', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stage filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Stage
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="input w-full py-1"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-500">No matches found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`card ${match.isBonusMatch ? 'ring-2 ring-yellow-400' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Match info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-slate-500">
                      #{match.matchNumber}
                    </span>
                    <span className="badge badge-info text-xs">
                      {stageNames[match.stage]}
                    </span>
                    {match.group && (
                      <span className="badge bg-slate-200 dark:bg-slate-700 text-xs">
                        Group {match.group}
                      </span>
                    )}
                    {match.isBonusMatch && (
                      <span className="badge badge-warning text-xs">⭐ Bonus</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {match.homeTeam?.flagEmoji}{' '}
                      {match.homeTeam?.name ?? match.homePlaceholder}
                    </span>
                    <span className="text-slate-400">vs</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {match.awayTeam?.name ?? match.awayPlaceholder}{' '}
                      {match.awayTeam?.flagEmoji}
                    </span>
                  </div>
                </div>

                {/* Result display or edit */}
                {editingMatch === match.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-16 input text-center"
                      placeholder="0"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-16 input text-center"
                      placeholder="0"
                    />
                    <button
                      onClick={() => confirmSave(match)}
                      className="btn-primary text-sm"
                    >
                      Save
                    </button>
                    <button onClick={cancelEditing} className="btn-secondary text-sm">
                      Cancel
                    </button>
                  </div>
                ) : match.realScoreHome !== null && match.realScoreAway !== null ? (
                  <div className="flex items-center space-x-4">
                    <div className="px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <span className="text-xl font-bold text-green-800 dark:text-green-200">
                        {match.realScoreHome} - {match.realScoreAway}
                      </span>
                    </div>
                    <button
                      onClick={() => startEditing(match)}
                      className="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing(match)}
                    className="btn-primary text-sm"
                  >
                    Enter Result
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Confirm Result
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              Are you sure you want to save this result?
            </p>
            <p className="text-lg font-medium text-slate-900 dark:text-white mb-4">
              {confirmModal.matchName}:{' '}
              <span className="text-primary-600">
                {confirmModal.home} - {confirmModal.away}
              </span>
            </p>
            <p className="text-sm text-amber-600 mb-6">
              This will recalculate points for all predictions on this match.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveResult}
                className="btn-primary flex-1 flex items-center justify-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner mr-2"></span>
                    Saving...
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
