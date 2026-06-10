const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Replace the 6 TBD playoff placeholder teams with their real qualified teams,
 * UPDATING each Team row IN PLACE.
 *
 * WHY IN PLACE (do NOT delete/recreate):
 *   Match.homeTeamId / Match.awayTeamId and every Prediction reference Team.id.
 *   Deleting + recreating a team would orphan those FKs (or cascade-delete
 *   predictions). We only ever change code/name/flagEmoji; id and group are
 *   never touched.
 *
 * IDEMPOTENT:
 *   Each target is located by `code IN [oldCode, newCode]`. The first run finds
 *   the old TBD code; a re-run finds the already-migrated new code. Either way
 *   exactly one row is located per mapping and set to the same final values, so
 *   re-running leaves an identical end state and still reports 6 matched.
 *
 * Match by current code, set new code/name/flag.
 */

const TEAM_UPDATES = [
  { from: 'TBD-A4', code: 'CZE', name: 'Czechia',                flagEmoji: '🇨🇿' },
  { from: 'TBD-B2', code: 'BIH', name: 'Bosnia and Herzegovina', flagEmoji: '🇧🇦' },
  { from: 'TBD-D4', code: 'TUR', name: 'Turkey',                 flagEmoji: '🇹🇷' },
  { from: 'TBD-F3', code: 'SWE', name: 'Sweden',                 flagEmoji: '🇸🇪' },
  { from: 'TBD-I3', code: 'IRQ', name: 'Iraq',                   flagEmoji: '🇮🇶' },
  { from: 'TBD-K2', code: 'COD', name: 'DR Congo',               flagEmoji: '🇨🇩' },
];

async function update() {
  console.log('=== update-real-teams.js ===');
  console.log('Replacing 6 TBD placeholder teams in place (id + group preserved).\n');

  let matched = 0;
  const report = [];

  for (const u of TEAM_UPDATES) {
    // Locate by EITHER the old TBD code or the already-migrated new code.
    const rows = await prisma.team.findMany({
      where: { code: { in: [u.from, u.code] } },
    });

    if (rows.length !== 1) {
      console.error(
        `ERROR: expected exactly 1 team matching code in [${u.from}, ${u.code}], ` +
        `found ${rows.length}. Aborting (no further writes).`
      );
      process.exit(1);
    }

    const before = rows[0];

    // Update IN PLACE by id — never delete/recreate.
    const after = await prisma.team.update({
      where: { id: before.id },
      data: { code: u.code, name: u.name, flagEmoji: u.flagEmoji },
    });

    matched++;
    report.push({ before, after });

    console.log(
      `  [${after.group ?? '?'}] id ${before.id}\n` +
      `      before: ${before.code.padEnd(7)} ${before.flagEmoji ?? ''} ${before.name}\n` +
      `      after : ${after.code.padEnd(7)} ${after.flagEmoji ?? ''} ${after.name}`
    );
  }

  if (matched !== 6) {
    console.error(`\nERROR: expected 6 teams updated, got ${matched}. Aborting.`);
    process.exit(1);
  }

  // Safety assertion: id (and group) must be unchanged for every row.
  for (const { before, after } of report) {
    if (before.id !== after.id || before.group !== after.group) {
      console.error(`\nERROR: id/group changed for ${after.code} — this must never happen. Aborting.`);
      process.exit(1);
    }
  }

  console.log(`\n=== PASS. ${matched} teams updated in place. id + group preserved. ===`);
  await prisma.$disconnect();
}

update().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
