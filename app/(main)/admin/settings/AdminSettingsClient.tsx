'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { countries } from '@/lib/countries';

interface CountryMatch {
  country: {
    name: string;
    fifa: string;
    iso2: string;
  };
  similarity: number;
  matchedOn: string;
}

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
  signupEnabled: boolean;
}

interface Props {
  settings: Settings;
}

// Build FIFA to ISO mapping from countries database
const fifaToIso: { [key: string]: string } = {};
countries.forEach(c => {
  fifaToIso[c.fifa.toLowerCase()] = c.iso2.toLowerCase();
});

function getIsoCode(code: string): string {
  const lower = code.toLowerCase();
  return fifaToIso[lower] || lower;
}

function getFlagUrl(code: string): string | null {
  if (!code || code.startsWith('tbd')) return null;
  const iso = getIsoCode(code);
  // Validate that we have a proper 2-char ISO code
  if (iso.length < 2 || iso.length > 6) return null;
  return `https://flagcdn.com/48x36/${iso}.png`;
}

export default function AdminSettingsClient({ settings }: Props) {
  const [deadline, setDeadline] = useState(
    settings.tournament?.predictionDeadline
      ? new Date(settings.tournament.predictionDeadline).toISOString().slice(0, 16)
      : ''
  );
  const [signupEnabled, setSignupEnabled] = useState(settings.signupEnabled);
  const [teams, setTeams] = useState(settings.teams);
  const [bonusMatches, setBonusMatches] = useState<Set<string>>(
    new Set(settings.matches.filter((m) => m.isBonusMatch).map((m) => m.id))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [suggestions, setSuggestions] = useState<CountryMatch[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<CountryMatch | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'deadline' | 'bonus' | 'teams'>('general');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for countries as user types
  useEffect(() => {
    if (editValue.length < 2) {
      setSuggestions([]);
      setSelectedSuggestion(null);
      return;
    }

    const searchCountries = async () => {
      try {
        const res = await fetch(`/api/admin/settings/team?q=${encodeURIComponent(editValue)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.matches || []);
          // Auto-select if exact match
          if (data.matches?.length > 0 && data.matches[0].similarity === 100) {
            setSelectedSuggestion(data.matches[0]);
          } else if (data.matches?.length > 0 && data.matches[0].similarity >= 85) {
            setSelectedSuggestion(data.matches[0]);
          } else {
            setSelectedSuggestion(null);
          }
        }
      } catch (error) {
        console.error('Error searching countries:', error);
      }
    };

    const debounce = setTimeout(searchCountries, 200);
    return () => clearTimeout(debounce);
  }, [editValue]);

  const handleToggleSignup = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !signupEnabled }),
      });

      if (res.ok) {
        setSignupEnabled(!signupEnabled);
        setMessage({ type: 'success', text: `Registration ${!signupEnabled ? 'enabled' : 'disabled'}` });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to update setting' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update setting' });
    } finally {
      setSaving(false);
    }
  };

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

  const handleStartEdit = (team: Team) => {
    setEditingTeam(team.id);
    setEditValue(team.name);
    setSelectedSuggestion(null);
    setSuggestions([]);
    setShowSuggestions(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelectSuggestion = (match: CountryMatch) => {
    setEditValue(match.country.name);
    setSelectedSuggestion(match);
    setShowSuggestions(false);
  };

  const handleUpdateTeam = async (teamId: string) => {
    if (!editValue.trim()) {
      setEditingTeam(null);
      return;
    }

    const currentTeam = teams.find(t => t.id === teamId);
    if (!currentTeam) return;

    // If no changes, just close
    if (editValue === currentTeam.name && !selectedSuggestion) {
      setEditingTeam(null);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          name: selectedSuggestion ? selectedSuggestion.country.name : editValue,
          code: selectedSuggestion ? selectedSuggestion.country.iso2 : undefined,
          autoResolve: !selectedSuggestion, // Try auto-resolve if no explicit selection
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTeams(teams.map((t) =>
          t.id === teamId
            ? { ...t, name: data.team.name, code: data.team.code }
            : t
        ));
        setEditingTeam(null);
        setEditValue('');
        setSelectedSuggestion(null);

        if (data.resolved?.autoResolved) {
          setMessage({ type: 'success', text: `Team updated to "${data.team.name}" with auto-resolved code "${data.team.code}"` });
        } else if (data.resolved) {
          setMessage({ type: 'success', text: `Team updated to "${data.team.name}" (${data.team.code})` });
        } else {
          setMessage({ type: 'success', text: 'Team name updated (flag code unchanged)' });
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update team' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update team' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTeam(null);
    setEditValue('');
    setSelectedSuggestion(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const groupedTeams = teams.reduce((acc, team) => {
    const group = team.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage tournament settings, bonus matches, and teams
          </p>
        </div>
        <Link
          href="/admin"
          className="px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Dashboard
        </Link>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
        }`}>
          <span className="material-symbols-outlined">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl inline-flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">tune</span>
          General
        </button>
        <button
          onClick={() => setActiveTab('deadline')}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'deadline'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">schedule</span>
          Deadline
        </button>
        <button
          onClick={() => setActiveTab('bonus')}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'bonus'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">star</span>
          Bonus ({bonusMatches.size}/5)
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'teams'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-lg">groups</span>
          Teams
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">tune</span>
            General Settings
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  User Registration
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enable or disable new user signups. Existing users can still log in.
                </p>
              </div>
              <button
                onClick={handleToggleSignup}
                disabled={saving}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  signupEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
                } ${saving ? 'opacity-50' : ''}`}
                role="switch"
                aria-checked={signupEnabled}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    signupEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Tab */}
      {activeTab === 'deadline' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schedule</span>
            Prediction Deadline
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Set the deadline after which users can no longer submit or edit predictions.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Deadline Date & Time
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <button
              onClick={handleSaveDeadline}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              {saving ? 'Saving...' : 'Save Deadline'}
            </button>
          </div>
          {settings.tournament && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined text-base">info</span>
              Current deadline: {new Date(settings.tournament.predictionDeadline).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Bonus Matches Tab */}
      {activeTab === 'bonus' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-yellow-500">star</span>
            Bonus Matches
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Select 3-5 matches as bonus matches. Users who get exact scores receive special recognition.
          </p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {settings.matches.map((match) => (
              <div
                key={match.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  bonusMatches.has(match.id)
                    ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-yellow-400/30'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{match.matchNumber}</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {match.homeTeam} vs {match.awayTeam}
                  </span>
                  {bonusMatches.has(match.id) && (
                    <span className="material-symbols-outlined text-yellow-500">star</span>
                  )}
                </div>
                <button
                  onClick={() => handleToggleBonusMatch(match.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    bonusMatches.has(match.id)
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {bonusMatches.has(match.id) ? 'remove' : 'add'}
                  </span>
                  {bonusMatches.has(match.id) ? 'Remove' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">groups</span>
            Team Names
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Update placeholder team names as teams qualify. Start typing a country name to get suggestions with automatic flag resolution.
          </p>
          <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <span className="material-symbols-outlined text-blue-500">lightbulb</span>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Tip:</strong> Type &quot;Andora&quot; and it will auto-correct to &quot;Andorra&quot; with the correct flag!
            </span>
          </div>
          <div className="space-y-6">
            {Object.entries(groupedTeams)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, groupTeams]) => (
                <div key={group}>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      Group {group}
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {groupTeams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors overflow-hidden"
                      >
                        {/* Flag display */}
                        <div className="w-8 h-6 flex items-center justify-center flex-shrink-0">
                          {getFlagUrl(team.code) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getFlagUrl(team.code)!}
                              alt={team.name}
                              className="w-8 h-6 object-cover rounded shadow-sm"
                            />
                          ) : (
                            <span className="text-lg">🏳️</span>
                          )}
                        </div>

                        {editingTeam === team.id ? (
                          <div className="flex-1 min-w-0 relative" ref={suggestionsRef}>
                            <div className="flex items-center gap-2">
                              <input
                                ref={inputRef}
                                type="text"
                                value={editValue}
                                onChange={(e) => {
                                  setEditValue(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-primary bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                                placeholder="Type country name..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateTeam(team.id);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                              />
                              {/* Selected country preview */}
                              {selectedSuggestion && (
                                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={`https://flagcdn.com/24x18/${selectedSuggestion.country.iso2}.png`}
                                    alt={selectedSuggestion.country.name}
                                    className="w-6 h-4 object-cover rounded"
                                  />
                                  <span className="text-xs font-mono text-green-700 dark:text-green-300">
                                    {selectedSuggestion.country.iso2}
                                  </span>
                                  <span className="material-symbols-outlined text-green-600 text-base">check</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleUpdateTeam(team.id)}
                                disabled={saving}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600"
                              >
                                Cancel
                              </button>
                            </div>

                            {/* Suggestions dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg max-h-60 overflow-y-auto">
                                {suggestions.map((match, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSelectSuggestion(match)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                                      selectedSuggestion?.country.iso2 === match.country.iso2
                                        ? 'bg-primary/10'
                                        : ''
                                    }`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`https://flagcdn.com/24x18/${match.country.iso2}.png`}
                                      alt={match.country.name}
                                      className="w-6 h-4 object-cover rounded shadow-sm"
                                    />
                                    <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
                                      {match.country.name}
                                    </span>
                                    <span className="text-xs font-mono text-slate-400">
                                      {match.country.iso2}
                                    </span>
                                    <span
                                      className={`text-xs px-1.5 py-0.5 rounded ${
                                        match.similarity === 100
                                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                          : match.similarity >= 85
                                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                      }`}
                                    >
                                      {match.similarity}%
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 min-w-0 text-sm font-medium text-slate-900 dark:text-white truncate whitespace-nowrap overflow-hidden text-ellipsis" title={team.name}>
                              {team.name}
                            </span>
                            <span className={`text-xs font-mono flex-shrink-0 ${
                              team.code.startsWith('tbd')
                                ? 'text-orange-500'
                                : 'text-slate-400'
                            }`}>
                              {team.code}
                            </span>
                            <button
                              onClick={() => handleStartEdit(team)}
                              className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
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
