'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  homeTeam: string | null;
  awayTeam: string | null;
  isBonusMatch: boolean;
}

interface Settings {
  tournament: {
    id: string;
    name: string;
    predictionDeadline: string;
  } | null;
  teams: Team[];
  matches: Match[];
  bonusMatchCount: number;
}

interface Props {
  settings: Settings;
}

export default function AdminSettingsClient({ settings }: Props) {
  const [deadline, setDeadline] = useState(
    settings.tournament?.predictionDeadline
      ? new Date(settings.tournament.predictionDeadline).toISOString().slice(0, 16)
      : ''
  );
  const [teams, setTeams] = useState(settings.teams);
  const [bonusMatches, setBonusMatches] = useState<Set<string>>(
    new Set(settings.matches.filter((m) => m.isBonusMatch).map((m) => m.id))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'deadline' | 'bonus' | 'teams'>('deadline');

  const handleSaveDeadline = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/settings/deadline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: new Date(deadline).toISOString() }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Deadline updated successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update deadline' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update deadline' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBonusMatch = async (matchId: string) => {
    const newBonusMatches = new Set(bonusMatches);
    const isAdding = !newBonusMatches.has(matchId);

    // Check limit
    if (isAdding && newBonusMatches.size >= 5) {
      setMessage({ type: 'error', text: 'Maximum 5 bonus matches allowed' });
      return;
    }

    if (isAdding) {
      newBonusMatches.add(matchId);
    } else {
      newBonusMatches.delete(matchId);
    }

    try {
      const res = await fetch('/api/admin/settings/bonus-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, isBonusMatch: isAdding }),
      });

      if (res.ok) {
        setBonusMatches(newBonusMatches);
        setMessage({ type: 'success', text: `Match ${isAdding ? 'marked as' : 'unmarked from'} bonus match` });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update bonus match' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update bonus match' });
    }
  };

  const handleUpdateTeam = async (teamId: string, newName: string) => {
    try {
      const res = await fetch('/api/admin/settings/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, name: newName }),
      });

      if (res.ok) {
        setTeams(teams.map((t) => (t.id === teamId ? { ...t, name: newName } : t)));
        setEditingTeam(null);
        setMessage({ type: 'success', text: 'Team name updated successfully!' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update team name' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update team name' });
    }
  };

  const groupedTeams = teams.reduce((acc, team) => {
    const group = team.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage tournament settings, bonus matches, and teams
          </p>
        </div>
        <Link href="/admin" className="btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {message && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('deadline')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'deadline'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Prediction Deadline
          </button>
          <button
            onClick={() => setActiveTab('bonus')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bonus'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Bonus Matches ({bonusMatches.size}/5)
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Team Names
          </button>
        </nav>
      </div>

      {/* Deadline Tab */}
      {activeTab === 'deadline' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Prediction Deadline
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Set the deadline after which users can no longer submit or edit predictions.
          </p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Deadline Date & Time
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input w-full max-w-md"
              />
            </div>
            <button
              onClick={handleSaveDeadline}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Deadline'}
            </button>
          </div>
          {settings.tournament && (
            <p className="text-sm text-slate-500 mt-2">
              Current deadline: {new Date(settings.tournament.predictionDeadline).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Bonus Matches Tab */}
      {activeTab === 'bonus' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Bonus Matches
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Select 3-5 matches as bonus matches. Users who get exact scores on all bonus matches
            receive special recognition.
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {settings.matches.map((match) => (
              <div
                key={match.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  bonusMatches.has(match.id)
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">#{match.matchNumber}</span>
                  <span className="font-medium">
                    {match.homeTeam} vs {match.awayTeam}
                  </span>
                  {bonusMatches.has(match.id) && (
                    <span className="text-yellow-500">⭐</span>
                  )}
                </div>
                <button
                  onClick={() => handleToggleBonusMatch(match.id)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    bonusMatches.has(match.id)
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {bonusMatches.has(match.id) ? 'Remove' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Team Names
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Update placeholder team names as teams qualify for the tournament.
          </p>
          <div className="space-y-6">
            {Object.entries(groupedTeams)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, groupTeams]) => (
                <div key={group}>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-2">
                    Group {group}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groupTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700"
                      >
                        <span className="text-lg">{team.flagEmoji}</span>
                        {editingTeam === team.id ? (
                          <input
                            type="text"
                            defaultValue={team.name}
                            autoFocus
                            className="input flex-1 text-sm"
                            onBlur={(e) => {
                              if (e.target.value !== team.name) {
                                handleUpdateTeam(team.id, e.target.value);
                              } else {
                                setEditingTeam(null);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const target = e.target as HTMLInputElement;
                                if (target.value !== team.name) {
                                  handleUpdateTeam(team.id, target.value);
                                } else {
                                  setEditingTeam(null);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingTeam(null);
                              }
                            }}
                          />
                        ) : (
                          <>
                            <span className="flex-1 text-sm">{team.name}</span>
                            <span className="text-xs text-slate-400">{team.code}</span>
                            <button
                              onClick={() => setEditingTeam(team.id)}
                              className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
