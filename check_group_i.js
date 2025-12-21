const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const teams = await prisma.team.findMany({ where: { group: 'I' }, orderBy: { code: 'asc' } });
  console.log(teams);
}
run().finally(() => prisma.$disconnect());
