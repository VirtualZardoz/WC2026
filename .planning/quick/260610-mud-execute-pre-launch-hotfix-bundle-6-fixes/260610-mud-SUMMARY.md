---
phase: quick-260610-mud
plan: 01
subsystem: frontend, api, validation, tests
tags: [hotfix, ios, fairness, timezone, bracket-cascade, validation, tdd]
dependency_graph:
  requires: [260610-jx7]
  provides: [result-validation, cascade-ordering, deadline-tz, notification-guard, prediction-gate]
  affects: [result/route.ts, bulk-result/route.ts, InactivityMonitor.tsx, leaderboard/[id]/page.tsx, AdminSettingsClient.tsx]
tech_stack:
  added: [lib/result-validation.ts]
  patterns: [pure-validation-helper, cascade-after-transaction, server-side-gating, local-datetime-init]
key_files:
  created:
    - lib/result-validation.ts
    - tests/features/result-validation.test.ts
    - tests/features/deadline-format.test.ts
  modified:
    - components/InactivityMonitor.tsx
    - app/(main)/leaderboard/[id]/page.tsx
    - app/(main)/admin/settings/AdminSettingsClient.tsx
    - app/api/admin/matches/result/route.ts
    - app/api/admin/matches/bulk-result/route.ts
decisions:
  - Fix 5c batch strategy: 400 the whole batch listing offending matchNumbers in the `error` field — AdminMatchesClient.tsx only reads data.error on !response.ok; no per-match error UI exists; all-or-nothing is less invasive than skip+report
  - Validation helper extracted to lib/result-validation.ts to keep both routes DRY without duplicating logic
metrics:
  duration: 481s
  completed: 2026-06-10
  tasks_completed: 3
  files_modified: 8
---

# Quick Task 260610-mud: Pre-Launch Hotfix Bundle Summary

Six pre-launch fixes implemented with smallest-possible diffs. App is LIVE; this was an approved change-managed exception.

**One-liner:** iOS Notification guard, pre-deadline prediction fairness gate, deadline timezone round-trip fix, bracket cascade moved after $transaction in both routes, result-input validation via pure helper, plus focused tests — all as minimal targeted patches before 2026-06-11 kickoff.

---

## Fix Confirmation (per spec)

### Fix 1 — iOS Safari crash guard
**File:** `components/InactivityMonitor.tsx`
**Diff shape (2 lines changed):**
- Line 26: `if (Notification.permission === 'granted')` → `if (typeof Notification !== 'undefined' && Notification.permission === 'granted')`
- Line 90: `if (Notification.permission === 'default')` → `if (typeof Notification !== 'undefined' && Notification.permission === 'default')`
**Verification:** `npx tsc --noEmit` passes. Both call sites grepped and confirmed guarded. Commit `fdefac4`.

### Fix 2 — Pre-deadline prediction leak
**File:** `app/(main)/leaderboard/[id]/page.tsx`
**Diff shape:** Added `getServerSession`/`authOptions` imports; added `tournament` and `session` to `Promise.all`; computed `deadlinePassed`, `isOwner`, `canSeePredictions`; replaced predictions `<table>` block (lines ~105-176) with a conditional: shows table when `canSeePredictions`, shows a notice card otherwise.
**Verification:** `npx tsc --noEmit` passes. Server-side gating: other users see "Predictions are hidden until the deadline passes." Owner sees their own table regardless of deadline. Commit `fdefac4`.

### Fix 3 — Deadline form timezone bug
**File:** `app/(main)/admin/settings/AdminSettingsClient.tsx`
**Diff shape:** Added pure `toLocalDatetimeInput(iso)` helper above component; replaced `useState` initializer from `.toISOString().slice(0,16)` (UTC wall clock) to `toLocalDatetimeInput(...)` (local time parts). `handleSaveDeadline` unchanged.
**Verification:** `npx tsc --noEmit` passes. deadline-format tests (3/3) prove round-trip is a no-op: `new Date(toLocalDatetimeInput(iso)).toISOString() === iso`. Commit `fdefac4`.

### Fix 4 — Bracket cascade ordering (both routes)
**Files:** `app/api/admin/matches/result/route.ts`, `app/api/admin/matches/bulk-result/route.ts`

**result/route.ts:**
- `prisma.$transaction(...)` at line 94; cascade calls (`updateKnockoutBracket` / `advanceKnockoutWinner`) at lines 116/118.
- Cascade is textually AFTER the `$transaction` close. NOT inside the tx.
- Corrected comment: "Run bracket cascade AFTER the transaction commits so the cascade reads the just-written result."

