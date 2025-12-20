'use client';

import { useState, useEffect } from 'react';
import MatchCard from '@/components/MatchCard';

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

interface PredictionsClientProps {
  matchesByGroup: { [key: string]: Match[] };
  knockoutMatches: Match[];
  totalMatches: number;
  predictedMatches: number;
  isLocked: boolean;
  deadline: string | null;
  initialTab?: 'group' | 'knockout';
}

export default function PredictionsClient({
  matchesByGroup,
  knockoutMatches,
  totalMatches,
  predictedMatches: initialPredicted,
  isLocked,
  deadline,
  initialTab = 'group',
}: PredictionsClientProps) {
  const [activeTab, setActiveTab] = useState<'group' | 'knockout'>(initialTab);
  const [predictedCount, setPredictedCount] = useState(initialPredicted);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Countdown timer
  useEffect(() => {
    if (!deadline) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setTimeLeft('Predictions locked');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const handlePredictionSaved = () => {
    setPredictedCount((prev) => prev + 1);
  };

  const progressPercent = Math.round((predictedCount / totalMatches) * 100);

  const groups = Object.keys(matchesByGroup).sort();

  // Organize knockout matches by stage
  const knockoutByStage: { [key: string]: Match[] } = {};
  knockoutMatches.forEach((match) => {
    if (!knockoutByStage[match.stage]) {
      knockoutByStage[match.stage] = [];
    }
    knockoutByStage[match.stage].push(match);
  });

  const stageOrder = ['round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  const stageNames: { [key: string]: string } = {
    round32: 'Round of 32',
    round16: 'Round of 16',
    quarter: 'Quarter-finals',
    semi: 'Semi-finals',
    third: 'Third Place',
    final: 'Final',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          My Predictions
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Enter your predictions for all 104 matches
        </p>
      </div>

      {/* Progress and Deadline */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Progress
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {predictedCount}/{totalMatches} ({progressPercent}%)
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="text-center sm:text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Deadline
            </p>
            {isLocked ? (
              <p className="text-lg font-semibold text-red-600">
                Predictions Locked
              </p>
            ) : (
              <p className="text-lg font-semibold text-primary-600">
                {timeLeft}
              </p>
            )}
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="alert-warning mb-8">
          <strong>Predictions are locked.</strong> The deadline has passed and you can no longer edit your predictions.
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === 'group'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Group Stage (72 matches)
        </button>
        <button
          onClick={() => setActiveTab('knockout')}
          className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors ${
            activeTab === 'knockout'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Knockout Stage (32 matches)
        </button>
      </div>

      {/* Group Stage */}
      {activeTab === 'group' && (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Group {group}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matchesByGroup[group].map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    isLocked={isLocked}
                    onSaved={handlePredictionSaved}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Knockout Stage */}
      {activeTab === 'knockout' && (
        <div className="space-y-8">
          {stageOrder.map((stage) => {
            const matches = knockoutByStage[stage];
            if (!matches || matches.length === 0) return null;

            return (
              <div key={stage}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {stageNames[stage]}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isLocked={isLocked}
                      onSaved={handlePredictionSaved}
                      isKnockout
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
