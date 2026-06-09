const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix R32 + R16 + QF match placeholders for an already-migrated production DB.
 *
 * This script SETS the correct home/awayPlaceholder for each match in the
 * Round of 32 (matchNumbers 73-88), Round of 16 (89-96), and
 * Quarter-finals (97-100) by positional order within each stage.
 *
 * WHY NOT THE PREVIOUS fix-r32-placeholders.js or fix-r32-bracket.js:
 *   fix-r32-placeholders.js was a regex reformatter that could not fix structural
 *   invalidity. fix-r32-bracket.js fixed R32 only. This script extends coverage
 *   to R16 and QF with the official cross-bracket feeders provided by the user.
 *
 * RESOLVER FORMAT REQUIREMENTS (KnockoutBracket.tsx / lib/predictedStandings.ts):
 *   "Winner X"       — group winner (single letter A-L)
 *   "Runner-up X"    — group runner-up (single letter A-L)
 *   "3rd X/Y/Z"      — best-third slot; text after "3rd " is descriptive only.
 *                      Resolver uses positional index into bestThirds[] (sorted pts/GD/GF).
 *                      MUST be in awayPlaceholder.
 *   "Winner R32 Mn"  — winner of R32 match n (resolves to predictedWinners[72 + n])
 *   "Winner R16 Mn"  — winner of R16 match n (resolves to predictedWinners[88 + n])
 *   "Winner QF Mn"   — winner of QF match n  (resolves to predictedWinners[96 + n])
 *
 * SF, third-place, and Final feeders are already correct — NOT TOUCHED.
 *
 * VERIFICATION:
 *   R32: Winners A-L each exactly once (12), Runners-up A-L each exactly once (12),
 *        Third slots exactly 8 all in away position, no duplicates. ✓
 *   R16: Each R32 match (M1-M16) appears exactly once as a feeder. ✓
 *   QF:  Each R16 match (M1-M8) appears exactly once as a feeder. ✓
 */

// ─── R32 (matchNumbers 73-88) ──────────────────────────────────────────────
// Index 0 = R32 M1 (matchNumber 73), index 15 = R32 M16 (matchNumber 88)
// [homePlaceholder, awayPlaceholder]
const CORRECT_R32_BRACKET = [
  // M1  (Match 73)
  ['Runner-up A',  'Runner-up B'],
  // M2  (Match 74)
  ['Winner E',     '3rd A/B/C/D/F'],
  // M3  (Match 75)
  ['Winner F',     'Runner-up C'],
  // M4  (Match 76)
  ['Winner C',     'Runner-up F'],
  // M5  (Match 77)
  ['Winner I',     '3rd C/D/F/G/H'],
  // M6  (Match 78)
  ['Runner-up E',  'Runner-up I'],
  // M7  (Match 79)
  ['Winner A',     '3rd C/E/F/H/I'],
  // M8  (Match 80)
  ['Winner L',     '3rd E/H/I/J/K'],
  // M9  (Match 81)
  ['Winner D',     '3rd B/E/F/I/J'],
  // M10 (Match 82)
  ['Winner G',     '3rd A/E/H/I/J'],
  // M11 (Match 83)
  ['Runner-up K',  'Runner-up L'],
  // M12 (Match 84)
  ['Winner H',     'Runner-up J'],
  // M13 (Match 85)
  ['Winner B',     '3rd E/F/G/I/J'],
  // M14 (Match 86)
  ['Winner J',     'Runner-up H'],
  // M15 (Match 87)
  ['Winner K',     '3rd D/E/I/J/L'],
  // M16 (Match 88)
  ['Runner-up D',  'Runner-up G'],
];

