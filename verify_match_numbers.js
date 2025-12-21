const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    orderBy: { matchNumber: 'asc' },
  });
  
  console.log(`Total matches: ${matches.length}`);
  
  let allSequential = true;
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].matchNumber !== i + 1) {
      console.log(`Match at index ${i} has number ${matches[i].matchNumber}, expected ${i + 1}`);
      allSequential = false;
    }
  }
  
  if (allSequential && matches.length === 104) {
    console.log('TEST PASSED: #097');
  } else {
    console.log('TEST FAILED: #097');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
