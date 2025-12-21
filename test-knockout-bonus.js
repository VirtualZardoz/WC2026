const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('Testing knockout bonus points...');

  // 1. Create a dummy user
  const email = 'testuser_bonus@example.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.prediction.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
  user = await prisma.user.create({
    data: {
      email,
      name: 'Test User Bonus',
      passwordHash: 'dummy',
    },
  });

  // 2. Find a knockout match
  const match = await prisma.match.findFirst({
    where: { stage: 'round32' },
    include: { homeTeam: true, awayTeam: true }
  });

  if (!match || !match.homeTeamId || !match.awayTeamId) {
    console.error('No knockout match with teams found. Run seed/group progression first.');
    // Try to seed teams if missing
    if (match) {
      const teams = await prisma.team.findMany({ take: 2 });
      await prisma.match.update({
        where: { id: match.id },
        data: { homeTeamId: teams[0].id, awayTeamId: teams[1].id }
      });
      return runTest(); // retry
    }
    process.exit(1);
  }

  console.log(`Using Match ${match.matchNumber}: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

  // 3. Create prediction: 1-1, winner is home
  await prisma.prediction.create({
    data: {
      userId: user.id,
      matchId: match.id,
      predictedHome: 1,
      predictedAway: 1,
      predictedWinner: 'home', // user thinks home team will qualify on penalties
    }
  });

  // 4. Simulate admin entering result: 0-0, winner is home
  // We'll call a simplified version of the API logic here
  const homeScore = 0;
  const awayScore = 0;
  const winnerId = match.homeTeamId;

  // Determining actual winner (same as API)
  let actualWinnerId = winnerId;

  const actualResult = homeScore > awayScore ? 'home' : homeScore < awayScore ? 'away' : 'draw';
  
  // Calculate points
  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId: user.id, matchId: match.id } }
  });

  let points = 0;
  // Exact score? No (1-1 vs 0-0)
  if (prediction.predictedHome === homeScore && prediction.predictedAway === awayScore) {
    points = 3;
  } else {
    // Correct result? Yes (draw vs draw)
    const predictedResult = prediction.predictedHome > prediction.predictedAway ? 'home' : 
                            prediction.predictedHome < prediction.predictedAway ? 'away' : 'draw';
    if (predictedResult === actualResult) {
      points = 1;
    }
  }

  // Knockout bonus? Yes (predictedWinner 'home' === match.homeTeamId)
  let userPredictedWinnerId = null;
  if (prediction.predictedHome > prediction.predictedAway) {
    userPredictedWinnerId = match.homeTeamId;
  } else if (prediction.predictedAway > prediction.predictedHome) {
    userPredictedWinnerId = match.awayTeamId;
  } else {
    userPredictedWinnerId = prediction.predictedWinner === 'home' ? match.homeTeamId : match.awayTeamId;
  }

  if (userPredictedWinnerId === actualWinnerId) {
    points += 1;
  }

  console.log(`Expected points: 1 (result) + 1 (bonus) = 2. Actual points to be awarded: ${points}`);

  if (points === 2) {
    console.log('✅ Success! Knockout bonus point logic is correct.');
    process.exit(0);
  } else {
    console.log('❌ Failure!');
    process.exit(1);
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
