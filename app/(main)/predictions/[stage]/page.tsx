import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import PredictionsClient from './PredictionsClient';

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

  return matches;
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

  // Filter based on stage param
  const filteredGroupMatches = stage === 'group' ? groupMatches : (stage === 'knockout' ? [] : groupMatches);
  const filteredKnockoutMatches = stage === 'knockout' ? knockoutMatches : (stage === 'group' ? [] : knockoutMatches);

  // Organize group matches by group letter
  const matchesByGroup: { [key: string]: typeof matches } = {};
  filteredGroupMatches.forEach((match) => {
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
