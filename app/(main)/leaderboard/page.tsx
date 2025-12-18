import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import LeaderboardClient from './LeaderboardClient';

interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  totalPoints: number;
  exactScores: number;
  correctResults: number;
  predictedCount: number;
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    where: { role: 'user' },
    include: {
      predictions: {
        where: {
          pointsEarned: { gt: 0 },
        },
      },
    },
  });

  // Calculate leaderboard entries
  const leaderboard: LeaderboardEntry[] = [];

  for (const user of users) {
    const totalPredictions = await prisma.prediction.count({
      where: { userId: user.id },
    });

    const predictions = await prisma.prediction.findMany({
      where: { userId: user.id },
      include: { match: true },
    });

    let totalPoints = 0;
    let exactScores = 0;
    let correctResults = 0;

    for (const pred of predictions) {
      totalPoints += pred.pointsEarned;
      if (pred.pointsEarned === 3) {
        exactScores++;
      } else if (pred.pointsEarned === 1) {
        correctResults++;
      }
    }

    leaderboard.push({
      id: user.id,
      name: user.name,
      email: user.email,
      totalPoints,
      exactScores,
      correctResults,
      predictedCount: totalPredictions,
    });
  }

  // Sort by total points, then exact scores, then name
  leaderboard.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.exactScores !== a.exactScores) {
      return b.exactScores - a.exactScores;
    }
    return a.name.localeCompare(b.name);
  });

  return leaderboard;
}

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions);
  const leaderboard = await getLeaderboard();

  return (
    <LeaderboardClient
      leaderboard={leaderboard}
      currentUserId={session?.user?.id}
    />
  );
}
