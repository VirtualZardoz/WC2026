import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ProfileClient from './ProfileClient';

async function getUserStats(userId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { userId },
    include: { match: true },
  });

  let totalPoints = 0;
  let exactScores = 0;
  let correctResults = 0;
  let matchesWithResults = 0;

  for (const pred of predictions) {
    if (pred.match.realScoreHome !== null && pred.match.realScoreAway !== null) {
      matchesWithResults++;
      totalPoints += pred.pointsEarned;
      if (pred.pointsEarned === 3) {
        exactScores++;
      } else if (pred.pointsEarned === 1) {
        correctResults++;
      }
    }
  }

  return {
    totalPredictions: predictions.length,
    totalPoints,
    exactScores,
    correctResults,
    matchesWithResults,
    accuracy:
      matchesWithResults > 0
        ? Math.round(((exactScores + correctResults) / matchesWithResults) * 100)
        : 0,
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/profile');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect('/login');
  }

  const stats = await getUserStats(session.user.id);

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      }}
      stats={stats}
    />
  );
}
