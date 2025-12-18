'use client';

import { useState } from 'react';

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
  homeTeam: Team | null;
  awayTeam: Team | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  realScoreHome: number | null;
  realScoreAway: number | null;
  isBonusMatch: boolean;
  exactCount: number;
  correctResultCount: number;
  totalPredictions: number;
}

interface ResultsClientProps {
  matches: Match[];
}

export default function ResultsClient({ matches }: ResultsClientProps) {
  const [filter, setFilter] = useState<'all' | 'group' | 'knockout'>('all');

  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true;
    if (filter === 'group') return match.stage === 'group';
    return match.stage !== 'group';
  });

  // Group matches by stage
  const matchesByStage: { [key: string]: Match[] } = {};
  filteredMatches.forEach((match) => {
    const stage = match.stage;
    if (!matchesByStage[stage]) {
      matchesByStage[stage] = [];
    }
    matchesByStage[stage].push(match);
  });

  const stageOrder = ['group', 'round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  const stageNames: { [key: string]: string } = {
    group: 'Group Stage',
    round32: 'Round of 32',
    round16: 'Round of 16',
    quarter: 'Quarter-finals',
    semi: 'Semi-finals',
    third: 'Third Place',
    final: 'Final',
  };

  if (matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
          Match Results
        </h1>
        <div className="card text-center py-12">
          <p className="text-slate-500 text-lg">No results yet</p>
          <p className="text-slate-400 mt-2">
            Results will appear here once matches are played
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Match Results
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {matches.length} match{matches.length !== 1 ? 'es' : ''} completed
        </p>
      </div>

      {/* Filter buttons */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'group', 'knockout'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {f === 'all' ? 'All' : f === 'group' ? 'Group Stage' : 'Knockout'}
          </button>
        ))}
      </div>

      {/* Results by stage */}
      <div className="space-y-8">
        {stageOrder.map((stage) => {
          const stageMatches = matchesByStage[stage];
          if (!stageMatches || stageMatches.length === 0) return null;

          return (
            <div key={stage}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                {stageNames[stage]}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stageMatches.map((match) => (
                  <ResultCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({ match }: { match: Match }) {
  const homeName = match.homeTeam?.name ?? match.homePlaceholder ?? 'TBD';
  const awayName = match.awayTeam?.name ?? match.awayPlaceholder ?? 'TBD';
  const homeFlag = match.homeTeam?.flagEmoji ?? '';
  const awayFlag = match.awayTeam?.flagEmoji ?? '';

  const homeWon = match.realScoreHome! > match.realScoreAway!;
  const awayWon = match.realScoreAway! > match.realScoreHome!;

  return (
    <div className={`card ${match.isBonusMatch ? 'ring-2 ring-yellow-400' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-slate-500">Match #{match.matchNumber}</span>
        {match.isBonusMatch && (
          <span className="badge badge-warning">
            <span className="mr-1">⭐</span> Bonus
          </span>
        )}
      </div>

      {/* Score display */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {/* Home team */}
        <div className={`flex-1 text-right ${homeWon ? 'font-bold' : ''}`}>
          <span className="mr-2">{homeFlag}</span>
          <span className="text-slate-900 dark:text-white">{homeName}</span>
        </div>

        {/* Score */}
        <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <span className={`text-2xl font-bold ${homeWon ? 'text-green-600' : ''}`}>
            {match.realScoreHome}
          </span>
          <span className="text-slate-400">-</span>
          <span className={`text-2xl font-bold ${awayWon ? 'text-green-600' : ''}`}>
            {match.realScoreAway}
          </span>
        </div>

        {/* Away team */}
        <div className={`flex-1 text-left ${awayWon ? 'font-bold' : ''}`}>
          <span className="text-slate-900 dark:text-white">{awayName}</span>
          <span className="ml-2">{awayFlag}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
        <div className="grid grid-cols-2 gap-4 text-center text-sm">
          <div>
            <p className="text-green-600 font-semibold">{match.exactCount}</p>
            <p className="text-slate-500">Exact Scores</p>
          </div>
          <div>
            <p className="text-amber-600 font-semibold">{match.correctResultCount}</p>
            <p className="text-slate-500">Correct Results</p>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Out of {match.totalPredictions} predictions
        </p>
      </div>
    </div>
  );
}
