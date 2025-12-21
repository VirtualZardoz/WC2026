const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Testing Draw Winner Prediction Logic...');
  
  try {
    // 1. Create a test user
    const email = `test_draw_${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test Draw User',
        passwordHash: 'dummy',
      }
    });

    // 2. Find a knockout match
    const match = await prisma.match.findFirst({
      where: { stage: 'round32' }
    });

    if (!match) throw new Error('No knockout match found');

    // 3. Simulate saving draw prediction with winner
    const predictedHome = 1;
    const predictedAway = 1;
    const predictedWinner = 'home';

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId: match.id,
        },
      },
      update: {
        predictedHome,
        predictedAway,
        predictedWinner,
      },
      create: {
        userId: user.id,
        matchId: match.id,
        predictedHome,
        predictedAway,
        predictedWinner,
      },
    });

    console.log(`Saved prediction for match ${match.matchNumber}: ${predictedHome}-${predictedAway}, winner: ${predictedWinner}`);

    // 4. Verify in DB
    const saved = await prisma.prediction.findUnique({
      where: { id: prediction.id }
    });

    if (saved.predictedWinner === 'home') {
      console.log('Draw winner prediction verified!');
    } else {
      throw new Error('Draw winner prediction FAILED!');
    }

    // Cleanup
    await prisma.prediction.delete({ where: { id: prediction.id } });
    await prisma.user.delete({ where: { id: user.id } });

  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
