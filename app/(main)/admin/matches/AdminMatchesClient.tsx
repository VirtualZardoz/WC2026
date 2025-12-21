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
  teams: Team[];
}

export default function AdminMatchesClient({ matches, teams }: AdminMatchesClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ [matchId: string]: { home: string, away: string, winnerId?: string | null } }>({});
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [overridingMatch, setOverridingMatch] = useState<{ id: string; slot: 'home' | 'away' } | null>(null);

  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    matchId: string;
    home: number;
    away: number;
    winnerId: string | null;
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

  const isDraw = homeScore !== '' && awayScore !== '' && parseInt(homeScore) === parseInt(awayScore);

  const startEditing = (match: Match) => {
    setEditingMatch(match.id);
    setHomeScore(match.realScoreHome?.toString() ?? '');
    setAwayScore(match.realScoreAway?.toString() ?? '');
    setWinnerId(null);
  };

  const cancelEditing = () => {
    setEditingMatch(null);
    setHomeScore('');
    setAwayScore('');
    setWinnerId(null);
  };

  const toggleBulkMode = () => {
    if (bulkMode) {
      setBulkResults({});
    }
    setBulkMode(!bulkMode);
  };

  const handleBulkChange = (matchId: string, field: 'home' | 'away', value: string) => {
    setBulkResults(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const handleBulkWinnerChange = (matchId: string, winnerId: string | null) => {
    setBulkResults(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        winnerId
      }
    }));
  };

  const saveBulkResults = async () => {
    const results = Object.entries(bulkResults)
      .filter(([_, data]) => data.home !== '' && data.away !== '')
      .map(([matchId, data]) => ({
        matchId,
        homeScore: parseInt(data.home),
        awayScore: parseInt(data.away),
        winnerId: data.winnerId
      }));

    if (results.length === 0) {
      alert('No results to save');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/matches/bulk-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to save bulk results');
        return;
      }

      setBulkResults({});
      setBulkMode(false);
      router.refresh();
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const confirmSave = (match: Match) => {

    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0 || home > 20 || away > 20) {
      alert('Please enter valid scores (0-20)');
      return;
    }

    if (match.stage !== 'group' && home === away && !winnerId) {
      alert('Please select a winner for knockout draws');
      return;
    }

    const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? 'Home';
    const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? 'Away';

    setConfirmModal({
      matchId: match.id,
      home,
      away,
      winnerId: match.stage !== 'group' && home === away ? winnerId : null,
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
          winnerId: confirmModal.winnerId,
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

  const handleOverride = async (teamId: string) => {
    if (!overridingMatch) return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/matches/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: overridingMatch.id,
          teamId,
          slot: overridingMatch.slot,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to override team');
        return;
      }

      setOverridingMatch(null);
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Enter Match Results
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {pendingCount} matches pending results
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleBulkMode}
            className={`btn-${bulkMode ? 'secondary' : 'primary'}`}
          >
            {bulkMode ? 'Cancel Bulk Entry' : 'Bulk Entry by Day'}
          </button>
          {bulkMode && (
            <button
              onClick={saveBulkResults}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save All Results'}
            </button>
          )}
        </div>
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
                      {!match.homeTeamId && match.stage !== 'group' && (
                        <button
                          onClick={() => setOverridingMatch({ id: match.id, slot: 'home' })}
                          className="ml-2 text-[10px] text-primary-600 hover:underline"
                        >
                          Override
                        </button>
                      )}
                    </span>
                    <span className="text-slate-400">vs</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {match.awayTeam?.name ?? match.awayPlaceholder}{' '}
                      {match.awayTeam?.flagEmoji}
                      {!match.awayTeamId && match.stage !== 'group' && (
                        <button
                          onClick={() => setOverridingMatch({ id: match.id, slot: 'away' })}
                          className="ml-2 text-[10px] text-primary-600 hover:underline"
                        >
                          Override
                        </button>
                      )}
                    </span>
                  </div>

                </div>

                {/* Result display or edit */}
                {bulkMode ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={bulkResults[match.id]?.home ?? ''}
                        onChange={(e) => handleBulkChange(match.id, 'home', e.target.value)}
                        className="w-16 input text-center"
                        placeholder="0"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={bulkResults[match.id]?.away ?? ''}
                        onChange={(e) => handleBulkChange(match.id, 'away', e.target.value)}
                        className="w-16 input text-center"
                        placeholder="0"
                      />
                    </div>
                    {match.stage !== 'group' && bulkResults[match.id]?.home !== '' && bulkResults[match.id]?.away !== '' && parseInt(bulkResults[match.id]?.home) === parseInt(bulkResults[match.id]?.away) && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-500">Winner:</span>
                        <button
                          onClick={() => handleBulkWinnerChange(match.id, match.homeTeamId)}
                          className={`px-2 py-1 text-xs rounded ${
                            bulkResults[match.id]?.winnerId === match.homeTeamId
                              ? 'bg-primary-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {match.homeTeam?.name ?? 'Home'}
                        </button>
                        <button
                          onClick={() => handleBulkWinnerChange(match.id, match.awayTeamId)}
                          className={`px-2 py-1 text-xs rounded ${
                            bulkResults[match.id]?.winnerId === match.awayTeamId
                              ? 'bg-primary-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {match.awayTeam?.name ?? 'Away'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : editingMatch === match.id ? (
                  <div className="flex flex-col items-end gap-2">
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
                    {match.stage !== 'group' && isDraw && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-500">Winner:</span>
                        <button
                          onClick={() => setWinnerId(match.homeTeamId)}
                          className={`px-2 py-1 text-xs rounded ${
                            winnerId === match.homeTeamId
                              ? 'bg-primary-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {match.homeTeam?.name ?? 'Home'}
                        </button>
                        <button
                          onClick={() => setWinnerId(match.awayTeamId)}
                          className={`px-2 py-1 text-xs rounded ${
                            winnerId === match.awayTeamId
                              ? 'bg-primary-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {match.awayTeam?.name ?? 'Away'}
                        </button>
                      </div>
                    )}
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

      {/* Override Modal */}
      {overridingMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Override Team ({overridingMatch.slot})
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Select a team to manually place in this knockout slot.
            </p>
            <div className="flex-1 overflow-y-auto space-y-2 mb-6">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleOverride(team.id)}
                  disabled={saving}
                  className="w-full text-left p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
                >
                  <span>{team.flagEmoji}</span>
                  <span className="flex-1">{team.name}</span>
                  <span className="text-xs text-slate-400">{team.code}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setOverridingMatch(null)}
              className="btn-secondary w-full"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
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
