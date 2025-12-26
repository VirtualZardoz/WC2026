'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import MatchCard from '@/components/MatchCard';
import KnockoutBracket from '@/components/KnockoutBracket';

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

interface TeamStanding {
  id: string;
  team: Team;
  pts: number;
  gp: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
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

// Calculate predicted standings for a group based on user predictions
function calculatePredictedGroupStandings(groupMatches: Match[]): TeamStanding[] {
  const teams: { [key: string]: TeamStanding } = {};

  // Initialize teams from group matches
  groupMatches.forEach((match) => {
    if (match.homeTeamId && match.homeTeam && !teams[match.homeTeamId]) {
      teams[match.homeTeamId] = {
        id: match.homeTeamId,
        team: match.homeTeam,
        pts: 0, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0,
      };
    }
    if (match.awayTeamId && match.awayTeam && !teams[match.awayTeamId]) {
      teams[match.awayTeamId] = {
        id: match.awayTeamId,
        team: match.awayTeam,
        pts: 0, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0,
      };
    }
  });

  // Calculate points from predictions
  groupMatches.forEach((match) => {
    const prediction = match.predictions[0];
    if (!prediction || !match.homeTeamId || !match.awayTeamId) return;
    if (!teams[match.homeTeamId] || !teams[match.awayTeamId]) return;

    const homeGoals = prediction.predictedHome;
    const awayGoals = prediction.predictedAway;

    teams[match.homeTeamId].gp++;
    teams[match.awayTeamId].gp++;
    teams[match.homeTeamId].gf += homeGoals;
    teams[match.homeTeamId].ga += awayGoals;
    teams[match.awayTeamId].gf += awayGoals;
    teams[match.awayTeamId].ga += homeGoals;

    if (homeGoals > awayGoals) {
      teams[match.homeTeamId].pts += 3;
      teams[match.homeTeamId].w++;
      teams[match.awayTeamId].l++;
    } else if (homeGoals < awayGoals) {
      teams[match.awayTeamId].pts += 3;
      teams[match.awayTeamId].w++;
      teams[match.homeTeamId].l++;
    } else {
      teams[match.homeTeamId].pts += 1;
      teams[match.awayTeamId].pts += 1;
      teams[match.homeTeamId].d++;
      teams[match.awayTeamId].d++;
    }
  });

  // Finalize GD and sort
  const standings = Object.values(teams).map((team) => ({
    ...team,
    gd: team.gf - team.ga,
  }));

  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.team.name.localeCompare(b.team.name);
  });

  return standings;
}