**bulk-result/route.ts:**
- `prisma.$transaction(...)` at line 118 (per-match, inside the write loop); cascade calls at lines 140/142.
- Cascade is textually AFTER the `$transaction` close for each match. NOT inside the tx.
- Corrected comment: "Run bracket cascade AFTER the transaction commits for this match..."

**Verification:** `npx tsc --noEmit` passes. grep confirms cascade lines > transaction lines in both files. knockout-cascade 17/17 green. Commits `09c5f0d`, `5186c39`.

### Fix 5 — Result input validation (both routes)
**Files:** `lib/result-validation.ts` (new), `app/api/admin/matches/result/route.ts`, `app/api/admin/matches/bulk-result/route.ts`

**lib/result-validation.ts:** Pure `validateResultInput` function. Checks: (a) integers 0-99, rejects null; (d) placeholder teams (homeTeamId/awayTeamId null); (b) foreign winnerId; (c) knockout draw without winnerId.

**result/route.ts:** Import added; early `!matchId` guard kept; old `homeScore === undefined` check removed; `validateResultInput` called after match fetch; returns 400 with `validationErr.message` on failure. Scoring and idempotency untouched.

**bulk-result/route.ts (Fix 5c):** Validation pass before any writes. Fetches all matches into `matchCache`, runs `validateResultInput` on each entry, collects offending `matchNumber`s. If any fail: returns `{ error: "Invalid results for match(es): <list>" }` with status 400 — unchanged `error` field, same response shape the consumer (`AdminMatchesClient.tsx` `saveBulkResults`) reads via `data.error`. No new fields. Write loop uses `matchCache` to avoid double-fetch. Knockout-draw-without-winner is now a 400 (was silent `actualWinnerId = null`).

**Verification:** result-validation tests 12/12 pass. `npx tsc --noEmit` passes. Commits `09c5f0d`, `5186c39`.

### Fix 6 — Tests
**Files:** `tests/features/result-validation.test.ts` (12 tests), `tests/features/deadline-format.test.ts` (3 tests)

- result-validation: 12 pure-function tests covering valid cases, all SCORES rejections (null/string/out-of-range/float/negative), PLACEHOLDER, WINNER (foreign id), KNOCKOUT_DRAW (null/undefined).
- deadline-format: 3 tests for format regex and round-trip no-op at two different times.
- All 15 new tests pass.
- Existing suites unchanged in intent and all green: **scoring 14/14**, **knockout-cascade 17/17**.

**Environmental pre-existing failures** (not caused by this bundle):
- `security-headers.test.ts`: 7 ECONNREFUSED:3000 (need running dev server)
- `signup-toggle.integration.test.ts`: 5 failures (ECONNREFUSED/DATABASE_URL — need running server and DB)
- `signup-toggle.test.ts`: 3 DATABASE_URL errors (pre-existing)
- `knockout-e2e.test.ts`: 6 skipped (pre-existing environmental)

**Verification:** `npm test -- tests/features/result-validation.test.ts tests/features/deadline-format.test.ts` → 15/15 pass. Commit `5186c39`.

---

## Commits

| Hash | Message | Task |
|------|---------|------|
| `fdefac4` | fix(ui): guard Notification global + gate pre-deadline predictions + fix deadline tz init | Task 1 (Fix 1, 2, 3) |
| `09c5f0d` | fix(api): add shared result validation + move bracket cascade after tx (single route) | Task 2 (Fix 4, 5) |
| `5186c39` | fix(api): harden bulk-result validation/cascade + add validation & deadline tests | Task 3 (Fix 5c, Fix 4 bulk, Fix 6) |

**NOT pushed. NOT deployed.** Prod deploy is a separate manual procedure by Alexandre.

---

## Deviations from Plan

None — plan executed exactly as written. All three suggested commit messages were used verbatim (with minor additions). The matchCache map in bulk-result (to avoid double-fetch) is explicitly permitted by the plan.

---

## Known Stubs

None — all fixes are complete end-to-end for their stated goals within this bundle's scope.

---

## Self-Check: PASSED

Files exist:
- lib/result-validation.ts: FOUND
- tests/features/result-validation.test.ts: FOUND
- tests/features/deadline-format.test.ts: FOUND

Commits exist: fdefac4, 09c5f0d, 5186c39 (confirmed via git log above).
