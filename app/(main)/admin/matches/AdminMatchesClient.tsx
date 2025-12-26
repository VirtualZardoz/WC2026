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
      <div className="flex flex-wrap justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Enter Match Results
          </h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">pending_actions</span>
            {pendingCount} matches pending results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleBulkMode}
            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              bulkMode
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{bulkMode ? 'close' : 'playlist_add'}</span>
            {bulkMode ? 'Cancel Bulk' : 'Bulk Entry'}
          </button>
          {bulkMode && (
            <button
              onClick={saveBulkResults}
              disabled={saving}
              className="px-4 py-2.5 rounded-lg font-bold text-sm bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              {saving ? 'Saving...' : 'Save All'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-6">
          {/* Status filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Status
            </label>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex">
              {(['all', 'pending', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    filter === f
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stage filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Stage
            </label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageNames).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Stats summary */}
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Pending: {pendingCount}
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Completed: {matches.length - pendingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">search_off</span>
          <p className="text-slate-500 dark:text-slate-400">No matches found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`rounded-xl border bg-surface-light dark:bg-surface-dark p-4 hover:shadow-md transition-shadow ${
                match.isBonusMatch
                  ? 'border-yellow-300 dark:border-yellow-700 ring-1 ring-yellow-400/30'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Match info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                      #{match.matchNumber}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {stageNames[match.stage]}
                    </span>
                    {match.group && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Group {match.group}
                      </span>
                    )}
                    {match.isBonusMatch && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">star</span>
                        Bonus
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {match.homeTeam?.flagEmoji}{' '}
                      {match.homeTeam?.name ?? match.homePlaceholder}
                      {!match.homeTeamId && match.stage !== 'group' && (
                        <button
                          onClick={() => setOverridingMatch({ id: match.id, slot: 'home' })}
                          className="ml-2 text-[10px] text-primary hover:underline font-medium"
                        >
                          Override
                        </button>
                      )}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600 font-bold">vs</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {match.awayTeam?.name ?? match.awayPlaceholder}{' '}
                      {match.awayTeam?.flagEmoji}
                      {!match.awayTeamId && match.stage !== 'group' && (
                        <button
                          onClick={() => setOverridingMatch({ id: match.id, slot: 'away' })}
                          className="ml-2 text-[10px] text-primary hover:underline font-medium"
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
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={bulkResults[match.id]?.home ?? ''}
                        onChange={(e) => handleBulkChange(match.id, 'home', e.target.value)}
                        className="w-14 h-10 text-center text-lg font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="-"
                      />
                      <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={bulkResults[match.id]?.away ?? ''}
                        onChange={(e) => handleBulkChange(match.id, 'away', e.target.value)}
                        className="w-14 h-10 text-center text-lg font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="-"
                      />
                    </div>
                    {match.stage !== 'group' && bulkResults[match.id]?.home !== '' && bulkResults[match.id]?.away !== '' && parseInt(bulkResults[match.id]?.home) === parseInt(bulkResults[match.id]?.away) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Winner:</span>
                        <button
                          onClick={() => handleBulkWinnerChange(match.id, match.homeTeamId)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                            bulkResults[match.id]?.winnerId === match.homeTeamId
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {match.homeTeam?.name ?? 'Home'}
                        </button>
                        <button
                          onClick={() => handleBulkWinnerChange(match.id, match.awayTeamId)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                            bulkResults[match.id]?.winnerId === match.awayTeamId
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {match.awayTeam?.name ?? 'Away'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : editingMatch === match.id ? (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                        className="w-14 h-10 text-center text-lg font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="-"
                      />
                      <span className="text-slate-300 dark:text-slate-600 font-bold">-</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                        className="w-14 h-10 text-center text-lg font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="-"
                      />
                      <button
                        onClick={() => confirmSave(match)}
                        className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-base">check</span>
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                    {match.stage !== 'group' && isDraw && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Winner:</span>
                        <button
                          onClick={() => setWinnerId(match.homeTeamId)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                            winnerId === match.homeTeamId
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {match.homeTeam?.name ?? 'Home'}
                        </button>
                        <button
                          onClick={() => setWinnerId(match.awayTeamId)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                            winnerId === match.awayTeamId
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {match.awayTeam?.name ?? 'Away'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : match.realScoreHome !== null && match.realScoreAway !== null ? (
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                      <span className="text-xl font-black text-green-700 dark:text-green-300">
                        {match.realScoreHome} - {match.realScoreAway}
                      </span>
                    </div>
                    <button
                      onClick={() => startEditing(match)}
                      className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing(match)}
                    className="px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">edit_note</span>
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Override Team ({overridingMatch.slot})
              </h3>
              <button
                onClick={() => setOverridingMatch(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Select a team to manually place in this knockout slot.
            </p>
            <div className="flex-1 overflow-y-auto space-y-1 mb-4 max-h-[50vh]">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => handleOverride(team.id)}
                  disabled={saving}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors disabled:opacity-50"
                >
                  <span className="text-xl">{team.flagEmoji}</span>
                  <span className="flex-1 font-medium text-slate-900 dark:text-white">{team.name}</span>
                  <span className="text-xs text-slate-400 font-mono">{team.code}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setOverridingMatch(null)}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Confirm Result
              </h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 mb-3">
              Are you sure you want to save this result?
            </p>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-4">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {confirmModal.matchName}
              </p>
              <p className="text-2xl font-black text-primary mt-1">
                {confirmModal.home} - {confirmModal.away}
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">info</span>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                This will recalculate points for all predictions on this match.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={saveResult}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">check</span>
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
