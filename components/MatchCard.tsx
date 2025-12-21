'use client';

import { useState } from 'react';

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

  // Use predicted team if no actual team is assigned
  const effectiveHomeTeam = match.homeTeam || predictedHomeTeam || null;
  const effectiveAwayTeam = match.awayTeam || predictedAwayTeam || null;

  const homeName = effectiveHomeTeam?.name ?? match.homePlaceholder ?? 'TBD';
  const awayName = effectiveAwayTeam?.name ?? match.awayPlaceholder ?? 'TBD';
  const homeCode = effectiveHomeTeam?.code?.toLowerCase() ?? '';
  const awayCode = effectiveAwayTeam?.code?.toLowerCase() ?? '';

  // Show indicator when displaying predicted teams
  const showingPredictedHome = !match.homeTeam && predictedHomeTeam;
  const showingPredictedAway = !match.awayTeam && predictedAwayTeam;

  // Convert 3-letter FIFA codes to 2-letter ISO codes for flagcdn
  const fifaToIso: { [key: string]: string } = {
    'mex': 'mx', 'rsa': 'za', 'kor': 'kr', 'can': 'ca', 'qat': 'qa', 'sui': 'ch',
    'bra': 'br', 'mar': 'ma', 'hai': 'ht', 'sco': 'gb-sct', 'usa': 'us', 'par': 'py',
    'aus': 'au', 'ger': 'de', 'cuw': 'cw', 'civ': 'ci', 'ecu': 'ec', 'ned': 'nl',
    'jpn': 'jp', 'tun': 'tn', 'bel': 'be', 'egy': 'eg', 'irn': 'ir', 'nzl': 'nz',
    'esp': 'es', 'cpv': 'cv', 'ksa': 'sa', 'uru': 'uy', 'fra': 'fr', 'sen': 'sn',
    'nor': 'no', 'arg': 'ar', 'alg': 'dz', 'aut': 'at', 'jor': 'jo', 'por': 'pt',
    'uzb': 'uz', 'col': 'co', 'eng': 'gb-eng', 'cro': 'hr', 'gha': 'gh', 'pan': 'pa',
  };
  const getIsoCode = (code: string) => fifaToIso[code] || code;
  const homeFlagUrl = homeCode && !homeCode.startsWith('tbd') ? `https://flagcdn.com/24x18/${getIsoCode(homeCode)}.png` : null;
  const awayFlagUrl = awayCode && !awayCode.startsWith('tbd') ? `https://flagcdn.com/24x18/${getIsoCode(awayCode)}.png` : null;

  const isDraw =
    homeScore !== '' &&
    awayScore !== '' &&
    parseInt(homeScore) === parseInt(awayScore);

  const handleSave = async () => {
    if (isLocked) return;

    const home = parseInt(homeScore);
    const away = parseInt(awayScore);

    if (isNaN(home) || isNaN(away)) {
      setError('Please enter valid scores');
      return;
    }

    if (home < 0 || home > 20 || away < 0 || away > 20) {
      setError('Scores must be between 0 and 20');
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

  return (
    <div
      className={`match-card ${match.isBonusMatch ? 'bonus' : ''} ${
        saved ? 'ring-2 ring-green-500' : ''
      }`}
    >
      {/* Match header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">Match #{match.matchNumber}</span>
        {match.isBonusMatch && (
          <span className="badge badge-warning">
            <span className="mr-1">⭐</span> Bonus
          </span>
        )}
      </div>

      {/* Date and venue */}
      {(match.matchDate || match.venue) && (
        <div className="mb-3 text-xs text-slate-500 space-y-0.5">
          {match.matchDate && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatMatchDate(match.matchDate)}</span>
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{match.venue}</span>
            </div>
          )}
        </div>
      )}

      {/* Teams and scores */}
      <div className="space-y-3">
        {/* Home team */}
        <div className="flex items-center gap-3">
          {homeFlagUrl ? (
            <img src={homeFlagUrl} alt="" className="w-6 h-4 flex-shrink-0 object-cover rounded-sm" />
          ) : (
            <span className="w-6 h-4 flex-shrink-0 bg-slate-200 rounded-sm" />
          )}
          <div className="flex-1 min-w-0">
            <span className={`font-medium flex-1 min-w-0 block ${
              showingPredictedHome
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-900 dark:text-white'
            } ${!effectiveHomeTeam ? 'text-sm' : ''}`}>
              {homeName}
            </span>
            {showingPredictedHome && (
              <span className="text-xs text-primary-500">Your prediction</span>
            )}
          </div>
          <input
            type="number"
            min="0"
            max="20"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            className="w-16 input text-center flex-shrink-0"
            placeholder="-"
          />
        </div>

        {/* Away team */}
        <div className="flex items-center gap-3">
          {awayFlagUrl ? (
            <img src={awayFlagUrl} alt="" className="w-6 h-4 flex-shrink-0 object-cover rounded-sm" />
          ) : (
            <span className="w-6 h-4 flex-shrink-0 bg-slate-200 rounded-sm" />
          )}
          <div className="flex-1 min-w-0">
            <span className={`font-medium flex-1 min-w-0 block ${
              showingPredictedAway
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-slate-900 dark:text-white'
            } ${!effectiveAwayTeam ? 'text-sm' : ''}`}>
              {awayName}
            </span>
            {showingPredictedAway && (
              <span className="text-xs text-primary-500">Your prediction</span>
            )}
          </div>
          <input
            type="number"
            min="0"
            max="20"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            className="w-16 input text-center flex-shrink-0"
            placeholder="-"
          />
        </div>

        {/* Winner selection for knockout draws */}
        {isKnockout && isDraw && (
          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Select winner (penalties):
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setWinner('home')}
                disabled={isLocked}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  winner === 'home'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                }`}
              >
                {homeName}
              </button>
              <button
                type="button"
                onClick={() => setWinner('away')}
                disabled={isLocked}
                className={`flex-1 px-3 py-2 text-sm rounded-md ${
                  winner === 'away'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                }`}
              >
                {awayName}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {/* Save button */}
      {!isLocked && (
        <button
          onClick={handleSave}
          disabled={saving || homeScore === '' || awayScore === ''}
          className="btn-primary w-full mt-4 flex items-center justify-center"
        >
          {saving ? (
            <>
              <span className="spinner mr-2"></span>
              Saving...
            </>
          ) : saved ? (
            <>
              <span className="mr-2">✓</span>
              Saved!
            </>
          ) : prediction ? (
            'Update Prediction'
          ) : (
            'Save Prediction'
          )}
        </button>
      )}

      {/* Locked indicator */}
      {isLocked && prediction && (
        <div className="mt-4 text-center text-sm text-slate-500">
          <span className="inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Locked
          </span>
        </div>
      )}
    </div>
  );
}
