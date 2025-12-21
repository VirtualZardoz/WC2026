const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// World Cup 2026 Official Draw (December 13, 2025)
// Source: FIFA, ESPN
const realTeams = [
  // Group A
  { code: 'MEX', name: 'Mexico', group: 'A', flagEmoji: '🇲🇽' },
  { code: 'RSA', name: 'South Africa', group: 'A', flagEmoji: '🇿🇦' },
  { code: 'KOR', name: 'South Korea', group: 'A', flagEmoji: '🇰🇷' },
  { code: 'TBD-A4', name: 'UEFA Playoff D Winner', group: 'A', flagEmoji: '🏳️' },

  // Group B
  { code: 'CAN', name: 'Canada', group: 'B', flagEmoji: '🇨🇦' },
  { code: 'TBD-B2', name: 'UEFA Playoff A Winner', group: 'B', flagEmoji: '🏳️' },
  { code: 'QAT', name: 'Qatar', group: 'B', flagEmoji: '🇶🇦' },
  { code: 'SUI', name: 'Switzerland', group: 'B', flagEmoji: '🇨🇭' },

  // Group C
  { code: 'BRA', name: 'Brazil', group: 'C', flagEmoji: '🇧🇷' },
  { code: 'MAR', name: 'Morocco', group: 'C', flagEmoji: '🇲🇦' },
  { code: 'HAI', name: 'Haiti', group: 'C', flagEmoji: '🇭🇹' },
  { code: 'SCO', name: 'Scotland', group: 'C', flagEmoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },

  // Group D
  { code: 'USA', name: 'United States', group: 'D', flagEmoji: '🇺🇸' },
  { code: 'PAR', name: 'Paraguay', group: 'D', flagEmoji: '🇵🇾' },
  { code: 'AUS', name: 'Australia', group: 'D', flagEmoji: '🇦🇺' },
  { code: 'TBD-D4', name: 'UEFA Playoff C Winner', group: 'D', flagEmoji: '🏳️' },

  // Group E
  { code: 'GER', name: 'Germany', group: 'E', flagEmoji: '🇩🇪' },
  { code: 'CUW', name: 'Curaçao', group: 'E', flagEmoji: '🇨🇼' },
  { code: 'CIV', name: 'Ivory Coast', group: 'E', flagEmoji: '🇨🇮' },
  { code: 'ECU', name: 'Ecuador', group: 'E', flagEmoji: '🇪🇨' },

  // Group F
  { code: 'NED', name: 'Netherlands', group: 'F', flagEmoji: '🇳🇱' },
  { code: 'JPN', name: 'Japan', group: 'F', flagEmoji: '🇯🇵' },
  { code: 'TBD-F3', name: 'UEFA Playoff B Winner', group: 'F', flagEmoji: '🏳️' },
  { code: 'TUN', name: 'Tunisia', group: 'F', flagEmoji: '🇹🇳' },

  // Group G
  { code: 'BEL', name: 'Belgium', group: 'G', flagEmoji: '🇧🇪' },
  { code: 'EGY', name: 'Egypt', group: 'G', flagEmoji: '🇪🇬' },
  { code: 'IRN', name: 'Iran', group: 'G', flagEmoji: '🇮🇷' },
  { code: 'NZL', name: 'New Zealand', group: 'G', flagEmoji: '🇳🇿' },

  // Group H
  { code: 'ESP', name: 'Spain', group: 'H', flagEmoji: '🇪🇸' },
  { code: 'CPV', name: 'Cape Verde', group: 'H', flagEmoji: '🇨🇻' },
  { code: 'KSA', name: 'Saudi Arabia', group: 'H', flagEmoji: '🇸🇦' },
  { code: 'URU', name: 'Uruguay', group: 'H', flagEmoji: '🇺🇾' },

  // Group I
  { code: 'FRA', name: 'France', group: 'I', flagEmoji: '🇫🇷' },
  { code: 'SEN', name: 'Senegal', group: 'I', flagEmoji: '🇸🇳' },
  { code: 'TBD-I3', name: 'FIFA Playoff 2 Winner', group: 'I', flagEmoji: '🏳️' },
  { code: 'NOR', name: 'Norway', group: 'I', flagEmoji: '🇳🇴' },

  // Group J
  { code: 'ARG', name: 'Argentina', group: 'J', flagEmoji: '🇦🇷' },
  { code: 'ALG', name: 'Algeria', group: 'J', flagEmoji: '🇩🇿' },
  { code: 'AUT', name: 'Austria', group: 'J', flagEmoji: '🇦🇹' },
  { code: 'JOR', name: 'Jordan', group: 'J', flagEmoji: '🇯🇴' },

  // Group K
  { code: 'POR', name: 'Portugal', group: 'K', flagEmoji: '🇵🇹' },
  { code: 'TBD-K2', name: 'FIFA Playoff 1 Winner', group: 'K', flagEmoji: '🏳️' },
  { code: 'UZB', name: 'Uzbekistan', group: 'K', flagEmoji: '🇺🇿' },
  { code: 'COL', name: 'Colombia', group: 'K', flagEmoji: '🇨🇴' },

  // Group L
  { code: 'ENG', name: 'England', group: 'L', flagEmoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'CRO', name: 'Croatia', group: 'L', flagEmoji: '🇭🇷' },
  { code: 'GHA', name: 'Ghana', group: 'L', flagEmoji: '🇬🇭' },
  { code: 'PAN', name: 'Panama', group: 'L', flagEmoji: '🇵🇦' },
];

