const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stages = ['group', 'round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  for (const stage of stages) {
    const count = await prisma.match.count({ where: { stage } });
    console.log(`Stage ${stage}: ${count} matches`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
