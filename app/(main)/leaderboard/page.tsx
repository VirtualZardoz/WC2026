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
  groupPoints: number;
  knockoutPoints: number;
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const users = await prisma.user.findMany({
    include: {
      predictions: {
        include: { match: true },
      },
    },
  });

  // Calculate leaderboard entries
  const leaderboard: LeaderboardEntry[] = users.map((user) => {
    let totalPoints = 0;
    let groupPoints = 0;
    let knockoutPoints = 0;
    let exactScores = 0;
    let correctResults = 0;

    user.predictions.forEach((pred) => {
      totalPoints += pred.pointsEarned;
      if (pred.match.stage === 'group') {
        groupPoints += pred.pointsEarned;
      } else {
        knockoutPoints += pred.pointsEarned;
      }

      if (pred.pointsEarned === 3) {
        exactScores++;
      } else if (pred.pointsEarned === 1 || pred.pointsEarned === 2 || pred.pointsEarned === 4) {
        // Correct result (1) or Correct result + bonus (1+1=2) or Exact + bonus (3+1=4)
        correctResults++;
      }
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      totalPoints,
      groupPoints,
      knockoutPoints,
      exactScores,
      correctResults,
      predictedCount: user.predictions.length,
    };
  });

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
