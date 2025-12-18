import prisma from '@/lib/prisma';
import ResultsClient from './ResultsClient';

async function getCompletedMatches() {
  const matches = await prisma.match.findMany({
    where: {
      realScoreHome: { not: null },
      realScoreAway: { not: null },
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      predictions: true,
    },
    orderBy: { matchNumber: 'asc' },
  });

  // Calculate stats for each match
  return matches.map((match) => {
    const exactCount = match.predictions.filter(
      (p) =>
        p.predictedHome === match.realScoreHome &&
        p.predictedAway === match.realScoreAway
    ).length;

    const correctResultCount = match.predictions.filter((p) => {
      const predictedResult =
        p.predictedHome > p.predictedAway
          ? 'home'
          : p.predictedHome < p.predictedAway
          ? 'away'
          : 'draw';
      const actualResult =
        match.realScoreHome! > match.realScoreAway!
          ? 'home'
          : match.realScoreHome! < match.realScoreAway!
          ? 'away'
          : 'draw';
      return predictedResult === actualResult;
    }).length;

    return {
      ...match,
      exactCount,
      correctResultCount,
      totalPredictions: match.predictions.length,
    };
  });
}

export default async function ResultsPage() {
  const matches = await getCompletedMatches();

  return <ResultsClient matches={matches} />;
}
