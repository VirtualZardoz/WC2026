---
phase: quick-260610-jx7
plan: "01"
subsystem: scoring
tags: [scoring, refactor, transaction, tdd, knockout, idempotency]
dependency_graph:
  requires: []
  provides: [lib/scoring.ts]
  affects:
    - app/api/admin/matches/result/route.ts
    - app/api/admin/matches/bulk-result/route.ts
tech_stack:
  added: []
  patterns:
    - Pure function extraction (DB-free scoring module)
    - prisma.$transaction for atomic result + point writes
    - TDD (tests written alongside implementation, 14 assertions)
key_files:
  created:
    - lib/scoring.ts
    - tests/features/scoring.test.ts
  modified:
    - app/api/admin/matches/result/route.ts
    - app/api/admin/matches/bulk-result/route.ts
decisions:
  - "Transaction strategy: Option B — cascade outside tx, match.update + prediction writes inside"
  - "predictedWinner UI behavior confirmed: field is ONLY populated for knockout draw predictions"
  - "isBonusMatch documented as no-op BY DESIGN; not a parameter of calculatePredictionPoints"
metrics:
  duration_minutes: 15
  completed: "2026-06-10T12:30:47Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Quick Task 260610-jx7: Harden the Prediction Scoring Engine — Summary

**One-liner:** Pure `calculatePredictionPoints` function in `lib/scoring.ts` eliminates byte-identical scoring duplication; both result endpoints now call it inside `prisma.$transaction` for atomic, idempotent result + point writes.

---

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create pure scoring function + write its tests | `292cc1b` | `lib/scoring.ts`, `tests/features/scoring.test.ts` |
| 2 | Refactor both result endpoints to call shared function inside a transaction | `5aa2a80` | `app/api/admin/matches/result/route.ts`, `app/api/admin/matches/bulk-result/route.ts` |

---

## Mandatory Reporting Items

### (a) How predictedWinner is set in the knockout UI

**Confirmed — the plan's finding is correct.** In `components/MatchCard.tsx` lines 144 and 159:

```typescript
predictedWinner: isKnockout && isDraw ? winner : null,
```

`winner` is the string literal `'home'` or `'away'` (a slot, not a team ID). This means:

- **For knockout draw predictions:** `predictedWinner` is set to `'home'` or `'away'` (the user's penalty-winner pick).
- **For all other knockout predictions (home-win or away-win score):** `predictedWinner` is `null`. The intended winner is implied by the predicted score (e.g., 2-1 implies home).
- **For group stage:** `predictedWinner` is always `null` (no winner concept).

`app/api/predictions/route.ts` upserts `predictedWinner` straight through with no transformation.

**Consequence for the scoring fix:** `calculatePredictionPoints` correctly honors the explicit field when set (`'home'` or `'away'`), and falls back to score-derived winner when it is `null`. This handles today's draw/penalty use-case correctly AND is robust if the UI later sets `predictedWinner` on non-draw predictions.

### (b) Transaction strategy chosen

**Option B was chosen:** The bracket cascade functions (`updateKnockoutBracket`, `advanceKnockoutWinner`) are called outside the `prisma.$transaction`, while the `match.update` (score) and all per-prediction `pointsEarned` writes run atomically inside the transaction.

**Rationale:**

1. **Scope constraint.** The task explicitly states "Do NOT touch the verified knockout bracket placeholder/feeder DATA." Threading a tx client into `updateKnockoutBracket` and `advanceKnockoutWinner` would require modifying both functions and their internal `prisma.match.update` calls — a meaningful change to verified, deployed cascade logic that could introduce regressions in bracket progression.

2. **Highest-value invariant met.** The critical failure mode was: result score written, but a mid-loop failure leaves some predictions with old points. Option B eliminates this: the match result and all prediction point writes for that match are a single atomic unit. A crash before the transaction leaves the old result and old points intact (consistent). A crash after leaves the new result and new points (also consistent).

3. **Cascade is idempotent by nature.** `updateKnockoutBracket` reads standings and updates slots; `advanceKnockoutWinner` writes a team to the next match. Running them outside the tx means a cascade failure after a match update could leave an intermediate bracket state, but re-running result entry fixes this. The points atomicity (Option B's scope) is the more impactful correctness property.

### Corrected expected-points numbers from the behavior block

All example numbers in the behavior block were verified against the stated rules before locking in tests. One clarification was applied:

**Plan comment for "score-derived fallback" case:**
> "predicted 3-0 vs 1-0 both home-win => result correct => 1 base + winner 1 => 2"
> (NOTE recompute: ...)

The plan itself self-corrected this inline: predicted 3-0 vs real 1-0 is a wrong-score but correct-result (both home-win), so base = 1, plus score-derived winner H == actual winner H (+1) => **2 total**. Test locks in 2. This matched the rules exactly — no change needed.

No other example numbers disagreed with the rules.

---

## Test Results

### Scoring tests (new): 14/14 passed
```
tests/features/scoring.test.ts (14 tests)
  Group stage scoring (4 tests)
  Knockout stage scoring (8 tests)
  isBonusMatch does not change points (1 test)
  Idempotency (1 test)
```

### Full suite (covering previous + new tests):
- `tests/features/scoring.test.ts` — 14 passed
- `tests/features/knockout-cascade.test.ts` — 17 passed
- `tests/features/bonus-matches.test.ts` — 20 passed
- `tests/features/leaderboard.test.ts` — 16 passed
- `tests/security/password-validation.test.ts` — 9 passed
- `tests/security/rate-limit.test.ts` — 7 passed
- **88 tests passed, 0 new failures introduced**

Pre-existing failures (out of scope, unrelated to scoring):
- `tests/security/security-headers.test.ts` — 7 failures (ECONNREFUSED: requires running dev server)
- `tests/integration/signup-toggle.integration.test.ts` — 5 failures (ECONNREFUSED + missing DATABASE_URL)
- `tests/features/signup-toggle.test.ts` — 3 failures (missing DATABASE_URL in test env)

These failures existed before this task (verified via `git stash`).

### TypeScript: `npx tsc --noEmit` — PASS (zero errors)

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all data flows through the real `calculatePredictionPoints` function with no placeholders or hardcoded values.

---

## Self-Check: PASSED

Files verified:
- FOUND: `/mnt/d/~HAL-ecosystem/projects/wc2026/lib/scoring.ts`
- FOUND: `/mnt/d/~HAL-ecosystem/projects/wc2026/tests/features/scoring.test.ts`
- FOUND: `calculatePredictionPoints` import in both route files

Commits verified:
- `292cc1b` — Task 1: pure scoring function + tests
- `5aa2a80` — Task 2: endpoint refactor with transaction

---

## Deployment (2026-06-10)

**Status: DEPLOYED to production · pushed to origin/main · app FROZEN for launch.**

- Built locally from `b82783d` and shipped as prod build **`EvA-AMSoi2IsORxHDQ-qj`**. The API
  scoring routes (`result/route.ts`, `bulk-result/route.ts`) compile into the `.next` server
  bundle, so the build swap deployed the new scoring engine.
- **Verified live:** consistent build id across requests; `/login` + auth endpoints return 200;
  old build assets now 404 (clean cutover).
- **Pushed to origin/main:** the 4 scoring commits `292cc1b → b82783d` are on `origin/main`
  (origin was at `8bbea89`, now `b82783d`).
- **Freeze:** App is frozen — no further changes while users predict (Alexandre's directive).
  Any remaining scoring / UX-polish items are **post-launch backlog**, not pending work.
- Nothing outstanding on the scoring task.
