/**
 * Result Validation Tests
 *
 * Pure-logic tests for validateResultInput.
 * No DB, no Prisma, no mocks needed — the function is fully pure.
 *
 * Cascade-after-tx ordering (Fix 4) is a structural property of the routes,
 * not pure logic. It is covered structurally: the cascade calls
 * (updateKnockoutBracket / advanceKnockoutWinner) textually follow
 * prisma.$transaction in both result/route.ts and bulk-result/route.ts.
 * The existing knockout-cascade suite (17/17) stays green as the
 * structural regression guard for that ordering.
 */

import { describe, it, expect } from 'vitest';
import { validateResultInput } from '@/lib/result-validation';

// ---------------------------------------------------------------------------
// Shared fixtures (inline factory objects per TESTING.md factory pattern)
// ---------------------------------------------------------------------------
const GROUP_MATCH = { homeTeamId: 'H', awayTeamId: 'A', stage: 'group' };
const KO_MATCH = { homeTeamId: 'H', awayTeamId: 'A', stage: 'round32' };
const PLACEHOLDER_MATCH = { homeTeamId: null, awayTeamId: 'A', stage: 'round32' };

describe('validateResultInput', () => {
  // ---- valid cases ---------------------------------------------------------

  it('group match, valid integer scores -> returns null', () => {
    expect(validateResultInput({ homeScore: 2, awayScore: 1, winnerId: null }, GROUP_MATCH)).toBeNull();
  });

  it('knockout win (2-1) with no winnerId -> null (winner derived from score)', () => {
    expect(validateResultInput({ homeScore: 2, awayScore: 1, winnerId: null }, KO_MATCH)).toBeNull();
  });

  it('knockout draw (2-2) with winnerId = homeTeamId -> null (valid)', () => {
    expect(validateResultInput({ homeScore: 2, awayScore: 2, winnerId: 'H' }, KO_MATCH)).toBeNull();
  });

  // ---- SCORES rejections ---------------------------------------------------

  it('homeScore null -> SCORES error', () => {
    const err = validateResultInput({ homeScore: null, awayScore: 1, winnerId: null }, GROUP_MATCH);
    expect(err?.code).toBe('SCORES');
  });

  it('awayScore as string -> SCORES error', () => {
    const err = validateResultInput({ homeScore: 1, awayScore: '2', winnerId: null }, GROUP_MATCH);
    expect(err?.code).toBe('SCORES');
  });

  it('homeScore 100 (out of range) -> SCORES error', () => {
    const err = validateResultInput({ homeScore: 100, awayScore: 0, winnerId: null }, GROUP_MATCH);
    expect(err?.code).toBe('SCORES');
  });

  it('homeScore 1.5 (non-integer) -> SCORES error', () => {
    const err = validateResultInput({ homeScore: 1.5, awayScore: 0, winnerId: null }, GROUP_MATCH);
    expect(err?.code).toBe('SCORES');
  });

  it('negative score -> SCORES error', () => {
    const err = validateResultInput({ homeScore: -1, awayScore: 0, winnerId: null }, GROUP_MATCH);
    expect(err?.code).toBe('SCORES');
  });

  // ---- PLACEHOLDER rejection -----------------------------------------------

  it('match with homeTeamId null (unresolved placeholder) -> PLACEHOLDER error', () => {
    const err = validateResultInput({ homeScore: 1, awayScore: 0, winnerId: null }, PLACEHOLDER_MATCH);
    expect(err?.code).toBe('PLACEHOLDER');
  });

  // ---- WINNER rejection ----------------------------------------------------

  it('knockout match, winnerId = foreign id -> WINNER error', () => {
    const err = validateResultInput({ homeScore: 2, awayScore: 1, winnerId: 'FOREIGN' }, KO_MATCH);
    expect(err?.code).toBe('WINNER');
  });

  // ---- KNOCKOUT_DRAW rejection ---------------------------------------------

  it('knockout draw (2-2) with winnerId null -> KNOCKOUT_DRAW error', () => {
    const err = validateResultInput({ homeScore: 2, awayScore: 2, winnerId: null }, KO_MATCH);
    expect(err?.code).toBe('KNOCKOUT_DRAW');
  });

  it('knockout draw (2-2) with winnerId undefined -> KNOCKOUT_DRAW error', () => {
    const err = validateResultInput({ homeScore: 2, awayScore: 2, winnerId: undefined }, KO_MATCH);
    expect(err?.code).toBe('KNOCKOUT_DRAW');
  });
});
