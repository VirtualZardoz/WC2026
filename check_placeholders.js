const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const finalMatch = await prisma.match.findFirst({ where: { stage: 'final' } });
  const thirdMatch = await prisma.match.findFirst({ where: { stage: 'third' } });
  
  console.log('Final:', finalMatch.homePlaceholder, 'vs', finalMatch.awayPlaceholder);
  console.log('Third:', thirdMatch.homePlaceholder, 'vs', thirdMatch.awayPlaceholder);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
