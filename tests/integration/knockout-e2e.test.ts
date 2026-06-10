/**
 * Knockout bracket — END-TO-END validation against the REAL resolver and the
 * REAL migration / fix scripts.
 *
 * Unlike tests/features/knockout-cascade.test.ts (which exercises a *copy* of
 * the resolver logic on hand-built fixtures), this harness seeds throwaway
 * SQLite DBs from the actual scripts and feeds the resulting rows through the
 * PRODUCTION functions `calculateAllPredictedStandings` +
 * `cascadeKnockoutPredictions` (lib/predictedStandings.ts), asserting the
 * bracket fully cascades R32 → Final with zero TBD/null slots.
 *
 * Three scenarios:
 *   FRESH    — current corrected migrate-real-fixtures.js. (A clean install.)
 *   PROD     — faithful prod lineage: OLD migration (git e77c706) →
 *              fix-knockout-matches.js (the historical SF/Final repair) →
 *              fix-knockout-bracket.js (this session's R32/R16/QF repair, run
 *              twice to prove idempotency). This is what the deploy will do.
 *   RISK     — OLD migration → fix-knockout-bracket.js ONLY (skipping the
 *              historical SF/Final repair). Documents that fix-knockout-bracket.js
 *              alone is NOT sufficient: SF/Final stay in the old "QF Winner 1"
 *              format the resolver can't parse, so the Final shows TBD.
 *
 * Heavy (spawns prisma db push + node scripts), so OPT-IN:
 *   E2E_KNOCKOUT=1 npx vitest run tests/integration/knockout-e2e.test.ts
 * Without the flag it is skipped, keeping the default `npm test` suite fast.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import {
  calculateAllPredictedStandings,
  cascadeKnockoutPredictions,
} from '@/lib/predictedStandings';

const RUN = process.env.E2E_KNOCKOUT === '1';
const d = RUN ? describe : describe.skip;

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '.planning', 'debug', 'e2e');
const OLD_COMMIT = 'e77c706';

type Row = {
  id: string;
  matchNumber: number;
  stage: string;
  group: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeTeam: any;
  awayTeam: any;
};

function sh(cmd: string, dbUrl: string) {
  execSync(cmd, { cwd: ROOT, env: { ...process.env, DATABASE_URL: dbUrl }, stdio: 'pipe' });
}

async function readRows(dbUrl: string): Promise<Row[]> {
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    return (await prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: 'asc' },
    })) as unknown as Row[];
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Drive the REAL resolver. Inject a deterministic prediction (home wins 2-1) on
 * every match so the cascade is fully determined, then return the resolved
 * home/away/winner for each knockout match.
 */
function resolveBracket(rows: Row[]) {
  const pred = (m: Row) => [
    { id: `p-${m.id}`, matchId: m.id, predictedHome: 2, predictedAway: 1, predictedWinner: null },
  ];

  const matchesByGroup: { [g: string]: any[] } = {};
  for (const m of rows.filter((r) => r.stage === 'group')) {
    const g = m.group || 'Unknown';
    (matchesByGroup[g] ||= []).push({ ...m, predictions: pred(m) });
  }

  const { qualifiers } = calculateAllPredictedStandings(matchesByGroup as any);

  const knockoutRows = rows.filter((r) => r.stage !== 'group');
  const knockout = knockoutRows.map((m) => ({ ...m, homeTeam: null, awayTeam: null, predictions: pred(m) }));
  const resolved = cascadeKnockoutPredictions(knockout as any, qualifiers as any);
  return { qualifiers, knockoutRows, resolved };
}

// Snapshots captured in beforeAll
let freshRows: Row[];
let prodRows: Row[];
let riskRows: Row[];