// Group stage fixtures (each team plays 3 matches)
// Format: [team1_position, team2_position] where position is 1-4 in group
const groupMatchPattern = [
  [1, 2], // Match 1: 1st vs 2nd
  [3, 4], // Match 2: 3rd vs 4th
  [1, 3], // Match 3: 1st vs 3rd
  [2, 4], // Match 4: 2nd vs 4th
  [1, 4], // Match 5: 1st vs 4th
  [2, 3], // Match 6: 2nd vs 3rd
];

// World Cup 2026 Venues (USA, Mexico, Canada)
const venues = {
  // USA (11 cities)
  'ATT': 'AT&T Stadium, Dallas',
  'MET': 'MetLife Stadium, New York',
  'MER': 'Mercedes-Benz Stadium, Atlanta',
  'NRG': 'NRG Stadium, Houston',
  'HAR': 'Hard Rock Stadium, Miami',
  'LEV': "Levi's Stadium, San Francisco",
  'SOF': 'SoFi Stadium, Los Angeles',
  'LIN': 'Lincoln Financial Field, Philadelphia',
  'ARR': 'Arrowhead Stadium, Kansas City',
  'LUM': 'Lumen Field, Seattle',
  'GIL': 'Gillette Stadium, Boston',
  // Mexico (3 cities)
  'AZT': 'Estadio Azteca, Mexico City',
  'BBV': 'Estadio BBVA, Monterrey',
  'AKR': 'Estadio Akron, Guadalajara',
  // Canada (2 cities)
  'BCP': 'BC Place, Vancouver',
  'BMO': 'BMO Field, Toronto',
};

// Group stage venue assignments (rotates through venues)
const groupVenues = ['AZT', 'ATT', 'MET', 'HAR', 'SOF', 'MER', 'NRG', 'LEV', 'LIN', 'ARR', 'LUM', 'GIL', 'BBV', 'AKR', 'BCP', 'BMO'];

