import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// PRODUCTION SAFETY GUARD
// This seed script DELETES ALL DATA. Never run in production.
if (process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: Cannot run seed in production! This would delete all data.');
  console.error('   If you really need to seed production, use a migration instead.');
  process.exit(1);
}

const prisma = new PrismaClient();

// 48 Teams for FIFA World Cup 2026 (hosts + placeholders for other qualified teams)
const teams = [
  // Group A (USA is host)
  { name: 'United States', code: 'USA', group: 'A', flagEmoji: '🇺🇸' },
  { name: 'Team A2', code: 'A2', group: 'A', flagEmoji: '🏳️' },
  { name: 'Team A3', code: 'A3', group: 'A', flagEmoji: '🏳️' },
  { name: 'Team A4', code: 'A4', group: 'A', flagEmoji: '🏳️' },
  // Group B
  { name: 'Mexico', code: 'MEX', group: 'B', flagEmoji: '🇲🇽' },
  { name: 'Team B2', code: 'B2', group: 'B', flagEmoji: '🏳️' },
  { name: 'Team B3', code: 'B3', group: 'B', flagEmoji: '🏳️' },
  { name: 'Team B4', code: 'B4', group: 'B', flagEmoji: '🏳️' },
  // Group C
  { name: 'Canada', code: 'CAN', group: 'C', flagEmoji: '🇨🇦' },
  { name: 'Team C2', code: 'C2', group: 'C', flagEmoji: '🏳️' },
  { name: 'Team C3', code: 'C3', group: 'C', flagEmoji: '🏳️' },
  { name: 'Team C4', code: 'C4', group: 'C', flagEmoji: '🏳️' },
  // Group D
  { name: 'Team D1', code: 'D1', group: 'D', flagEmoji: '🏳️' },
  { name: 'Team D2', code: 'D2', group: 'D', flagEmoji: '🏳️' },
  { name: 'Team D3', code: 'D3', group: 'D', flagEmoji: '🏳️' },
  { name: 'Team D4', code: 'D4', group: 'D', flagEmoji: '🏳️' },
  // Group E
  { name: 'Team E1', code: 'E1', group: 'E', flagEmoji: '🏳️' },
  { name: 'Team E2', code: 'E2', group: 'E', flagEmoji: '🏳️' },
  { name: 'Team E3', code: 'E3', group: 'E', flagEmoji: '🏳️' },
  { name: 'Team E4', code: 'E4', group: 'E', flagEmoji: '🏳️' },
  // Group F
  { name: 'Team F1', code: 'F1', group: 'F', flagEmoji: '🏳️' },
  { name: 'Team F2', code: 'F2', group: 'F', flagEmoji: '🏳️' },
  { name: 'Team F3', code: 'F3', group: 'F', flagEmoji: '🏳️' },
  { name: 'Team F4', code: 'F4', group: 'F', flagEmoji: '🏳️' },
  // Group G
  { name: 'Team G1', code: 'G1', group: 'G', flagEmoji: '🏳️' },
  { name: 'Team G2', code: 'G2', group: 'G', flagEmoji: '🏳️' },
  { name: 'Team G3', code: 'G3', group: 'G', flagEmoji: '🏳️' },
  { name: 'Team G4', code: 'G4', group: 'G', flagEmoji: '🏳️' },
  // Group H
  { name: 'Team H1', code: 'H1', group: 'H', flagEmoji: '🏳️' },
  { name: 'Team H2', code: 'H2', group: 'H', flagEmoji: '🏳️' },
  { name: 'Team H3', code: 'H3', group: 'H', flagEmoji: '🏳️' },
  { name: 'Team H4', code: 'H4', group: 'H', flagEmoji: '🏳️' },
  // Group I
  { name: 'Team I1', code: 'I1', group: 'I', flagEmoji: '🏳️' },
  { name: 'Team I2', code: 'I2', group: 'I', flagEmoji: '🏳️' },
  { name: 'Team I3', code: 'I3', group: 'I', flagEmoji: '🏳️' },
  { name: 'Team I4', code: 'I4', group: 'I', flagEmoji: '🏳️' },
  // Group J
  { name: 'Team J1', code: 'J1', group: 'J', flagEmoji: '🏳️' },
  { name: 'Team J2', code: 'J2', group: 'J', flagEmoji: '🏳️' },
  { name: 'Team J3', code: 'J3', group: 'J', flagEmoji: '🏳️' },
  { name: 'Team J4', code: 'J4', group: 'J', flagEmoji: '🏳️' },
  // Group K
  { name: 'Team K1', code: 'K1', group: 'K', flagEmoji: '🏳️' },
  { name: 'Team K2', code: 'K2', group: 'K', flagEmoji: '🏳️' },
  { name: 'Team K3', code: 'K3', group: 'K', flagEmoji: '🏳️' },
  { name: 'Team K4', code: 'K4', group: 'K', flagEmoji: '🏳️' },
  // Group L
  { name: 'Team L1', code: 'L1', group: 'L', flagEmoji: '🏳️' },
  { name: 'Team L2', code: 'L2', group: 'L', flagEmoji: '🏳️' },
  { name: 'Team L3', code: 'L3', group: 'L', flagEmoji: '🏳️' },
  { name: 'Team L4', code: 'L4', group: 'L', flagEmoji: '🏳️' },
];

