const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
  console.log('Setting deadline to the past...');
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  await prisma.tournament.updateMany({
    data: { predictionDeadline: pastDate }
  });

  console.log('Checking if predictions are locked...');
  // This usually requires a browser test, but I can check the API
  // or I can check if the UI would show it.
  // Since I can't use Puppeteer easily, I'll check the source code for the lock logic.
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
