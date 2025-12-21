const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const matches = await prisma.match.findMany({ where: { stage: 'round32' }, orderBy: { matchNumber: 'asc' }, take: 20 });
  matches.forEach(m => console.log(m.matchNumber, m.homePlaceholder, 'vs', m.awayPlaceholder));
}
main().finally(() => prisma.$disconnect());
