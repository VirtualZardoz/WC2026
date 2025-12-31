'use client';

import { useState, useMemo } from 'react';

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
  venue?: string | null;
  matchDate?: Date | string | null;
}

interface ResultsClientProps {
  matches: Match[];
}

type StageFilter = 'all' | 'group' | 'round32' | 'knockout' | 'finals';

export default function ResultsClient({ matches }: ResultsClientProps) {
  const [filter, setFilter] = useState<StageFilter>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  const stageNames: { [key: string]: string } = {
    group: 'Group Stage',
    round32: 'Round of 32',
    round16: 'Round of 16',
    quarter: 'Quarter-finals',
    semi: 'Semi-finals',
    third: 'Third Place',
    final: 'Final',
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'all') return true;
    if (filter === 'group') return match.stage === 'group';
    if (filter === 'round32') return match.stage === 'round32';
    if (filter === 'knockout') return ['round16', 'quarter', 'semi'].includes(match.stage);
    if (filter === 'finals') return ['third', 'final'].includes(match.stage);
    return true;
  });

  // Sort by match number descending (newest first)
  const sortedMatches = [...filteredMatches].sort((a, b) => b.matchNumber - a.matchNumber);

  // Get latest match for the featured card
  const latestMatch = matches.length > 0
    ? [...matches].sort((a, b) => b.matchNumber - a.matchNumber)[0]
    : null;

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalGoals = matches.reduce((sum, m) =>
      sum + (m.realScoreHome || 0) + (m.realScoreAway || 0), 0);
    const totalExact = matches.reduce((sum, m) => sum + m.exactCount, 0);
    const totalCorrect = matches.reduce((sum, m) => sum + m.correctResultCount, 0);
    const totalPredictions = matches.reduce((sum, m) => sum + m.totalPredictions, 0);
    const avgAccuracy = totalPredictions > 0
      ? Math.round((totalCorrect / totalPredictions) * 100)
      : 0;

    return { totalGoals, totalExact, avgAccuracy, matchCount: matches.length };
  }, [matches]);

  const getExactPercent = (match: Match) =>
    match.totalPredictions > 0
      ? Math.round((match.exactCount / match.totalPredictions) * 100)
      : 0;

  const getCorrectPercent = (match: Match) =>
    match.totalPredictions > 0
      ? Math.round((match.correctResultCount / match.totalPredictions) * 100)
      : 0;

  if (matches.length === 0) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-3 mb-8">
          <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
            Match Results
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl">
            Official scores and community prediction statistics for FIFA World Cup 2026.
          </p>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">sports_score</span>
          <p className="text-slate-500 dark:text-slate-400 text-lg">No results yet</p>
          <p className="text-slate-400 dark:text-slate-500 mt-2">
            Results will appear here once matches are played
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Heading */}
      <div className="flex flex-col gap-3 mb-8">
        <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
          Match Results
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-2xl">
          Official scores and community prediction statistics for FIFA World Cup 2026. See how your predictions stacked up against reality.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 mb-8">
        {[
          { key: 'all', label: 'All Matches', icon: 'view_list' },
          { key: 'group', label: 'Group Stage' },
          { key: 'round32', label: 'Round of 32' },
          { key: 'knockout', label: 'Knockout Stage' },
          { key: 'finals', label: 'Finals' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as StageFilter)}
            className={`flex h-9 items-center justify-center gap-x-2 rounded-lg px-4 transition-all active:scale-95 ${
              filter === f.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {f.icon && <span className="material-symbols-outlined text-[18px]">{f.icon}</span>}
            <span className={`text-sm ${filter === f.key ? 'font-bold' : 'font-medium'}`}>{f.label}</span>
          </button>
        ))}
      </div>

      {/* Featured Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Latest Result Card */}
        {latestMatch && (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                  Latest Result
                </span>
                <h3 className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Match {latestMatch.matchNumber} • {stageNames[latestMatch.stage] || latestMatch.stage}
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Result Finalized</span>
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl shadow-inner">
                  {latestMatch.homeTeam?.flagEmoji || ''}
                </div>
                <span className="font-bold text-lg text-center text-slate-900 dark:text-white">
                  {latestMatch.homeTeam?.name || latestMatch.homePlaceholder || 'TBD'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">
                  {latestMatch.realScoreHome} - {latestMatch.realScoreAway}
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  FT
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="size-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl shadow-inner">
                  {latestMatch.awayTeam?.flagEmoji || ''}
                </div>
                <span className="font-bold text-lg text-center text-slate-900 dark:text-white">
                  {latestMatch.awayTeam?.name || latestMatch.awayPlaceholder || 'TBD'}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-4">
              <div className="flex-1 bg-bg-light dark:bg-bg-dark rounded-lg p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">target</span>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Exact Score</span>
                  <span className="font-bold text-sm">{latestMatch.exactCount} Users ({getExactPercent(latestMatch)}%)</span>
                </div>
              </div>
              <div className="flex-1 bg-bg-light dark:bg-bg-dark rounded-lg p-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Correct Result</span>
                  <span className="font-bold text-sm">{latestMatch.correctResultCount} Users ({getCorrectPercent(latestMatch)}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary Card */}
        <div className="bg-primary text-white rounded-xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-10 -top-10 text-white/10">
            <span className="material-symbols-outlined text-[200px]">trophy</span>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Competition Overview</h3>
            <p className="text-white/80 text-sm">Total stats across all {stats.matchCount} matches played so far.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-black">{stats.totalGoals}</div>
              <div className="text-sm font-medium text-white/80">Goals Scored</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-black">{stats.avgAccuracy}%</div>
              <div className="text-sm font-medium text-white/80">Avg. Accuracy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-2xl font-black">{stats.totalExact}</div>
                <div className="text-sm font-medium text-white/80">Total Exact Predictions</div>
              </div>
              <span className="material-symbols-outlined">trending_up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {filter === 'all' ? 'All Matches' : filter === 'group' ? 'Group Stage' : filter === 'round32' ? 'Round of 32' : filter === 'knockout' ? 'Knockout Matches' : 'Finals'}
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''}
          </span>
        </div>

        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 md:px-6 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-1/4">Match Info</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-right w-1/6">Home</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-center w-24">Score</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider text-left w-1/6">Away</th>
                  <th className="py-3 px-4 md:px-6 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider w-1/4">Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedMatches.slice(0, visibleCount).map((match) => {
                  const homeName = match.homeTeam?.name || match.homePlaceholder || 'TBD';
                  const awayName = match.awayTeam?.name || match.awayPlaceholder || 'TBD';
                  const homeCode = match.homeTeam?.code || homeName.substring(0, 3).toUpperCase();
                  const awayCode = match.awayTeam?.code || awayName.substring(0, 3).toUpperCase();

                  return (
                    <tr key={match.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            Match {match.matchNumber} • {stageNames[match.stage] || match.stage}
                            {match.isBonusMatch && (
                              <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                Bonus
                              </span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {match.group && (
                              <>
                                <span className="material-symbols-outlined text-[14px]">groups</span>
                                <span>Group {match.group}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-semibold text-slate-900 dark:text-white hidden sm:block">{homeName}</span>
                          <span className="font-semibold text-slate-900 dark:text-white sm:hidden">{homeCode}</span>
                          <div className="size-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-lg border border-black/10">
                            {match.homeTeam?.flagEmoji || ''}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-bg-light dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-black text-lg tracking-widest text-slate-900 dark:text-white">
                          {match.realScoreHome} - {match.realScoreAway}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-start gap-3">
                          <div className="size-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-lg border border-black/10">
                            {match.awayTeam?.flagEmoji || ''}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white hidden sm:block">{awayName}</span>
                          <span className="font-semibold text-slate-900 dark:text-white sm:hidden">{awayCode}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 md:px-6">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            <span className="material-symbols-outlined text-[16px]">target</span>
                            <span className="text-xs font-bold whitespace-nowrap">{getExactPercent(match)}% Exact</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            <span className="text-xs font-bold whitespace-nowrap">{getCorrectPercent(match)}% Correct</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Load More Button */}
        {sortedMatches.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="w-full md:w-auto md:self-center bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white px-6 py-3 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <span>Load More Results</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        )}
      </div>
    </div>
  );
}
