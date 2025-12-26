'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import MatchCard from './MatchCard';

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

interface PredictedQualifiers {
  winners: { [group: string]: Team | null };
  runnersUp: { [group: string]: Team | null };
  bestThirds: Team[];
  isComplete: { [key: string]: boolean };
}

interface KnockoutBracketProps {
  knockoutMatches: Match[];
  isLocked: boolean;
  onSaved?: (matchId: string, prediction: { predictedHome: number; predictedAway: number; predictedWinner: string | null }) => void;
  predictedQualifiers?: PredictedQualifiers;
}

export default function KnockoutBracket({
  knockoutMatches,
  isLocked,
  onSaved,
  predictedQualifiers,
}: KnockoutBracketProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Organize matches by stage
  const stages = {
    round32: knockoutMatches.filter(m => m.stage === 'round32').sort((a, b) => a.matchNumber - b.matchNumber),
    round16: knockoutMatches.filter(m => m.stage === 'round16').sort((a, b) => a.matchNumber - b.matchNumber),
    quarter: knockoutMatches.filter(m => m.stage === 'quarter').sort((a, b) => a.matchNumber - b.matchNumber),
    semi: knockoutMatches.filter(m => m.stage === 'semi').sort((a, b) => a.matchNumber - b.matchNumber),
    final: knockoutMatches.filter(m => m.stage === 'final'),
    third: knockoutMatches.filter(m => m.stage === 'third'),
  };

  // Update scroll state
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScroll = () => {
      setScrollLeft(container.scrollLeft);
      setMaxScroll(container.scrollWidth - container.clientWidth);
    };

    updateScroll();
    container.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);

    return () => {
      container.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  }, []);

  const handleScrollbarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = Number(e.target.value);
    }
  };

  // Build predicted teams map for knockout matches
  const predictedTeams = useMemo(() => {
    if (!predictedQualifiers) return {};

    const result: { [matchId: string]: { home: Team | null; away: Team | null } } = {};
    const matchByNumber: { [num: number]: Match } = {};
    const predictedWinners: { [matchNum: number]: Team | null } = {};
    const predictedLosers: { [matchNum: number]: Team | null } = {};

    knockoutMatches.forEach(m => {
      matchByNumber[m.matchNumber] = m;
    });

    // Map stage codes to match number offsets
    const stageOffsets: { [key: string]: number } = {
      'R32': 72,
      'R16': 88,
      'QF': 96,
      'SF': 100,
    };

    // Helper to resolve placeholder to team
    const resolveTeam = (placeholder: string | null, match: Match): Team | null => {
      if (!placeholder) return null;

      if (placeholder.startsWith('Winner ') && placeholder.split(' ')[1].length === 1) {
        const group = placeholder.split(' ')[1];
        return predictedQualifiers.winners[group] || null;
      }
      if (placeholder.startsWith('Runner-up ')) {
        const group = placeholder.split(' ')[1];
        return predictedQualifiers.runnersUp[group] || null;
      }
      if (placeholder.startsWith('3rd ')) {
        const r32ThirdMatches = stages.round32
          .filter(m => m.awayPlaceholder?.startsWith('3rd '))
          .sort((a, b) => a.matchNumber - b.matchNumber);

        const idx = r32ThirdMatches.findIndex(m => m.id === match.id);
        if (idx >= 0 && predictedQualifiers.bestThirds[idx]) {
          return predictedQualifiers.bestThirds[idx];
        }
        return null;
      }
      const winnerMatch = placeholder.match(/^Winner (R32|R16|QF|SF) M(\d+)$/);
      if (winnerMatch) {
        const [, stage, matchNum] = winnerMatch;
        const matchNumber = stageOffsets[stage] + parseInt(matchNum);
        return predictedWinners[matchNumber] || null;
      }
      const loserMatch = placeholder.match(/^Loser (SF) M(\d+)$/);
      if (loserMatch) {
        const [, stage, matchNum] = loserMatch;
        const matchNumber = stageOffsets[stage] + parseInt(matchNum);
        return predictedLosers[matchNumber] || null;
      }
      if (placeholder.startsWith('Winner Match ')) {
        const num = parseInt(placeholder.split(' ')[2]);
        return predictedWinners[num] || null;
      }
      if (placeholder.startsWith('Loser Match ')) {
        const num = parseInt(placeholder.split(' ')[2]);
        return predictedLosers[num] || null;
      }
      return null;
    };

    const sortedMatches = [...knockoutMatches].sort((a, b) => a.matchNumber - b.matchNumber);

    for (const match of sortedMatches) {
      let homeTeam = match.homeTeam;
      let awayTeam = match.awayTeam;

      if (!homeTeam && match.homePlaceholder) {
        homeTeam = resolveTeam(match.homePlaceholder, match);
      }
      if (!awayTeam && match.awayPlaceholder) {
        awayTeam = resolveTeam(match.awayPlaceholder, match);
      }

      result[match.id] = { home: homeTeam, away: awayTeam };

      const prediction = match.predictions[0];
      if (prediction && homeTeam && awayTeam) {
        const homeScore = prediction.predictedHome;
        const awayScore = prediction.predictedAway;

        let winner: Team | null = null;
        let loser: Team | null = null;

        if (homeScore > awayScore) {
          winner = homeTeam;
          loser = awayTeam;
        } else if (awayScore > homeScore) {
          winner = awayTeam;
          loser = homeTeam;
        } else {
          if (prediction.predictedWinner === 'home') {
            winner = homeTeam;
            loser = awayTeam;
          } else if (prediction.predictedWinner === 'away') {
            winner = awayTeam;
            loser = homeTeam;
          }
        }

        predictedWinners[match.matchNumber] = winner;
        predictedLosers[match.matchNumber] = loser;
      }
    }

    return result;
  }, [knockoutMatches, predictedQualifiers, stages.round32]);

  // Match card dimensions
  const CARD_HEIGHT = 180; // Approximate height of match card
  const CARD_GAP = 16; // Gap between cards in same round

  const renderMatch = (match: Match, index: number, totalInRound: number, roundMultiplier: number) => {
    const predicted = predictedTeams[match.id];

    // Calculate vertical spacing - each subsequent round has double the spacing
    const baseSpacing = CARD_HEIGHT + CARD_GAP;
    const spacing = baseSpacing * roundMultiplier;
    const offset = (spacing - CARD_HEIGHT) / 2;

    return (
      <div
        key={match.id}
        className="flex-shrink-0"
        style={{
          marginTop: index === 0 ? offset : CARD_GAP,
          marginBottom: index === totalInRound - 1 ? offset : 0,
          height: index === 0 && totalInRound > 1 ? undefined : (index < totalInRound - 1 ? spacing - CARD_GAP : undefined),
        }}
      >
        <div className="w-64">
          <MatchCard
            match={match}
            isLocked={isLocked}
            onSaved={onSaved}
            isKnockout
            predictedHomeTeam={predicted?.home || null}
            predictedAwayTeam={predicted?.away || null}
          />
        </div>
      </div>
    );
  };

  // Render a round column with proper bracket spacing
  const renderRound = (matches: Match[], title: string, roundIndex: number) => {
    // roundIndex: 0 = R32, 1 = R16, 2 = QF, 3 = SF, 4 = Final
    const multiplier = Math.pow(2, roundIndex);
    const topOffset = ((CARD_HEIGHT + CARD_GAP) * multiplier - CARD_HEIGHT) / 2;

    return (
      <div className="flex flex-col flex-shrink-0">
        <h3 className="text-center font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4 sticky top-0 bg-background-light dark:bg-background-dark py-2 z-10">
          {title}
        </h3>
        <div
          className="flex flex-col"
          style={{ paddingTop: topOffset }}
        >
          {matches.map((match, idx) => {
            const spacing = (CARD_HEIGHT + CARD_GAP) * multiplier;
            return (
              <div
                key={match.id}
                style={{
                  height: idx < matches.length - 1 ? spacing : undefined,
                }}
              >
                <div className="w-64">
                  <MatchCard
                    match={match}
                    isLocked={isLocked}
                    onSaved={onSaved}
                    isKnockout
                    predictedHomeTeam={predictedTeams[match.id]?.home || null}
                    predictedAwayTeam={predictedTeams[match.id]?.away || null}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Sticky scroll indicator at top */}
      {maxScroll > 0 && (
        <div className="sticky top-0 z-20 bg-surface-light dark:bg-surface-dark p-3 rounded-xl mb-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Scroll
            </span>
            <input
              type="range"
              min="0"
              max={maxScroll}
              value={scrollLeft}
              onChange={handleScrollbarChange}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1">
              Scroll
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-400 dark:text-slate-500 mt-2 px-8">
            <span>R32</span>
            <span>R16</span>
            <span>QF</span>
            <span>SF</span>
            <span className="text-primary">Final</span>
          </div>
        </div>
      )}

      {/* Bracket container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex gap-8 min-w-max p-6">
          {/* Round of 32 */}
          {renderRound(stages.round32, 'Round of 32', 0)}

          {/* Connector lines placeholder */}
          <div className="w-8 flex-shrink-0" />

          {/* Round of 16 */}
          {renderRound(stages.round16, 'Round of 16', 1)}

          {/* Connector lines placeholder */}
          <div className="w-8 flex-shrink-0" />

          {/* Quarter-finals */}
          {renderRound(stages.quarter, 'Quarter-finals', 2)}

          {/* Connector lines placeholder */}
          <div className="w-8 flex-shrink-0" />

          {/* Semi-finals */}
          {renderRound(stages.semi, 'Semi-finals', 3)}

          {/* Connector lines placeholder */}
          <div className="w-8 flex-shrink-0" />

          {/* Final & Third Place */}
          <div className="flex flex-col flex-shrink-0">
            <h3 className="text-center font-black text-lg uppercase tracking-wider text-primary mb-4 sticky top-0 bg-background-light dark:bg-background-dark py-2 z-10 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
              Final
            </h3>
            <div style={{ paddingTop: ((CARD_HEIGHT + CARD_GAP) * 8 - CARD_HEIGHT) / 2 }}>
              <div className="w-72">
                {stages.final.map(match => (
                  <div key={match.id} className="ring-2 ring-primary/30 rounded-xl">
                    <MatchCard
                      match={match}
                      isLocked={isLocked}
                      onSaved={onSaved}
                      isKnockout
                      predictedHomeTeam={predictedTeams[match.id]?.home || null}
                      predictedAwayTeam={predictedTeams[match.id]?.away || null}
                    />
                  </div>
                ))}
              </div>

              {/* Third place below final */}
              <div className="mt-12">
                <h4 className="text-center font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Third Place
                </h4>
                {stages.third.map(match => (
                  <div key={match.id} className="w-64">
                    <MatchCard
                      match={match}
                      isLocked={isLocked}
                      onSaved={onSaved}
                      isKnockout
                      predictedHomeTeam={predictedTeams[match.id]?.home || null}
                      predictedAwayTeam={predictedTeams[match.id]?.away || null}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
