const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Verifying Complete User Journey (#078)');

  // 1. Create unique user
  const email = `user_journey_${Date.now()}@example.com`;
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Journey User',
      passwordHash: 'dummy',
    }
  });
  console.log('User registered:', email);

  // 2. Predict 10 group matches
  const groupMatches = await prisma.match.findMany({
    where: { stage: 'group' },
    take: 10,
    orderBy: { matchNumber: 'asc' }
  });

  console.log('Predicting 10 group matches...');
  for (const match of groupMatches) {
    await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId: match.id,
        predictedHome: 2,
        predictedAway: 1
      }
    });
  }

  // 3. Predict 5 knockout matches
  const knockoutMatches = await prisma.match.findMany({
    where: { stage: 'round32' },
    take: 5,
    orderBy: { matchNumber: 'asc' }
  });

  console.log('Predicting 5 knockout matches...');
  for (const match of knockoutMatches) {
    await prisma.prediction.create({
      data: {
        userId: user.id,
        matchId: match.id,
        predictedHome: 1,
        predictedAway: 1,
        predictedWinner: 'home'
      }
    });
  }

  // 4. Verify count
  const count = await prisma.prediction.count({
    where: { userId: user.id }
  });

  if (count === 15) {
    console.log(`User has ${count} predictions. Journey verification PASSED`);
    process.exit(0);
  } else {
    console.error(`User has ${count} predictions, expected 15. Journey verification FAILED`);
    process.exit(1);
  }
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
