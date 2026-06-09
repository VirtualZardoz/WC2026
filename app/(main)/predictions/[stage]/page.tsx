import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PredictionsClient from '../PredictionsClient';

async function getMatchesWithPredictions(userId: string) {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: {
        where: { userId },
      },
    },
    orderBy: { matchNumber: 'asc' },
  });

  // Serialize dates for client component
  return matches.map(m => ({
    ...m,
    matchDate: m.matchDate?.toISOString() || null,
  }));
}

async function getTournament() {
  const tournament = await prisma.tournament.findFirst({
    where: { isActive: true },
  });
  return tournament;
}

export default async function PredictionsStagePage({ params }: { params: { stage: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/login?callbackUrl=/predictions/${params.stage}`);
  }

  const [matches, tournament] = await Promise.all([
    getMatchesWithPredictions(session.user.id),
    getTournament(),
  ]);

  const isLocked = tournament
    ? new Date() > new Date(tournament.predictionDeadline)
    : false;

  // Calculate progress
  const totalMatches = matches.length;
  const predictedMatches = matches.filter(
    (m) => m.predictions.length > 0
  ).length;

  const stage = params.stage; // 'group' or 'knockout'

  // Group matches by stage and group
  const groupMatches = matches.filter((m) => m.stage === 'group');
  const knockoutMatches = matches.filter((m) => m.stage !== 'group');

  // Filter knockout matches based on stage param, but ALWAYS include all group matches
  // so the client can compute predictedQualifiers for the knockout bracket.
  const filteredKnockoutMatches = stage === 'knockout' ? knockoutMatches : (stage === 'group' ? [] : knockoutMatches);

  // Organize ALL group matches by group letter regardless of stage param.
  // The knockout bracket needs group predictions to populate its slots.
  const matchesByGroup: { [key: string]: typeof matches } = {};
  groupMatches.forEach((match) => {
    const group = match.group || 'Unknown';
    if (!matchesByGroup[group]) {
      matchesByGroup[group] = [];
    }
    matchesByGroup[group].push(match);
  });

  return (
    <PredictionsClient
      matchesByGroup={matchesByGroup}
      knockoutMatches={filteredKnockoutMatches}
      totalMatches={totalMatches}
      predictedMatches={predictedMatches}
      isLocked={isLocked}
      deadline={tournament?.predictionDeadline?.toISOString() || null}
      initialTab={stage === 'knockout' ? 'knockout' : 'group'}
    />
  );
}