// Generate group stage matches (6 matches per group = 72 matches total... wait, that's wrong)
// Actually: 4 teams, each plays 3 matches = 6 matches per group × 12 groups = 72 matches
// But spec says 48 group stage matches. Let me recalculate:
// 4 teams per group, each team plays 3 matches, so 4*3/2 = 6 matches per group
// 12 groups × 6 matches = 72 matches... but spec says 48
//
// Actually looking at the spec again: "Group Stage (48 matches): Each group plays 6 matches (4 teams × 3 matches each ÷ 2)"
// 12 groups × 6 = 72, not 48. This seems like an error in the spec.
// But the spec explicitly says 48 matches for group stage and 104 total.
// Let me check: 48 + 16 + 8 + 4 + 2 + 1 + 1 = 80, not 104
//
// Let me recalculate for 2026 World Cup:
// - Group Stage: 12 groups × 6 matches = 72 matches
// - Round of 32: 16 matches
// - Round of 16: 8 matches
// - Quarter-finals: 4 matches
// - Semi-finals: 2 matches
// - Third-place: 1 match
// - Final: 1 match
// Total: 72 + 16 + 8 + 4 + 2 + 1 + 1 = 104 ✓
//
// So the spec has a typo - group stage is 72 matches, not 48

function generateGroupMatches(group: string, teamCodes: string[]): any[] {
  const matches: any[] = [];
  // Round robin: each team plays every other team once
  // Teams are indexed 0, 1, 2, 3 (positions 1, 2, 3, 4 in group)
  const matchups = [
    [0, 1], // 1 vs 2
    [2, 3], // 3 vs 4
    [0, 2], // 1 vs 3
    [1, 3], // 2 vs 4
    [0, 3], // 1 vs 4
    [1, 2], // 2 vs 3
  ];

  matchups.forEach(([homeIdx, awayIdx]) => {
    matches.push({
      stage: 'group',
      group,
      homeTeamCode: teamCodes[homeIdx],
      awayTeamCode: teamCodes[awayIdx],
    });
  });

  return matches;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.prediction.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.user.deleteMany();

  console.log('📦 Creating teams...');

  // Create all teams
  const createdTeams: { [code: string]: string } = {};
  for (const team of teams) {
    const created = await prisma.team.create({
      data: team,
    });
    createdTeams[team.code] = created.id;
  }
  console.log(`✅ Created ${teams.length} teams`);

  console.log('⚽ Creating matches...');

  // Generate all matches
  const allMatches: any[] = [];
  let matchNumber = 1;

  // Group stage matches (72 matches)
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  for (const group of groups) {
    const groupTeams = teams.filter(t => t.group === group);
    const teamCodes = groupTeams.map(t => t.code);
    const groupMatches = generateGroupMatches(group, teamCodes);

    for (const match of groupMatches) {
      allMatches.push({
        matchNumber: matchNumber++,
        stage: 'group',
        group: match.group,
        homeTeamId: createdTeams[match.homeTeamCode],
        awayTeamId: createdTeams[match.awayTeamCode],
      });
    }
  }

  // Round of 32 (16 matches)
  // Bracket structure for 48-team World Cup:
  // 1A vs 3C/D/E, 2A vs 2C, 1B vs 3A/B/F, 2B vs 2D, etc.
  const round32Placeholders = [
    ['Winner A', '3rd C/D/E'],
    ['Runner-up C', 'Runner-up D'],
    ['Winner B', '3rd A/B/F'],
    ['Runner-up A', 'Runner-up B'],
    ['Winner E', '3rd C/D/E'],
    ['Runner-up G', 'Runner-up H'],
    ['Winner F', '3rd A/B/F'],
    ['Runner-up E', 'Runner-up F'],
    ['Winner C', '3rd G/H/I'],
    ['Runner-up I', 'Runner-up J'],
    ['Winner D', '3rd G/H/I'],
    ['Runner-up C', 'Runner-up D'],
    ['Winner G', '3rd J/K/L'],
    ['Runner-up K', 'Runner-up L'],
    ['Winner H', '3rd J/K/L'],
    ['Runner-up G', 'Runner-up H'],
  ];

  for (const [home, away] of round32Placeholders) {
    allMatches.push({
      matchNumber: matchNumber++,
      stage: 'round32',
      homePlaceholder: home,
      awayPlaceholder: away,
    });
  }

  // Round of 16 (8 matches)
  const round16Placeholders = [
    ['Winner R32 M1', 'Winner R32 M2'],
    ['Winner R32 M3', 'Winner R32 M4'],
    ['Winner R32 M5', 'Winner R32 M6'],
    ['Winner R32 M7', 'Winner R32 M8'],
    ['Winner R32 M9', 'Winner R32 M10'],
    ['Winner R32 M11', 'Winner R32 M12'],
    ['Winner R32 M13', 'Winner R32 M14'],
    ['Winner R32 M15', 'Winner R32 M16'],
  ];

  for (const [home, away] of round16Placeholders) {
    allMatches.push({
      matchNumber: matchNumber++,
      stage: 'round16',
      homePlaceholder: home,
      awayPlaceholder: away,
    });
  }

  // Quarter-finals (4 matches)
  const quarterPlaceholders = [
    ['Winner R16 M1', 'Winner R16 M2'],
    ['Winner R16 M3', 'Winner R16 M4'],
    ['Winner R16 M5', 'Winner R16 M6'],
    ['Winner R16 M7', 'Winner R16 M8'],
  ];

  for (const [home, away] of quarterPlaceholders) {
    allMatches.push({
      matchNumber: matchNumber++,
      stage: 'quarter',
      homePlaceholder: home,
      awayPlaceholder: away,
    });
  }

  // Semi-finals (2 matches)
  const semiPlaceholders = [
    ['Winner QF M1', 'Winner QF M2'],
    ['Winner QF M3', 'Winner QF M4'],
  ];

  for (const [home, away] of semiPlaceholders) {
    allMatches.push({
      matchNumber: matchNumber++,
      stage: 'semi',
      homePlaceholder: home,
      awayPlaceholder: away,
    });
  }

  // Third-place playoff (1 match)
  allMatches.push({
    matchNumber: matchNumber++,
    stage: 'third',
    homePlaceholder: 'Loser SF M1',
    awayPlaceholder: 'Loser SF M2',
  });

  // Final (1 match)
  allMatches.push({
    matchNumber: matchNumber++,
    stage: 'final',
    homePlaceholder: 'Winner SF M1',
    awayPlaceholder: 'Winner SF M2',
  });

  // Create all matches
  for (const match of allMatches) {
    await prisma.match.create({
      data: match,
    });
  }

  console.log(`✅ Created ${allMatches.length} matches`);

  // Create tournament with deadline
  console.log('🏆 Creating tournament...');
  const deadline = new Date('2026-06-10T00:00:00Z'); // Day before tournament starts
  await prisma.tournament.create({
    data: {
      name: 'FIFA World Cup 2026',
      predictionDeadline: deadline,
      isActive: true,
    },
  });
  console.log('✅ Created tournament');

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  });
  console.log('✅ Created admin user (admin@example.com / admin123)');

  console.log('');
  console.log('🎉 Database seeding complete!');
  console.log(`   - ${teams.length} teams created`);
  console.log(`   - ${allMatches.length} matches created`);
  console.log(`   - Tournament deadline: ${deadline.toISOString()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
