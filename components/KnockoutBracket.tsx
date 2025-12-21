'use client';

import React from 'react';
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
}

interface KnockoutBracketProps {
  knockoutMatches: Match[];
  isLocked: boolean;
  onSaved?: () => void;
}

export default function KnockoutBracket({
  knockoutMatches,
  isLocked,
  onSaved,
}: KnockoutBracketProps) {
  // Organize matches by stage
  const stages = {
    round32: knockoutMatches.filter(m => m.stage === 'round32').sort((a, b) => a.matchNumber - b.matchNumber),
    round16: knockoutMatches.filter(m => m.stage === 'round16').sort((a, b) => a.matchNumber - b.matchNumber),
    quarter: knockoutMatches.filter(m => m.stage === 'quarter').sort((a, b) => a.matchNumber - b.matchNumber),
    semi: knockoutMatches.filter(m => m.stage === 'semi').sort((a, b) => a.matchNumber - b.matchNumber),
    final: knockoutMatches.filter(m => m.stage === 'final'),
    third: knockoutMatches.filter(m => m.stage === 'third'),
  };

  const stageNames: { [key: string]: string } = {
    round32: 'Round of 32',
    round16: 'Round of 16',
    quarter: 'Quarter-finals',
    semi: 'Semi-finals',
    final: 'Final',
  };

  const renderMatch = (match: Match) => (
    <div key={match.id} className="w-64 flex-shrink-0">
      <MatchCard
        match={match}
        isLocked={isLocked}
        onSaved={onSaved}
        isKnockout
      />
    </div>
  );

  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex gap-8 min-w-max p-4">
        {/* Round of 32 */}
        <div className="flex flex-col gap-4">
          <h3 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-2">{stageNames.round32}</h3>
          <div className="flex flex-col gap-4">
            {stages.round32.map(renderMatch)}
          </div>
        </div>

        {/* Round of 16 */}
        <div className="flex flex-col gap-4 pt-16">
          <h3 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-2">{stageNames.round16}</h3>
          <div className="flex flex-col gap-[calc(256px+32px)]"> {/* Approximate spacing */}
             {stages.round16.map(renderMatch)}
          </div>
        </div>

        {/* Quarters */}
        <div className="flex flex-col gap-4 pt-48">
          <h3 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-2">{stageNames.quarter}</h3>
          <div className="flex flex-col gap-[calc(512px+64px)]">
            {stages.quarter.map(renderMatch)}
          </div>
        </div>

        {/* Semis */}
        <div className="flex flex-col gap-4 pt-[200px]">
          <h3 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-2">{stageNames.semi}</h3>
          <div className="flex flex-col gap-[calc(1024px+128px)]">
            {stages.semi.map(renderMatch)}
          </div>
        </div>

        {/* Final & Third Place */}
        <div className="flex flex-col gap-12 pt-[400px]">
          <div>
            <h3 className="text-center font-bold text-primary-600 mb-2">{stageNames.final}</h3>
            {stages.final.map(renderMatch)}
          </div>
          <div>
            <h3 className="text-center font-bold text-slate-500 mb-2">Third Place</h3>
            {stages.third.map(renderMatch)}
          </div>
        </div>
      </div>
    </div>
  );
}
