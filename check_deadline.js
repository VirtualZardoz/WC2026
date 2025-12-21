const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tournament = await prisma.tournament.findFirst();
  console.log('Deadline:', tournament.predictionDeadline);
  console.log('Now:', new Date());
}

check();