d('Knockout bracket E2E (real resolver + real scripts)', () => {
  beforeAll(async () => {
    fs.mkdirSync(WORK, { recursive: true });

    // Push the schema ONCE to a template DB, then clone the file per scenario
    // (each migration starts with deleteMany, so an empty-but-pushed DB is a
    // valid blank slate — this saves two slow `prisma db push` runs).
    const templateFile = path.join(WORK, 'template.db');
    if (fs.existsSync(templateFile)) fs.rmSync(templateFile);
    sh('npx prisma db push --skip-generate --force-reset --accept-data-loss', `file:${templateFile}`);

    const oldScript = path.join(WORK, 'migrate-old-broken.js');
    fs.writeFileSync(oldScript, execSync(`git show ${OLD_COMMIT}:migrate-real-fixtures.js`, { cwd: ROOT }));

    const clone = (name: string) => {
      const f = path.join(WORK, name);
      fs.copyFileSync(templateFile, f);
      return `file:${f}`;
    };

    // FRESH — corrected migration.
    const fresh = clone('fresh.db');
    sh('node migrate-real-fixtures.js', fresh);
    freshRows = await readRows(fresh);

    // PROD — faithful lineage: old migration → fix-knockout-matches.js →
    // fix-knockout-bracket.js (x2 for idempotency).
    const prod = clone('prod.db');
    sh(`node ${JSON.stringify(oldScript)}`, prod);
    sh('node fix-knockout-matches.js', prod);
    sh('node fix-knockout-bracket.js', prod);
    sh('node fix-knockout-bracket.js', prod);
    prodRows = await readRows(prod);

    // RISK — old migration → fix-knockout-bracket.js ONLY (no SF/Final repair).
    const risk = clone('risk.db');
    sh(`node ${JSON.stringify(oldScript)}`, risk);
    sh('node fix-knockout-bracket.js', risk);
    riskRows = await readRows(risk);
  }, 300_000);

  const GROUPS = 'ABCDEFGHIJKL'.split('');

  function bracketInvariants(rows: Row[], label: string) {
    const byStage = (s: string) => rows.filter((m) => m.stage === s);
    expect(byStage('group').length, `${label}: group`).toBe(72);
    expect(byStage('round32').length, `${label}: R32`).toBe(16);
    expect(byStage('round16').length, `${label}: R16`).toBe(8);
    expect(byStage('quarter').length, `${label}: QF`).toBe(4);
    expect(byStage('semi').length, `${label}: SF`).toBe(2);
    expect(byStage('third').length, `${label}: third`).toBe(1);
    expect(byStage('final').length, `${label}: final`).toBe(1);
    expect(rows.length, `${label}: total`).toBe(104);

    // No leftover positional / TBD placeholders anywhere in the knockout bracket.
    for (const m of rows.filter((r) => r.stage !== 'group')) {
      for (const ph of [m.homePlaceholder, m.awayPlaceholder]) {
        expect(ph, `${label}: m${m.matchNumber} placeholder present`).toBeTruthy();
        expect(ph, `${label}: m${m.matchNumber} no 'Group' leftover`).not.toMatch(/Group/);
        expect(ph, `${label}: m${m.matchNumber} no TBD leftover`).not.toMatch(/TBD/i);
      }
    }

    // R32: each group's Winner + Runner-up exactly once; 8 third slots, all away.
    const r32 = byStage('round32');
    const r32Home = r32.map((m) => m.homePlaceholder!);
    const r32Away = r32.map((m) => m.awayPlaceholder!);
    const allR32 = [...r32Home, ...r32Away];
    for (const g of GROUPS) {
      expect(allR32.filter((p) => p === `Winner ${g}`).length, `${label}: Winner ${g} x1`).toBe(1);
      expect(allR32.filter((p) => p === `Runner-up ${g}`).length, `${label}: Runner-up ${g} x1`).toBe(1);
    }
    expect(r32Away.filter((p) => p.startsWith('3rd ')).length, `${label}: 8 thirds away`).toBe(8);
    expect(r32Home.filter((p) => p.startsWith('3rd ')).length, `${label}: 0 thirds home`).toBe(0);

    // R16/QF feeders reference each upstream ordinal exactly once.
    const r16Feeders = byStage('round16').flatMap((m) => [m.homePlaceholder!, m.awayPlaceholder!]);
    for (let n = 1; n <= 16; n++)
      expect(r16Feeders.filter((p) => p === `Winner R32 M${n}`).length, `${label}: R16 feeder R32 M${n}`).toBe(1);
    const qfFeeders = byStage('quarter').flatMap((m) => [m.homePlaceholder!, m.awayPlaceholder!]);
    for (let n = 1; n <= 8; n++)
      expect(qfFeeders.filter((p) => p === `Winner R16 M${n}`).length, `${label}: QF feeder R16 M${n}`).toBe(1);
  }

  function assertFullyPopulated(rows: Row[], label: string) {
    const { resolved, knockoutRows, qualifiers } = resolveBracket(rows);

    for (const g of GROUPS) {
      expect(qualifiers.winners[g], `${label}: winner ${g}`).toBeTruthy();
      expect(qualifiers.runnersUp[g], `${label}: runner-up ${g}`).toBeTruthy();
    }
    expect(qualifiers.bestThirds.length, `${label}: 8 best thirds`).toBe(8);

    const failures: string[] = [];
    for (const m of knockoutRows) {
      const r = resolved[m.id];
      if (!(r && r.home && r.away && r.winner)) {
        failures.push(
          `m${m.matchNumber} (${m.stage}) "${m.homePlaceholder}" vs "${m.awayPlaceholder}" → ` +
            `home=${r?.home?.code ?? 'TBD'} away=${r?.away?.code ?? 'TBD'} winner=${r?.winner?.code ?? 'TBD'}`
        );
      }
    }
    expect(failures, `${label}: unresolved slots →\n${failures.join('\n')}`).toEqual([]);
    return resolved;
  }

  // ── FRESH (corrected migration) ──
  it('FRESH: bracket data is structurally valid', () => bracketInvariants(freshRows, 'fresh'));
  it('FRESH: full cascade populates R32→Final with zero TBD', () => {
    const resolved = assertFullyPopulated(freshRows, 'fresh');
    const fin = freshRows.find((m) => m.stage === 'final')!;
    const r = resolved[fin.id];
    // eslint-disable-next-line no-console
    console.log(`[fresh] Predicted Final (m104): ${r.home?.code} vs ${r.away?.code} → champion ${r.winner?.code}`);
  });

  // ── PROD (faithful deploy lineage) ──
  it('PROD lineage: bracket data is structurally valid', () => bracketInvariants(prodRows, 'prod'));
  it('PROD lineage: full cascade populates R32→Final with zero TBD', () => {
    const resolved = assertFullyPopulated(prodRows, 'prod');
    const fin = prodRows.find((m) => m.stage === 'final')!;
    const r = resolved[fin.id];
    // eslint-disable-next-line no-console
    console.log(`[prod ] Predicted Final (m104): ${r.home?.code} vs ${r.away?.code} → champion ${r.winner?.code}`);
  });
  it('PROD lineage: matches a fresh seed across the whole knockout bracket', () => {
    const map = (rows: Row[]) =>
      Object.fromEntries(
        rows.filter((m) => m.stage !== 'group').map((m) => [m.matchNumber, `${m.homePlaceholder} | ${m.awayPlaceholder}`])
      );
    expect(map(prodRows)).toEqual(map(freshRows));
  });

  // ── RISK (documents the SF/Final dependency) ──
  it('RISK: fix-knockout-bracket.js ALONE leaves SF/Final unresolved (Final = TBD)', () => {
    // SF/third/final keep the old "QF Winner 1" / "SF Winner 1" format the
    // resolver cannot parse — so the cascade cannot reach the Final.
    const { resolved, knockoutRows } = resolveBracket(riskRows);
    const fin = riskRows.find((m) => m.stage === 'final')!;
    expect(resolved[fin.id]?.winner, 'risk: Final champion should be TBD').toBeFalsy();
    const populated = knockoutRows.filter((m) => {
      const r = resolved[m.id];
      return r && r.home && r.away && r.winner;
    }).length;
    expect(populated, 'risk: not all 32 populate without SF/Final repair').toBeLessThan(32);
  });
});