export default function PredictionsClient({
  matchesByGroup: initialMatchesByGroup,
  knockoutMatches: initialKnockoutMatches,
  totalMatches,
  predictedMatches: initialPredicted,
  isLocked,
  deadline,
  initialTab = 'group',
}: PredictionsClientProps) {
  const [activeTab, setActiveTab] = useState<'group' | 'knockout'>(initialTab);
  const [knockoutView, setKnockoutView] = useState<'grid' | 'bracket'>('bracket');
  const [predictedCount, setPredictedCount] = useState(initialPredicted);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [matchesByGroup, setMatchesByGroup] = useState(initialMatchesByGroup);
  const [knockoutMatches, setKnockoutMatches] = useState(initialKnockoutMatches);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const handlePredictionSaved = useCallback((matchId: string, prediction: { predictedHome: number; predictedAway: number; predictedWinner: string | null }) => {
    // Update the match predictions in our local state
    const allGroupMatches = Object.values(matchesByGroup).flat();
    const groupMatch = allGroupMatches.find(m => m.id === matchId);

    if (groupMatch) {
      // Update group match prediction
      setMatchesByGroup(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(group => {
          updated[group] = updated[group].map(m =>
            m.id === matchId
              ? { ...m, predictions: [{ id: 'temp', ...prediction }] }
              : m
          );
        });
        return updated;
      });
    } else {
      // Update knockout match prediction
      setKnockoutMatches(prev => prev.map(m =>
        m.id === matchId
          ? { ...m, predictions: [{ id: 'temp', ...prediction }] }
          : m
      ));
    }

    setPredictedCount((prev) => prev + 1);
    setRefreshTrigger(prev => prev + 1);
  }, [matchesByGroup]);

  const progressPercent = Math.round((predictedCount / totalMatches) * 100);

  const groups = Object.keys(matchesByGroup).sort();

  // Calculate predicted standings and qualifiers for knockout stage (only when on knockout tab)
  const predictedQualifiers = useMemo(() => {
    // Skip heavy calculation if not viewing knockout
    if (activeTab !== 'knockout') {
      return { standings: {}, winners: {}, runnersUp: {}, bestThirds: [], isComplete: {} };
    }
    const standings: { [key: string]: TeamStanding[] } = {};
    const isComplete: { [key: string]: boolean } = {};
    const winners: { [group: string]: Team | null } = {};
    const runnersUp: { [group: string]: Team | null } = {};
    const thirds: TeamStanding[] = [];

    groups.forEach(group => {
      const groupMatches = matchesByGroup[group];
      const predictedCount = groupMatches.filter(m => m.predictions.length > 0).length;
      isComplete[group] = predictedCount === 6;

      if (isComplete[group]) {
        standings[group] = calculatePredictedGroupStandings(groupMatches);
        winners[group] = standings[group][0]?.team || null;
        runnersUp[group] = standings[group][1]?.team || null;
        if (standings[group][2]) {
          thirds.push(standings[group][2]);
        }
      } else {
        standings[group] = [];
        winners[group] = null;
        runnersUp[group] = null;
      }
    });

    // Sort third-place teams to find best 8
    thirds.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return 0;
    });

    const bestThirds = thirds.slice(0, 8).map(s => s.team);

    return { standings, winners, runnersUp, bestThirds, isComplete };
  }, [matchesByGroup, groups, activeTab]);

  // Organize knockout matches by stage
  const knockoutByStage: { [key: string]: Match[] } = {};
  knockoutMatches.forEach((match) => {
    if (!knockoutByStage[match.stage]) {
      knockoutByStage[match.stage] = [];
    }
    knockoutByStage[match.stage].push(match);
  });

  // Build predicted teams map for knockout matches (for grid view)
  const predictedTeamsMap = useMemo(() => {
    // Skip if not viewing knockout grid
    if (activeTab !== 'knockout' || knockoutView !== 'grid') {
      return {};
    }

    const result: { [matchId: string]: { home: Team | null; away: Team | null } } = {};
    const predictedWinners: { [matchNum: number]: Team | null } = {};
    const predictedLosers: { [matchNum: number]: Team | null } = {};

    const stageOffsets: { [key: string]: number } = {
      'R32': 72,
      'R16': 88,
      'QF': 96,
      'SF': 100,
    };

    const round32Matches = knockoutMatches
      .filter(m => m.stage === 'round32')
      .sort((a, b) => a.matchNumber - b.matchNumber);

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
        const r32ThirdMatches = round32Matches
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
  }, [knockoutMatches, predictedQualifiers, activeTab, knockoutView]);

  const stageOrder = ['round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  const stageNames: { [key: string]: string } = {
    round32: 'Round of 32',
    round16: 'Round of 16',
    quarter: 'Quarter-finals',
    semi: 'Semi-finals',
    third: 'Third Place',
    final: 'Final',
  };

  // Parse countdown into days, hours, minutes
  const parseTimeLeft = (time: string) => {
    const match = time.match(/(\d+)d\s+(\d+)h\s+(\d+)m/);
    if (match) {
      return { days: match[1], hours: match[2], mins: match[3] };
    }
    return { days: '0', hours: '0', mins: '0' };
  };

  const countdown = parseTimeLeft(timeLeft);

  // Calculate completion per group
  const getGroupCompletion = (group: string) => {
    const matches = matchesByGroup[group];
    const predicted = matches.filter(m => m.predictions.length > 0).length;
    return { predicted, total: matches.length };
  };

  // Scroll to group
  const scrollToGroup = (group: string) => {
    const element = document.getElementById(`group-${group.toLowerCase()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Page Heading & Status Bar */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            My Predictions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            Submit scores for all matches. Good luck!
          </p>
        </div>

        {/* Stats & Timer Card */}
        <div className="flex flex-col sm:flex-row gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800/50">
          {/* Progress */}
          <div className="flex flex-col justify-center min-w-[200px] gap-2 border-r-0 sm:border-r border-slate-200 dark:border-slate-700 pr-0 sm:pr-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Progress
              </span>
              <span className="text-sm font-bold text-primary">
                {predictedCount}/{totalMatches}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">{progressPercent}% Complete</p>
          </div>

          {/* Timer */}
          {!isLocked ? (
            <div className="flex items-center gap-3 pl-0 sm:pl-2">
              <div className="flex flex-col items-center">
                <div className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 min-w-[36px] text-center">
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-white">
                    {countdown.days.padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] uppercase mt-1 text-slate-500">Days</span>
              </div>
              <span className="font-bold text-slate-300 dark:text-slate-600 -mt-4">:</span>
              <div className="flex flex-col items-center">
                <div className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 min-w-[36px] text-center">
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-white">
                    {countdown.hours.padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] uppercase mt-1 text-slate-500">Hrs</span>
              </div>
              <span className="font-bold text-slate-300 dark:text-slate-600 -mt-4">:</span>
              <div className="flex flex-col items-center">
                <div className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-1 min-w-[36px] text-center">
                  <span className="text-lg font-bold font-mono text-slate-800 dark:text-white">
                    {countdown.mins.padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] uppercase mt-1 text-slate-500">Min</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-0 sm:pl-2 text-red-500">
              <span className="material-symbols-outlined">lock</span>
              <span className="font-bold">Locked</span>
            </div>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <span className="material-symbols-outlined">warning</span>
          <p><strong>Predictions are locked.</strong> The deadline has passed and you can no longer edit your predictions.</p>
        </div>
      )}

      {/* Stage Filters - Sticky */}
      <div className="sticky top-0 z-20 bg-background-light dark:bg-background-dark pt-2 pb-4 mb-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stage Toggle */}
          <div className="bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm inline-flex">
            <button
              onClick={() => setActiveTab('group')}
              className={`px-5 py-2 rounded-md font-medium transition-all text-sm ${
                activeTab === 'group'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Group Stage
            </button>
            <button
              onClick={() => setActiveTab('knockout')}
              className={`px-5 py-2 rounded-md font-medium transition-all text-sm ${
                activeTab === 'knockout'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Knockout Stage
            </button>
          </div>

          {/* Jump to Group (only show for group stage) */}
          {activeTab === 'group' && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full lg:max-w-2xl">
              <span className="text-xs font-semibold text-slate-400 mr-2 uppercase tracking-wide whitespace-nowrap">
                Jump to:
              </span>
              {groups.map((group) => (
                <button
                  key={group}
                  onClick={() => scrollToGroup(group)}
                  className="size-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 transition-colors"
                >
                  {group}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Group Stage */}
      {activeTab === 'group' && (
        <div className="space-y-8">
          {groups.map((group) => {
            const completion = getGroupCompletion(group);
            return (
              <div key={group} id={`group-${group.toLowerCase()}`} className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-primary rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Group {group}
                  </h3>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    {completion.predicted}/{completion.total} predicted
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
            );
          })}
        </div>
      )}

      {/* Knockout Stage */}
      {activeTab === 'knockout' && (
        <div className="space-y-8">
          {/* View Toggle */}
          <div className="flex justify-end">
            <div className="bg-surface-light dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm inline-flex">
              <button
                type="button"
                onClick={() => setKnockoutView('bracket')}
                className={`px-4 py-2 rounded-md font-medium transition-all text-sm flex items-center gap-2 ${
                  knockoutView === 'bracket'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg">account_tree</span>
                Bracket
              </button>
              <button
                type="button"
                onClick={() => setKnockoutView('grid')}
                className={`px-4 py-2 rounded-md font-medium transition-all text-sm flex items-center gap-2 ${
                  knockoutView === 'grid'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
                Grid
              </button>
            </div>
          </div>

          {knockoutView === 'bracket' ? (
            <KnockoutBracket
              knockoutMatches={knockoutMatches}
              isLocked={isLocked}
              onSaved={handlePredictionSaved}
              predictedQualifiers={predictedQualifiers}
            />
          ) : (
            stageOrder.map((stage) => {
              const matches = knockoutByStage[stage];
              if (!matches || matches.length === 0) return null;

              const predictedInStage = matches.filter(m => m.predictions.length > 0).length;

              return (
                <div key={stage} className="scroll-mt-32">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-purple-500 rounded-full" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {stageNames[stage]}
                    </h3>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                      {predictedInStage}/{matches.length} predicted
                    </span>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {matches.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        isLocked={isLocked}
                        onSaved={handlePredictionSaved}
                        isKnockout
                        predictedHomeTeam={predictedTeamsMap[match.id]?.home || null}
                        predictedAwayTeam={predictedTeamsMap[match.id]?.away || null}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
