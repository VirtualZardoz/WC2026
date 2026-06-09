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

  // Round of 32 pairings — official FIFA World Cup 2026 bracket (Matches 73-88)
  // Format must match the resolver in KnockoutBracket.tsx and lib/predictedStandings.ts:
  //   "Winner X"     — group winner (single letter, A-L)
  //   "Runner-up X"  — group runner-up (single letter, A-L)
  //   "3rd X/Y/Z"    — best third-placed team slot (text after "3rd " is descriptive only;
  //                    resolver uses positional index into bestThirds[] sorted by pts/GD/GF)
  //                    MUST be in awayPlaceholder — resolver filters on awayPlaceholder.startsWith('3rd ')
  //
  // Verification (acceptance criteria):
  //   Winners A-L:    each appears exactly once (12 total) ✓
  //   Runners-up A-L: each appears exactly once (12 total) ✓
  //   3rd slots:      exactly 8, all in away position      ✓
  //   Duplicates:     none                                 ✓
  const r32Pairings = [
    // M1  (Match 73): Runner-up A vs Runner-up B
    ['Runner-up A',  'Runner-up B'],
    // M2  (Match 74): Winner E vs 3rd A/B/C/D/F
    ['Winner E',     '3rd A/B/C/D/F'],
    // M3  (Match 75): Winner F vs Runner-up C
    ['Winner F',     'Runner-up C'],
    // M4  (Match 76): Winner C vs Runner-up F
    ['Winner C',     'Runner-up F'],
    // M5  (Match 77): Winner I vs 3rd C/D/F/G/H
    ['Winner I',     '3rd C/D/F/G/H'],
    // M6  (Match 78): Runner-up E vs Runner-up I
    ['Runner-up E',  'Runner-up I'],
    // M7  (Match 79): Winner A vs 3rd C/E/F/H/I
    ['Winner A',     '3rd C/E/F/H/I'],
    // M8  (Match 80): Winner L vs 3rd E/H/I/J/K
    ['Winner L',     '3rd E/H/I/J/K'],
    // M9  (Match 81): Winner D vs 3rd B/E/F/I/J
    ['Winner D',     '3rd B/E/F/I/J'],
    // M10 (Match 82): Winner G vs 3rd A/E/H/I/J
    ['Winner G',     '3rd A/E/H/I/J'],
    // M11 (Match 83): Runner-up K vs Runner-up L
    ['Runner-up K',  'Runner-up L'],
    // M12 (Match 84): Winner H vs Runner-up J
    ['Winner H',     'Runner-up J'],
    // M13 (Match 85): Winner B vs 3rd E/F/G/I/J
    ['Winner B',     '3rd E/F/G/I/J'],
    // M14 (Match 86): Winner J vs Runner-up H
    ['Winner J',     'Runner-up H'],
    // M15 (Match 87): Winner K vs 3rd D/E/I/J/L
    ['Winner K',     '3rd D/E/I/J/L'],
    // M16 (Match 88): Runner-up D vs Runner-up G
    ['Runner-up D',  'Runner-up G'],
  ];

  // Round of 32 (16 matches) - June 28-30
  for (let i = 0; i < 16; i++) {
    const dayOffset = Math.floor(i / 6); // ~6 matches per day
    const matchDate = new Date('2026-06-28T16:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(16 + (i % 4) * 2); // 16:00, 18:00, 20:00, 22:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'round32',
        homePlaceholder: r32Pairings[i][0],
        awayPlaceholder: r32Pairings[i][1],
        matchDate,
        venue: venues[r32Venues[i % r32Venues.length]],
      }
    });
  }
  console.log('  ✅ Created 16 Round of 32 matches');

  // Round of 16 venues (8 main venues)
  const r16Venues = ['ATT', 'MET', 'SOF', 'MER', 'HAR', 'NRG', 'AZT', 'BCP'];

  // Round of 16 pairings — official cross-bracket feeders (NOT sequential pairs)
  // M1 (Match 89) through M8 (Match 96)
  // Format: "Winner R32 Mn" where n references R32 match ordinal (1-16)
  // Resolver: stageOffsets['R32']=72, so "Winner R32 M1" → predictedWinners[73]
  const r16Pairings = [
    // M1  (Match 89): Winner R32 M2 vs Winner R32 M5
    ['Winner R32 M2',  'Winner R32 M5'],
    // M2  (Match 90): Winner R32 M1 vs Winner R32 M3
    ['Winner R32 M1',  'Winner R32 M3'],
    // M3  (Match 91): Winner R32 M4 vs Winner R32 M6
    ['Winner R32 M4',  'Winner R32 M6'],
    // M4  (Match 92): Winner R32 M7 vs Winner R32 M8
    ['Winner R32 M7',  'Winner R32 M8'],
    // M5  (Match 93): Winner R32 M11 vs Winner R32 M12
    ['Winner R32 M11', 'Winner R32 M12'],
    // M6  (Match 94): Winner R32 M9 vs Winner R32 M10
    ['Winner R32 M9',  'Winner R32 M10'],
    // M7  (Match 95): Winner R32 M14 vs Winner R32 M16
    ['Winner R32 M14', 'Winner R32 M16'],
    // M8  (Match 96): Winner R32 M13 vs Winner R32 M15
    ['Winner R32 M13', 'Winner R32 M15'],
  ];

  // Round of 16 (8 matches) - July 1-2
  for (let i = 0; i < 8; i++) {
    const dayOffset = Math.floor(i / 4); // 4 matches per day
    const matchDate = new Date('2026-07-01T17:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(17 + (i % 2) * 4); // 17:00, 21:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'round16',
        homePlaceholder: r16Pairings[i][0],
        awayPlaceholder: r16Pairings[i][1],
        matchDate,
        venue: venues[r16Venues[i % r16Venues.length]],
      }
    });
  }
  console.log('  ✅ Created 8 Round of 16 matches');

  // Quarter-finals venues (4 premium venues)
  const qfVenues = ['ATT', 'MET', 'SOF', 'AZT'];

  // Quarter-finals pairings — official cross-bracket feeders
  // QF M2 and M3 are cross-bracket (not the sequential pairs M3-4 and M5-6)
  // M1 (Match 97) through M4 (Match 100)
  // Resolver: stageOffsets['R16']=88, so "Winner R16 M1" → predictedWinners[89]
  const qfPairings = [
    // M1  (Match 97): Winner R16 M1 vs Winner R16 M2
    ['Winner R16 M1',  'Winner R16 M2'],
    // M2  (Match 98): Winner R16 M5 vs Winner R16 M6
    ['Winner R16 M5',  'Winner R16 M6'],
    // M3  (Match 99): Winner R16 M3 vs Winner R16 M4
    ['Winner R16 M3',  'Winner R16 M4'],
    // M4  (Match 100): Winner R16 M7 vs Winner R16 M8
    ['Winner R16 M7',  'Winner R16 M8'],
  ];

  // Quarter-finals (4 matches) - July 5-6
  for (let i = 0; i < 4; i++) {
    const dayOffset = Math.floor(i / 2);
    const matchDate = new Date('2026-07-05T18:00:00Z');
    matchDate.setDate(matchDate.getDate() + dayOffset);
    matchDate.setHours(18 + (i % 2) * 4); // 18:00, 22:00

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'quarter',
        homePlaceholder: qfPairings[i][0],
        awayPlaceholder: qfPairings[i][1],
        matchDate,
        venue: venues[qfVenues[i % qfVenues.length]],
      }
    });
  }
  console.log('  ✅ Created 4 Quarter-final matches');

  // Semi-finals (2 matches) - July 9-10
  const sfVenues = ['ATT', 'MET'];
  for (let i = 0; i < 2; i++) {
    const matchDate = new Date('2026-07-09T20:00:00Z');
    matchDate.setDate(matchDate.getDate() + i);

    await prisma.match.create({
      data: {
        matchNumber: matchNumber++,
        stage: 'semi',
        homePlaceholder: `Winner QF M${i*2 + 1}`,
        awayPlaceholder: `Winner QF M${i*2 + 2}`,
        matchDate,
        venue: venues[sfVenues[i]],
      }
    });
  }
  console.log('  ✅ Created 2 Semi-final matches');

  // Third place playoff - July 18 at Hard Rock Stadium
  await prisma.match.create({
    data: {
      matchNumber: matchNumber++,
      stage: 'third',
      homePlaceholder: 'Loser SF M1',
      awayPlaceholder: 'Loser SF M2',
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
      homePlaceholder: 'Winner SF M1',
      awayPlaceholder: 'Winner SF M2',
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