async function migrate() {
  console.log('🚀 Starting World Cup 2026 fixtures migration...\n');

  // Step 1: Delete existing teams and create new ones
  console.log('Step 1: Updating teams...');

  // First, clear predictions and matches to avoid FK constraints
  await prisma.prediction.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.team.deleteMany({});

  // Create new teams
  for (const team of realTeams) {
    await prisma.team.create({ data: team });
    console.log(`  ✅ Created ${team.code} - ${team.name}`);
  }

  console.log(`\n✅ Created ${realTeams.length} teams\n`);

  // Step 2: Create group stage matches
  console.log('Step 2: Creating group stage matches...');

  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  let matchNumber = 1;

  for (const group of groups) {
    const groupTeams = await prisma.team.findMany({
      where: { group },
      orderBy: { code: 'asc' }
    });

    for (let i = 0; i < groupMatchPattern.length; i++) {
      const [pos1, pos2] = groupMatchPattern[i];
      const homeTeam = groupTeams[pos1 - 1];
      const awayTeam = groupTeams[pos2 - 1];

      // Calculate match date (spread across June 11-27)
      const dayOffset = Math.floor((matchNumber - 1) / 8); // ~8 matches per day
      const matchDate = new Date('2026-06-11T18:00:00Z');
      matchDate.setDate(matchDate.getDate() + dayOffset);
      matchDate.setHours(18 + ((matchNumber % 4) * 3)); // Stagger times

      // Assign venue (rotating through available venues)
      const venueCode = groupVenues[(matchNumber - 1) % groupVenues.length];
      const venue = venues[venueCode];

      await prisma.match.create({
        data: {
          matchNumber,
          stage: 'group',
          group,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          matchDate,
          venue,
        }
      });

      console.log(`  Match ${matchNumber}: ${homeTeam.code} vs ${awayTeam.code} @ ${venue}`);
      matchNumber++;
    }
  }

  console.log(`\n✅ Created ${matchNumber - 1} group stage matches\n`);

  // Step 3: Create knockout stage matches (placeholders)
  console.log('Step 3: Creating knockout stage matches...');

  // Round of 32 venues (spread across multiple cities)
  const r32Venues = ['ATT', 'MET', 'HAR', 'SOF', 'MER', 'NRG', 'LEV', 'LIN', 'ARR', 'LUM', 'GIL', 'AZT', 'BBV', 'AKR', 'BCP', 'BMO'];

  // Round of 32 (32 matches) - June 28-30
  for (let i = 0; i < 32; i++) {
    const dayOffset = Math.floor(i / 11); // ~11 matches per day
    const matchDate = new Date('2026-06-28T16:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(16 + (i % 4) * 2); // 16:00, 18:00, 20:00, 22:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'round32',
        homePlaceholder: `Winner ${Math.floor(i/2) + 1}`,
        awayPlaceholder: `Runner-up ${Math.floor(i/2) + 1}`,
        matchDate,
        venue: venues[r32Venues[i % r32Venues.length]],
      }
    });
  }
  console.log('  ✅ Created 32 Round of 32 matches');

  // Round of 16 venues (8 main venues)
  const r16Venues = ['ATT', 'MET', 'SOF', 'MER', 'HAR', 'NRG', 'AZT', 'BCP'];

  // Round of 16 (16 matches) - July 1-3
  for (let i = 0; i < 16; i++) {
    const dayOffset = Math.floor(i / 6); // ~6 matches per day
    const matchDate = new Date('2026-07-01T17:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(17 + (i % 3) * 3); // 17:00, 20:00, 23:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'round16',
        homePlaceholder: `R32 Winner ${i*2 + 1}`,
        awayPlaceholder: `R32 Winner ${i*2 + 2}`,
        matchDate,
        venue: venues[r16Venues[i % r16Venues.length]],
      }
    });
  }
  console.log('  ✅ Created 16 Round of 16 matches');

  // Quarter-finals venues (4 premium venues)
  const qfVenues = ['ATT', 'MET', 'SOF', 'AZT'];

  // Quarter-finals (8 matches) - July 5-6
  for (let i = 0; i < 8; i++) {
    const dayOffset = Math.floor(i / 4);
    const matchDate = new Date('2026-07-05T18:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(18 + (i % 2) * 4); // 18:00, 22:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'quarter',
        homePlaceholder: `R16 Winner ${i*2 + 1}`,
        awayPlaceholder: `R16 Winner ${i*2 + 2}`,
        matchDate,
        venue: venues[qfVenues[i % qfVenues.length]],
      }
    });
  }
  console.log('  ✅ Created 8 Quarter-final matches');

  // Semi-finals (4 matches) - July 9-10
  const sfVenues = ['ATT', 'MET'];
  for (let i = 0; i < 4; i++) {
    const dayOffset = Math.floor(i / 2);
    const matchDate = new Date('2026-07-09T20:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(20 + (i % 2) * 4); // 20:00, 00:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'semi',
        homePlaceholder: `QF Winner ${i*2 + 1}`,
        awayPlaceholder: `QF Winner ${i*2 + 2}`,
        matchDate,
        venue: venues[sfVenues[i % sfVenues.length]],
      }
    });
  }
  console.log('  ✅ Created 4 Semi-final matches');

  // Third place playoff - July 18 at Hard Rock Stadium
  await prisma.match.create({
    data: {
      matchNumber: matchNumber++,
      stage: 'third',
      homePlaceholder: 'SF Loser 1',
      awayPlaceholder: 'SF Loser 2',
      matchDate: new Date('2026-07-18T20:00:00Z'),
      venue: venues['HAR'],
    }
  });
  console.log('  ✅ Created Third place playoff');

  // Final - July 19 at MetLife Stadium
  await prisma.match.create({
    data: {
      matchNumber: matchNumber++,
      stage: 'final',
      homePlaceholder: 'SF Winner 1',
      awayPlaceholder: 'SF Winner 2',
      matchDate: new Date('2026-07-19T19:00:00Z'), // 3pm ET
      venue: venues['MET'],
    }
  });
  console.log('  ✅ Created Final at MetLife Stadium');

  // Step 4: Update tournament deadline
  console.log('\nStep 4: Updating tournament deadline...');
  await prisma.tournament.updateMany({
    data: {
      predictionDeadline: new Date('2026-06-11T17:00:00Z'), // 1 hour before first match
    }
  });
  console.log('  ✅ Deadline set to June 11, 2026 17:00 UTC');

  console.log('\n🎉 Migration complete!');
  console.log(`   Total matches: ${matchNumber - 1}`);

  await prisma.$disconnect();
}

migrate().catch(console.error);
