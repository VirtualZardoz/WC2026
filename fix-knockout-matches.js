const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix knockout bracket - delete extra matches and fix placeholders
 *
 * Correct structure for 48-team World Cup:
 * - R32: 16 matches (73-88)
 * - R16: 8 matches (89-96)
 * - QF: 4 matches (97-100)
 * - SF: 2 matches (101-102)
 * - Third: 1 match (103)
 * - Final: 1 match (104)
 */

async function fix() {
  console.log('🔧 Fixing knockout bracket...\n');

  // Step 1: Delete extra knockout matches (keep only first N of each stage)
  console.log('Step 1: Removing extra knockout matches...');

  // Get all knockout matches
  const r32 = await prisma.match.findMany({
    where: { stage: 'round32' },
    orderBy: { matchNumber: 'asc' }
  });
  const r16 = await prisma.match.findMany({
    where: { stage: 'round16' },
    orderBy: { matchNumber: 'asc' }
  });
  const qf = await prisma.match.findMany({
    where: { stage: 'quarter' },
    orderBy: { matchNumber: 'asc' }
  });
  const sf = await prisma.match.findMany({
    where: { stage: 'semi' },
    orderBy: { matchNumber: 'asc' }
  });

  // Delete predictions for matches we're about to delete
  const matchesToDelete = [
    ...r32.slice(16).map(m => m.id),
    ...r16.slice(8).map(m => m.id),
    ...qf.slice(4).map(m => m.id),
    ...sf.slice(2).map(m => m.id),
  ];

  if (matchesToDelete.length > 0) {
    await prisma.prediction.deleteMany({ where: { matchId: { in: matchesToDelete } } });
    await prisma.match.deleteMany({ where: { id: { in: matchesToDelete } } });
    console.log(`  Deleted ${matchesToDelete.length} extra matches`);
  }

  // Step 2: Renumber remaining knockout matches
  console.log('\nStep 2: Renumbering knockout matches...');

  const allKnockout = await prisma.match.findMany({
    where: { stage: { in: ['round32', 'round16', 'quarter', 'semi', 'third', 'final'] } },
    orderBy: { matchNumber: 'asc' }
  });

  // Sort by stage order then match number
  const stageOrder = ['round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  allKnockout.sort((a, b) => {
    const stageA = stageOrder.indexOf(a.stage);
    const stageB = stageOrder.indexOf(b.stage);
    if (stageA !== stageB) return stageA - stageB;
    return a.matchNumber - b.matchNumber;
  });

  let matchNum = 73; // First knockout match
  for (const match of allKnockout) {
    if (match.matchNumber !== matchNum) {
      await prisma.match.update({
        where: { id: match.id },
        data: { matchNumber: matchNum }
      });
    }
    matchNum++;
  }
  console.log(`  Renumbered ${allKnockout.length} knockout matches (73-${matchNum - 1})`);

  // Step 3: Fix R16 placeholders (should reference R32 M1-M16)
  console.log('\nStep 3: Fixing R16 placeholders...');

  const r16Fixed = await prisma.match.findMany({
    where: { stage: 'round16' },
    orderBy: { matchNumber: 'asc' }
  });

  for (let i = 0; i < r16Fixed.length; i++) {
    const match = r16Fixed[i];
    const m1 = i * 2 + 1;
    const m2 = i * 2 + 2;
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homePlaceholder: `Winner R32 M${m1}`,
        awayPlaceholder: `Winner R32 M${m2}`
      }
    });
    console.log(`  Match ${match.matchNumber}: Winner R32 M${m1} vs Winner R32 M${m2}`);
  }

  // Step 4: Fix QF placeholders (should reference R16 M1-M8)
  console.log('\nStep 4: Fixing QF placeholders...');

  const qfFixed = await prisma.match.findMany({
    where: { stage: 'quarter' },
    orderBy: { matchNumber: 'asc' }
  });

  for (let i = 0; i < qfFixed.length; i++) {
    const match = qfFixed[i];
    const m1 = i * 2 + 1;
    const m2 = i * 2 + 2;
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homePlaceholder: `Winner R16 M${m1}`,
        awayPlaceholder: `Winner R16 M${m2}`
      }
    });
    console.log(`  Match ${match.matchNumber}: Winner R16 M${m1} vs Winner R16 M${m2}`);
  }

  // Step 5: Fix SF placeholders (should reference QF M1-M4)
  console.log('\nStep 5: Fixing SF placeholders...');

  const sfFixed = await prisma.match.findMany({
    where: { stage: 'semi' },
    orderBy: { matchNumber: 'asc' }
  });

  for (let i = 0; i < sfFixed.length; i++) {
    const match = sfFixed[i];
    const m1 = i * 2 + 1;
    const m2 = i * 2 + 2;
    await prisma.match.update({
      where: { id: match.id },
      data: {
        homePlaceholder: `Winner QF M${m1}`,
        awayPlaceholder: `Winner QF M${m2}`
      }
    });
    console.log(`  Match ${match.matchNumber}: Winner QF M${m1} vs Winner QF M${m2}`);
  }

  // Step 6: Fix Third place placeholders
  console.log('\nStep 6: Fixing Third place placeholder...');

  await prisma.match.updateMany({
    where: { stage: 'third' },
    data: {
      homePlaceholder: 'Loser SF M1',
      awayPlaceholder: 'Loser SF M2'
    }
  });
  console.log('  Third place: Loser SF M1 vs Loser SF M2');

  // Step 7: Fix Final placeholders
  console.log('\nStep 7: Fixing Final placeholder...');

  await prisma.match.updateMany({
    where: { stage: 'final' },
    data: {
      homePlaceholder: 'Winner SF M1',
      awayPlaceholder: 'Winner SF M2'
    }
  });
  console.log('  Final: Winner SF M1 vs Winner SF M2');

  // Step 8: Verify counts
  console.log('\n📊 Final match counts:');
  const stages = ['group', 'round32', 'round16', 'quarter', 'semi', 'third', 'final'];
  let total = 0;
  for (const stage of stages) {
    const count = await prisma.match.count({ where: { stage } });
    console.log(`  ${stage}: ${count}`);
    total += count;
  }
  console.log(`  TOTAL: ${total}`);

  console.log('\n✅ Knockout bracket fixed!');
  await prisma.$disconnect();
}

fix().catch(console.error);
