const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tournament = await prisma.tournament.findFirst();
  console.log('Tournament:', tournament);
  if (tournament && tournament.predictionDeadline) {
    console.log('TEST PASSED: #098');
  } else {
    console.log('TEST FAILED: #098');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