// ─── R16 (matchNumbers 89-96) ──────────────────────────────────────────────
// Index 0 = R16 M1 (matchNumber 89), index 7 = R16 M8 (matchNumber 96)
// Official cross-bracket feeders (not sequential pairs)
const CORRECT_R16_BRACKET = [
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

// ─── QF (matchNumbers 97-100) ─────────────────────────────────────────────
// Index 0 = QF M1 (matchNumber 97), index 3 = QF M4 (matchNumber 100)
// Note: QF M2 and M3 are cross-bracket (not pairs 3-4, 5-6 in sequence)
const CORRECT_QF_BRACKET = [
  // M1  (Match 97): Winner R16 M1 vs Winner R16 M2
  ['Winner R16 M1',  'Winner R16 M2'],
  // M2  (Match 98): Winner R16 M5 vs Winner R16 M6
  ['Winner R16 M5',  'Winner R16 M6'],
  // M3  (Match 99): Winner R16 M3 vs Winner R16 M4
  ['Winner R16 M3',  'Winner R16 M4'],
  // M4  (Match 100): Winner R16 M7 vs Winner R16 M8
  ['Winner R16 M7',  'Winner R16 M8'],
];

async function fix() {
  console.log('=== fix-knockout-bracket.js ===');
  console.log('Fixing R32, R16, and QF bracket placeholders (set by matchNumber order).\n');
  console.log('SF, third-place, and Final are NOT touched.\n');

  // ── R32 ──────────────────────────────────────────────────────────────────
  console.log('--- Round of 32 (matchNumbers 73-88) ---');

  const r32Matches = await prisma.match.findMany({
    where: { stage: 'round32' },
    orderBy: { matchNumber: 'asc' },
  });

  if (r32Matches.length !== 16) {
    console.error(`ERROR: Expected 16 R32 matches, found ${r32Matches.length}. Aborting.`);
    process.exit(1);
  }

  for (let i = 0; i < r32Matches.length; i++) {
    const match = r32Matches[i];
    const [newHome, newAway] = CORRECT_R32_BRACKET[i];

    process.stdout.write(
      `  Match ${match.matchNumber} (R32 M${i + 1}): "${match.homePlaceholder}" vs "${match.awayPlaceholder}"` +
      ` → "${newHome}" vs "${newAway}" ... `
    );

    await prisma.match.update({
      where: { id: match.id },
      data: { homePlaceholder: newHome, awayPlaceholder: newAway },
    });

    console.log('OK');
  }

  console.log(`\nR32: ${r32Matches.length} matches updated.\n`);

  // ── R16 ──────────────────────────────────────────────────────────────────
  console.log('--- Round of 16 (matchNumbers 89-96) ---');

  const r16Matches = await prisma.match.findMany({
    where: { stage: 'round16' },
    orderBy: { matchNumber: 'asc' },
  });

  if (r16Matches.length !== 8) {
    console.error(`ERROR: Expected 8 R16 matches, found ${r16Matches.length}. Aborting.`);
    process.exit(1);
  }

  for (let i = 0; i < r16Matches.length; i++) {
    const match = r16Matches[i];
    const [newHome, newAway] = CORRECT_R16_BRACKET[i];

    process.stdout.write(
      `  Match ${match.matchNumber} (R16 M${i + 1}): "${match.homePlaceholder}" vs "${match.awayPlaceholder}"` +
      ` → "${newHome}" vs "${newAway}" ... `
    );

    await prisma.match.update({
      where: { id: match.id },
      data: { homePlaceholder: newHome, awayPlaceholder: newAway },
    });

    console.log('OK');
  }

  console.log(`\nR16: ${r16Matches.length} matches updated.\n`);

  // ── QF ───────────────────────────────────────────────────────────────────
  console.log('--- Quarter-finals (matchNumbers 97-100) ---');

  const qfMatches = await prisma.match.findMany({
    where: { stage: 'quarter' },
    orderBy: { matchNumber: 'asc' },
  });

  if (qfMatches.length !== 4) {
    console.error(`ERROR: Expected 4 QF matches, found ${qfMatches.length}. Aborting.`);
    process.exit(1);
  }

  for (let i = 0; i < qfMatches.length; i++) {
    const match = qfMatches[i];
    const [newHome, newAway] = CORRECT_QF_BRACKET[i];

    process.stdout.write(
      `  Match ${match.matchNumber} (QF M${i + 1}): "${match.homePlaceholder}" vs "${match.awayPlaceholder}"` +
      ` → "${newHome}" vs "${newAway}" ... `
    );

    await prisma.match.update({
      where: { id: match.id },
      data: { homePlaceholder: newHome, awayPlaceholder: newAway },
    });

    console.log('OK');
  }

  console.log(`\nQF: ${qfMatches.length} matches updated.\n`);

  // ── Summary ──────────────────────────────────────────────────────────────
  const total = r32Matches.length + r16Matches.length + qfMatches.length;
  console.log(`=== Done. ${total} matches updated (R32: 16, R16: 8, QF: 4). ===`);
  console.log('SF (101-102), third-place (103), and Final (104) were not touched.');

  await prisma.$disconnect();
}

fix().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
