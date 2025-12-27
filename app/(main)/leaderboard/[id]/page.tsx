import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

interface UserDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: UserDetailPageProps): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  return {
    title: user ? `${user.name}'s Predictions - World Cup 2026` : 'User Not Found',
  };
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const [user, bonusMatches] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.id },
      include: {
        predictions: {
          include: {
            match: {
              include: {
                homeTeam: true,
                awayTeam: true,
              },
            },
          },
          orderBy: {
            match: {
              matchNumber: 'asc',
            },
          },
        },
      },
    }),
    prisma.match.findMany({
      where: { isBonusMatch: true },
      select: { id: true },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const bonusMatchIds = new Set(bonusMatches.map((m) => m.id));

  const totalPoints = user.predictions.reduce((sum, p) => sum + p.pointsEarned, 0);
  const exactScores = user.predictions.filter((p) => p.pointsEarned === 3).length;
  const correctResults = user.predictions.filter((p) => p.pointsEarned === 1 || p.pointsEarned === 2).length;

  // Bonus match stats
  const bonusPredictions = user.predictions.filter((p) => bonusMatchIds.has(p.matchId));
  const bonusMatchExact = bonusPredictions.filter((p) => p.pointsEarned >= 3).length;
  const bonusMatchPoints = bonusPredictions.reduce((sum, p) => sum + p.pointsEarned, 0);
  const bonusMatchesPlayed = bonusPredictions.filter((p) => p.match.realScoreHome !== null).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/leaderboard" className="text-primary-600 hover:underline mb-4 inline-block">
          &larr; Back to Leaderboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {user.name}&apos;s Predictions
        </h1>
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="card px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-primary-600">{totalPoints}</span>
            <span className="text-sm text-slate-500 uppercase tracking-wider">Total Points</span>
          </div>
          <div className="card px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-green-600">{exactScores}</span>
            <span className="text-sm text-slate-500 uppercase tracking-wider">Exact Scores</span>
          </div>
          <div className="card px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-amber-600">{correctResults}</span>
            <span className="text-sm text-slate-500 uppercase tracking-wider">Correct Results</span>
          </div>
          <div className="card px-6 py-4 flex flex-col items-center">
            <span className="text-3xl font-bold text-slate-600">{user.predictions.length}/104</span>
            <span className="text-sm text-slate-500 uppercase tracking-wider">Matches Predicted</span>
          </div>
          {bonusMatches.length > 0 && (
            <div className="card px-6 py-4 flex flex-col items-center bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">star</span>
                <span className="text-3xl font-bold text-amber-600">{bonusMatchExact}/{bonusMatchesPlayed}</span>
              </div>
              <span className="text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider">Bonus Exact</span>
              <span className="text-xs text-amber-600 dark:text-amber-500 mt-1">{bonusMatchPoints} pts</span>
            </div>
          )}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800">
                <th className="px-4 py-3 text-left">Match</th>
                <th className="px-4 py-3 text-center">Prediction</th>
                <th className="px-4 py-3 text-center">Real Result</th>
                <th className="px-4 py-3 text-center">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {user.predictions.map((p) => {
                const isBonus = bonusMatchIds.has(p.matchId);
                return (
                <tr key={p.id} className={isBonus ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                        {isBonus && <span className="material-symbols-outlined text-amber-500 text-sm">star</span>}
                        #{p.match.matchNumber} - {p.match.stage.toUpperCase()} {p.match.group ? `Group ${p.match.group}` : ''}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-900 dark:text-white w-24 text-right">
                          {p.match.homeTeam?.name || p.match.homePlaceholder}
                        </span>
                        <span className="text-slate-400">vs</span>
                        <span className="font-medium text-slate-900 dark:text-white w-24">
                          {p.match.awayTeam?.name || p.match.awayPlaceholder}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">
                      <span className="font-bold mr-1">{p.predictedHome}</span>
                      <span className="text-slate-400">-</span>
                      <span className="font-bold ml-1">{p.predictedAway}</span>
                      {p.predictedWinner && (
                        <span className="ml-2 text-xs text-primary-600">
                          ({p.predictedWinner === 'home' ? 'H' : 'A'})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {p.match.realScoreHome !== null ? (
                      <div className="inline-flex items-center px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md border border-green-100 dark:border-green-900/30">
                        <span className="font-bold mr-1">{p.match.realScoreHome}</span>
                        <span className="text-green-300 dark:text-green-700">-</span>
                        <span className="font-bold ml-1">{p.match.realScoreAway}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">TBD</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-lg font-bold ${
                      p.pointsEarned === 3 ? 'text-green-600' : 
                      p.pointsEarned >= 1 ? 'text-primary-600' : 
                      'text-slate-400'
                    }`}>
                      {p.pointsEarned}
                    </span>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
