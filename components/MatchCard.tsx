'use client';

import { useState } from 'react';
import { countries } from '@/lib/countries';

// Build FIFA to ISO mapping from countries database
const fifaToIso: { [key: string]: string } = {};
countries.forEach(c => {
  fifaToIso[c.fifa.toLowerCase()] = c.iso2.toLowerCase();
});

function getIsoCode(code: string): string {
  return fifaToIso[code.toLowerCase()] || code.toLowerCase();
}

interface Team {
  id: string;
  name: string;
  code: string;
  group: string | null;
  flagEmoji: string | null;
}

interface Prediction {
  id: string;
  predictedHome: number;
  predictedAway: number;
  predictedWinner: string | null;
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
  isBonusMatch: boolean;
  predictions: Prediction[];
  matchDate: string | null;
  venue: string | null;
}

interface MatchCardProps {
  match: Match;
  isLocked: boolean;
  onSaved?: (matchId: string, prediction: { predictedHome: number; predictedAway: number; predictedWinner: string | null }) => void;
  isKnockout?: boolean;
  predictedHomeTeam?: Team | null;
  predictedAwayTeam?: Team | null;
}

export default function MatchCard({
  match,
  isLocked,
  onSaved,
  isKnockout = false,
  predictedHomeTeam,
  predictedAwayTeam,
}: MatchCardProps) {
  const prediction = match.predictions[0];

  const [homeScore, setHomeScore] = useState<string>(
    prediction?.predictedHome?.toString() ?? ''
  );
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.predictedAway?.toString() ?? ''
  );
  const [winner, setWinner] = useState<string>(
    prediction?.predictedWinner ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // For predictions page: predictedTeam props are passed (Team or null), use them exclusively
  // For results page: predictedTeam props are undefined, fall back to match.homeTeam/awayTeam
  const effectiveHomeTeam = predictedHomeTeam !== undefined ? predictedHomeTeam : match.homeTeam;
  const effectiveAwayTeam = predictedAwayTeam !== undefined ? predictedAwayTeam : match.awayTeam;

  const homeName = effectiveHomeTeam?.name ?? match.homePlaceholder ?? 'TBD';
  const awayName = effectiveAwayTeam?.name ?? match.awayPlaceholder ?? 'TBD';
  const homeCode = effectiveHomeTeam?.code?.toLowerCase() ?? '';
  const awayCode = effectiveAwayTeam?.code?.toLowerCase() ?? '';

  // Show indicator when displaying predicted teams
  const showingPredictedHome = !match.homeTeam && predictedHomeTeam;
  const showingPredictedAway = !match.awayTeam && predictedAwayTeam;

  // Use larger flags (48x36) for the design
  const homeFlagUrl = homeCode && !homeCode.startsWith('tbd') ? `https://flagcdn.com/48x36/${getIsoCode(homeCode)}.png` : null;
  const awayFlagUrl = awayCode && !awayCode.startsWith('tbd') ? `https://flagcdn.com/48x36/${getIsoCode(awayCode)}.png` : null;

  const isDraw =
    homeScore !== '' &&
    awayScore !== '' &&
    parseInt(homeScore) === parseInt(awayScore);

  const handleSave = async () => {
    if (isLocked) return;

    // Trim and validate input
    const homeVal = homeScore.trim();
    const awayVal = awayScore.trim();

    if (homeVal === '' || awayVal === '') {
      setError('Please enter both scores');
      return;
    }

    const home = parseInt(homeVal, 10);
    const away = parseInt(awayVal, 10);

    if (isNaN(home) || isNaN(away)) {
      setError('Please enter valid numbers');
      return;
    }

    if (home < 0 || home > 99 || away < 0 || away > 99) {
      setError(`Invalid scores (${home}-${away}). Must be 0-99`);
      return;
    }

    if (isKnockout && isDraw && !winner) {
      setError('Please select a winner for knockout draws');
      return;
    }

    setError('');
    setSaving(true);

    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          predictedHome: home,
          predictedAway: away,
          predictedWinner: isKnockout && isDraw ? winner : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to save prediction');
        return;
      }

      setSaved(true);
      if (onSaved) {
        onSaved(match.id, {
          predictedHome: home,
          predictedAway: away,
          predictedWinner: isKnockout && isDraw ? winner : null,
        });
      }
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Format match date
  const formatMatchDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine if this is a knockout match for styling
  const isKnockoutStage = isKnockout || ['round32', 'round16', 'quarter', 'semi', 'final', 'third'].includes(match.stage);

  return (
    <div
      className={`group bg-surface-light dark:bg-surface-dark rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-5 relative overflow-hidden ${
        isKnockoutStage
          ? 'border-purple-200 dark:border-purple-900/50 ring-1 ring-purple-500/10'
          : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 dark:hover:border-primary/50'
      } ${match.isBonusMatch ? 'ring-2 ring-yellow-400/50' : ''}`}
    >
      {/* Saved indicator - top right */}
      {(saved || prediction) && !saving && (
        <div className="absolute top-0 right-0 p-3">
          <span className="material-symbols-outlined text-green-500 text-xl" title="Prediction Saved">
            check_circle
          </span>
        </div>
      )}

      {/* Match header */}
      <div className="flex justify-between items-start mb-4 sm:mb-6">
        <div className="flex flex-col gap-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${
            isKnockoutStage ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'
          }`}>
            Match {match.matchNumber} {match.matchDate && `• ${formatMatchDate(match.matchDate)?.split(',')[0]}`}
          </span>
          {match.venue && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {match.venue}
            </span>
          )}
        </div>
        {match.isBonusMatch && (
          <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 rounded flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">star</span>
            Bonus
          </span>
        )}
      </div>

      {/* Teams and scores - Horizontal layout */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center gap-2 sm:gap-3 text-center min-w-0">
          <div className={`size-12 rounded-full overflow-hidden border shadow-sm flex-shrink-0 ${
            showingPredictedHome
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-slate-100 dark:border-slate-700'
          }`}>
            {homeFlagUrl ? (
              <img src={homeFlagUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                {homeCode.toUpperCase().slice(0, 2) || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 w-full">
            <span className={`text-sm sm:text-base font-bold truncate block ${
              showingPredictedHome
                ? 'text-primary dark:text-primary'
                : 'text-slate-800 dark:text-white'
            }`}>
              {homeName}
            </span>
            {showingPredictedHome && (
              <span className="text-[10px] text-primary">Predicted</span>
            )}
          </div>
        </div>

        {/* Score Inputs */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <input
            type="number"
            min="0"
            max="99"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            className={`w-12 h-10 sm:w-14 sm:h-12 text-center text-lg sm:text-xl font-black bg-slate-50 dark:bg-background-dark border rounded-lg transition-all text-slate-900 dark:text-white placeholder-slate-300 ${
              isKnockoutStage
                ? 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="-"
          />
          <span className="text-slate-300 dark:text-slate-600 font-bold text-lg">-</span>
          <input
            type="number"
            min="0"
            max="99"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            className={`w-12 h-10 sm:w-14 sm:h-12 text-center text-lg sm:text-xl font-black bg-slate-50 dark:bg-background-dark border rounded-lg transition-all text-slate-900 dark:text-white placeholder-slate-300 ${
              isKnockoutStage
                ? 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder="-"
          />
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center gap-2 sm:gap-3 text-center min-w-0">
          <div className={`size-12 rounded-full overflow-hidden border shadow-sm flex-shrink-0 ${
            showingPredictedAway
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-slate-100 dark:border-slate-700'
          }`}>
            {awayFlagUrl ? (
              <img src={awayFlagUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                {awayCode.toUpperCase().slice(0, 2) || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 w-full">
            <span className={`text-sm sm:text-base font-bold truncate block ${
              showingPredictedAway
                ? 'text-primary dark:text-primary'
                : 'text-slate-800 dark:text-white'
            }`}>
              {awayName}
            </span>
            {showingPredictedAway && (
              <span className="text-[10px] text-primary">Predicted</span>
            )}
          </div>
        </div>
      </div>

      {/* Winner selection for knockout draws */}
      {isKnockout && isDraw && (
        <div className="mt-4 sm:mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-3 font-medium">
            Match ends in a draw. Select winner:
          </p>
          <div className="flex justify-center gap-3 sm:gap-4">
            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors border ${
              winner === 'home'
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input
                type="radio"
                name={`match_${match.id}_winner`}
                checked={winner === 'home'}
                onChange={() => !isLocked && setWinner('home')}
                disabled={isLocked}
                className="text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{homeName}</span>
            </label>
            <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors border ${
              winner === 'away'
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input
                type="radio"
                name={`match_${match.id}_winner`}
                checked={winner === 'away'}
                onChange={() => !isLocked && setWinner('away')}
                disabled={isLocked}
                className="text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{awayName}</span>
            </label>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Save button */}
      {!isLocked && (
        <button
          onClick={handleSave}
          disabled={saving || homeScore === '' || awayScore === ''}
          className={`w-full mt-4 px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            saving || homeScore === '' || awayScore === ''
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : saved
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
                : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
          }`}
        >
          {saving ? (
            <>
              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
              Saving...
            </>
          ) : saved ? (
            <>
              <span className="material-symbols-outlined text-base">check</span>
              Saved!
            </>
          ) : prediction ? (
            <>
              <span className="material-symbols-outlined text-base">edit</span>
              Update Prediction
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              Save Prediction
            </>
          )}
        </button>
      )}

      {/* Locked indicator */}
      {isLocked && (
        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-base">lock</span>
          <span>Predictions locked</span>
        </div>
      )}
    </div>
  );
}
