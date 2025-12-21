const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // We'll test the API directly since Puppeteer is tricky
  // Find two group matches without results
  const matches = await prisma.match.findMany({
    where: {
      stage: 'group',
      realScoreHome: null,
      realScoreAway: null
    },
    take: 2
  });

  if (matches.length < 2) {
    console.log('Not enough pending matches to test bulk entry');
    return;
  }

  const results = [
    { matchId: matches[0].id, homeScore: 2, awayScore: 1 },
    { matchId: matches[1].id, homeScore: 0, awayScore: 3 }
  ];

  console.log('Sending bulk results to API...');
  // Since I can't easily call the API from here (auth), I'll simulate the logic or use a script that runs in the app context.
  // Actually, I can just run a script that calls the prisma logic I wrote in the route.
}

// I'll write a standalone script that uses the bulk logic to verify it works in the database.
