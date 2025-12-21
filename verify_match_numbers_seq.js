const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    orderBy: { matchNumber: 'asc' }
  });
  
  const numbers = matches.map(m => m.matchNumber);
  const unique = new Set(numbers);
  
  console.log('Total matches:', matches.length);
  console.log('Unique match numbers:', unique.size);
  
  let allGood = true;
  if (unique.size !== 104) {
    console.log('ERROR: Unique count is not 104');
    allGood = false;
  }
  
  for (let i = 1; i <= 104; i++) {
    if (!unique.has(i)) {
      console.log('ERROR: Missing match number:', i);
      allGood = false;
    }
  }
  
  if (allGood) {
    console.log('SUCCESS: All match numbers are unique and sequential (1-104)');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
