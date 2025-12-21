const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Current time:', now.toISOString());
  
  const tournament = await prisma.tournament.findFirst();
  if (tournament) {
    console.log('Tournament deadline:', tournament.predictionDeadline.toISOString());
    console.log('Is deadline passed?', now > tournament.predictionDeadline);
  } else {
    console.log('No tournament found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
