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
  const user = await prisma.user.findUnique({
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
  });

  if (!user) {
    notFound();
  }

  const totalPoints = user.predictions.reduce((sum, p) => sum + p.pointsEarned, 0);
  const exactScores = user.predictions.filter((p) => p.pointsEarned === 3).length;
  const correctResults = user.predictions.filter((p) => p.pointsEarned === 1 || p.pointsEarned === 2).length;
  const knockoutBonus = user.predictions.filter((p) => p.match.stage !== 'group' && p.pointsEarned % 2 === 0 && p.pointsEarned > 0 && p.predictedHome !== p.match.realScoreHome).length;
  // Note: knockout bonus is 1 point. If they got result (1) + bonus (1) = 2. If they got exact (3) + bonus (1) = 4.
  // Actually the logic in the API was:
  // exact: 3
  // result: 1
  // knockout bonus: +1
  // So:
  // Exact + Bonus = 4
  // Result + Bonus = 2
  // Only Bonus = 1 (but this only happens if they got result wrong but winner right, which is impossible if they got winner right they must have got result right, unless it's a draw and they picked wrong winner but right draw? No, if it's a draw they get 1 point for result 'draw'. If they also get the qualifier right they get +1. So 2 points.)
  // Wait, if they predict 1-1 winner home, and it's 2-2 winner home -> result 'draw' (1pt) + bonus (1pt) = 2pts.
  // If they predict 1-1 winner home, and it's 2-2 winner away -> result 'draw' (1pt) + bonus (0pt) = 1pt.
  // If they predict 2-1, and it's 3-0 -> result 'home' (1pt) + bonus (1pt) = 2pts.

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
              {user.predictions.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 mb-1">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
