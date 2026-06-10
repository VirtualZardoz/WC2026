---
phase: quick-260610-mud
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - components/InactivityMonitor.tsx
  - app/(main)/leaderboard/[id]/page.tsx
  - app/(main)/admin/settings/AdminSettingsClient.tsx
  - lib/result-validation.ts
  - app/api/admin/matches/result/route.ts
  - app/api/admin/matches/bulk-result/route.ts
  - tests/features/result-validation.test.ts
  - tests/features/deadline-format.test.ts
autonomous: true
requirements: [FIX-1, FIX-2, FIX-3, FIX-4, FIX-5, FIX-6]
must_haves:
  truths:
    - "iOS Safari (no Notification global) loads the app without a white screen"
    - "Before the deadline, a user viewing ANOTHER user's leaderboard detail page sees no prediction rows, only a hidden-until-deadline notice; the owner sees their own"
    - "Admin deadline form open->save->reopen does not shift the stored deadline"
    - "Entering the 72nd group result fills best-third R32 slots (cascade runs after the result is committed)"
    - "Result routes reject null/string/out-of-range scores, foreign winnerId, and unresolved-placeholder matches with 400"
    - "Bulk-result rejects a knockout draw with no winnerId via a 400 listing offending matchNumbers"
  artifacts:
    - path: components/InactivityMonitor.tsx
      provides: "Notification global guarded at both call sites"
      contains: "typeof Notification"
    - path: app/(main)/leaderboard/[id]/page.tsx
      provides: "Server-side pre-deadline prediction gating"
      contains: "getServerSession"
    - path: app/(main)/admin/settings/AdminSettingsClient.tsx
      provides: "Local-time datetime-local initialization"
    - path: lib/result-validation.ts
      provides: "Pure result-input validation helper shared by both routes"
      exports: ["validateResultInput"]
    - path: app/api/admin/matches/result/route.ts
      provides: "Cascade-after-tx + validation"
    - path: app/api/admin/matches/bulk-result/route.ts
      provides: "Cascade-after-tx + validation + knockout-draw 400 batch"
    - path: tests/features/result-validation.test.ts
      provides: "Validation rejection coverage"
    - path: tests/features/deadline-format.test.ts
      provides: "Deadline round-trip no-op coverage"
  key_links:
    - from: app/api/admin/matches/result/route.ts
      to: lib/result-validation.ts
      via: "import validateResultInput"
      pattern: "validateResultInput"
    - from: app/api/admin/matches/bulk-result/route.ts
      to: lib/result-validation.ts
      via: "import validateResultInput"
      pattern: "validateResultInput"
    - from: app/api/admin/matches/result/route.ts
      to: lib/tournament.ts
      via: "cascade call AFTER $transaction"
      pattern: "advanceKnockoutWinner|updateKnockoutBracket"
---

<objective>
Execute the locked pre-launch hotfix bundle (.planning/HOTFIX-BUNDLE-SPEC-2026-06-10.md): SIX verified fixes, smallest-possible diffs, NO refactoring, NO drive-by cleanups. App is LIVE and FROZEN; this is an approved change-managed exception. Commit atomically. Do NOT push, do NOT deploy.

Purpose: Eliminate the iOS white-screen crash, the pre-deadline fairness leak, the deadline timezone drift, the bracket-cascade-reads-stale-DB bug, and missing result-input validation — before kickoff 2026-06-11.
Output: Three frontend fixes, one shared validation helper, two hardened result routes, and focused tests.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/HOTFIX-BUNDLE-SPEC-2026-06-10.md
@.planning/STATE.md

<interfaces>
<!-- Confirmed by planner from current source. Use directly; do not re-explore. -->

Deadline read pattern (from app/api/predictions/route.ts:68-77):
```ts
const tournament = await prisma.tournament.findFirst({ where: { isActive: true } });
if (tournament && new Date() > new Date(tournament.predictionDeadline)) { /* locked */ }
```

lib/scoring.ts (single source of truth — DO NOT reintroduce inline scoring math):
```ts
export function calculatePredictionPoints(prediction: PredictionInput, ctx: ScoringContext): number
```

CONFIRMED current order in BOTH result/route.ts (lines 91-96) and bulk-result/route.ts (lines 86-91):
the cascade (updateKnockoutBracket / advanceKnockoutWinner) runs BEFORE the prisma.$transaction
that writes realScoreHome/realScoreAway. Both use the module-level `prisma` client (import prisma from '@/lib/prisma').

AdminMatchesClient.tsx bulk consumer (saveBulkResults, lines 111-148):
on `!response.ok` -> `alert(data.error || 'Failed to save bulk results')` and returns.
It does NOT read any per-match error array. There is NO UI for a list of skipped entries.

Tests: Vitest, environment 'node', globals on, include tests/**/*.test.ts, alias '@' -> root.
Existing suites are pure-function/extracted-logic style (no DOM, no DB). scoring.test.ts already exists.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Frontend fixes 1-3 (Notification guard, prediction leak, deadline timezone)</name>
  <files>components/InactivityMonitor.tsx, app/(main)/leaderboard/[id]/page.tsx, app/(main)/admin/settings/AdminSettingsClient.tsx</files>
  <action>
Three independent minimal frontend fixes. Smallest diffs only.

FIX 1 — components/InactivityMonitor.tsx (iOS Safari crash guard):
- Line ~26 (`showWarning`): change `if (Notification.permission === 'granted')` to
  `if (typeof Notification !== 'undefined' && Notification.permission === 'granted')`.
- Line ~90 (mount effect): change `if (Notification.permission === 'default')` to
  `if (typeof Notification !== 'undefined' && Notification.permission === 'default')`.
- Do NOT add an error boundary. Do NOT touch anything else in the file.

FIX 2 — app/(main)/leaderboard/[id]/page.tsx (pre-deadline prediction leak, server-side):
- Add imports: `import { getServerSession } from 'next-auth';` and `import { authOptions } from '@/lib/auth';`.
- In the page component, fetch the active tournament alongside the existing Promise.all (add
  `prisma.tournament.findFirst({ where: { isActive: true } })`) and call
  `const session = await getServerSession(authOptions);`.
- Compute `const deadlinePassed = !tournament || new Date() > new Date(tournament.predictionDeadline);`
  and `const isOwner = session?.user?.id === params.id;`.
- Define `const canSeePredictions = deadlinePassed || isOwner;`.
- Keep the stats cards (totals/points) exactly as-is (they are zeros pre-deadline by design — spec says they may stay).
- Replace the predictions `<table>` block (lines ~105-176) so that when `canSeePredictions` is false it renders a
  short notice card instead of the table — e.g. a `card` div with text "Predictions are hidden until the deadline passes."
  When `canSeePredictions` is true, render the existing table UNCHANGED.
  Keep the diff to the table-vs-notice conditional only; do not restructure stats or the header.

FIX 3 — app/(main)/admin/settings/AdminSettingsClient.tsx (deadline timezone, ~line 71):
- The save path (`handleSaveDeadline`, ~line 165) already does `new Date(deadline).toISOString()`, which parses
  the datetime-local value as browser-LOCAL. The bug is initialization using UTC wall time via `.toISOString().slice(0,16)`.
- Replace the `useState` initializer (lines 69-73) so it builds a LOCAL `YYYY-MM-DDTHH:mm` string from local date parts.
  Add a small local helper above the component, e.g.:
  ```ts
  function toLocalDatetimeInput(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  ```
  and initialize with `settings.tournament?.predictionDeadline ? toLocalDatetimeInput(settings.tournament.predictionDeadline) : ''`.
- Do NOT change handleSaveDeadline. Net effect: open->save->reopen is a no-op on the stored value.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>Both Notification call sites guarded with `typeof Notification !== 'undefined'`; leaderboard detail page hides other users' prediction rows pre-deadline (owner exempt) and shows a notice; deadline input initializes from local time parts. tsc passes.</done>
</task>

<task type="auto">
  <name>Task 2: Shared validation helper + result/route.ts (Fix 5 + Fix 4)</name>
  <files>lib/result-validation.ts, app/api/admin/matches/result/route.ts</files>
  <action>
Create one small pure validation helper (testable per the codebase's extract-logic test philosophy; this is the
LEAST-invasive way to satisfy Fix 5 in BOTH routes without duplicating validation logic), then apply it + Fix 4 to the single route.

CREATE lib/result-validation.ts — pure, no Prisma import, no side effects:
```ts
export type MatchTeams = { homeTeamId: string | null; awayTeamId: string | null; stage: string };
export type ResultValidationError = { code: 'SCORES' | 'PLACEHOLDER' | 'WINNER' | 'KNOCKOUT_DRAW'; message: string };

/**
 * Validate a single result-entry payload against the match it targets.
 * Returns null when valid, or the first ResultValidationError otherwise.
 * Pure: no DB, no side effects.
 */
export function validateResultInput(
  input: { homeScore: unknown; awayScore: unknown; winnerId: unknown },
  match: MatchTeams
): ResultValidationError | null {
  const { homeScore, awayScore, winnerId } = input;
  // (a) integers 0-99, explicitly reject null
  const validScore = (s: unknown): s is number =>
    Number.isInteger(s) && (s as number) >= 0 && (s as number) <= 99;
  if (!validScore(homeScore) || !validScore(awayScore)) {
    return { code: 'SCORES', message: 'Scores must be integers between 0 and 99' };
  }
  // (d) reject unresolved-placeholder matches
  if (match.homeTeamId === null || match.awayTeamId === null) {
    return { code: 'PLACEHOLDER', message: 'Cannot enter a result for a match with unresolved teams' };
  }
  // (b) if winnerId provided, must be one of the two teams
  if (winnerId !== null && winnerId !== undefined &&
      winnerId !== match.homeTeamId && winnerId !== match.awayTeamId) {
    return { code: 'WINNER', message: 'Winner must be one of the two teams in the match' };
  }
  // (c) knockout draw needs a winnerId
  if (match.stage !== 'group' && (homeScore as number) === (awayScore as number) &&
      (winnerId === null || winnerId === undefined)) {
    return { code: 'KNOCKOUT_DRAW', message: 'Winner selection is required for knockout draws' };
  }
  return null;
}
```
Notes: this consolidates the spec's Fix 5 a/b/c/d. The KNOCKOUT_DRAW check supersedes the route's existing inline
draw-winner check.

EDIT app/api/admin/matches/result/route.ts:
- Import: `import { validateResultInput } from '@/lib/result-validation';`.
- Keep the existing `!matchId` guard but REMOVE the `homeScore === undefined || awayScore === undefined` portion's role as
  the only score check — replace the score validation by calling validateResultInput AFTER `match` is fetched (validation
  needs match teams/stage). Concretely: after the `if (!match) 404` block, call:
  ```ts
  const err = validateResultInput({ homeScore, awayScore, winnerId }, match);
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  ```
  Keep an early `if (!matchId) return 400` guard for the missing-id case.
- The existing knockout actualWinnerId block (lines 39-55): the `if (!winnerId) return 400` inner guard is now redundant
  (validateResultInput already 400s KNOCKOUT_DRAW before this runs). You may keep the `actualWinnerId = winnerId` assignment
  for the draw branch; remove only the now-dead inner `!winnerId` 400 (smallest safe change — optional, do not refactor the block otherwise).
- FIX 4 (cascade ordering): MOVE the cascade block (currently lines 91-96, the
  `if (match.stage === 'group') await updateKnockoutBracket(); else if (actualWinnerId) await advanceKnockoutWinner(...)`)
  to AFTER the `await prisma.$transaction(...)` call completes (i.e., between the transaction and the final
  `return NextResponse.json(...)`). Do NOT move it inside the transaction (it uses module-level prisma by design).
- Fix the misleading comment block (lines 83-91): replace "Run bracket cascade BEFORE the transaction so the match state it
  reads is current." with a correct note that the cascade runs AFTER the tx commits so it reads the just-written result.
- Do NOT touch lib/scoring.ts usage or the scoredUpdates computation. Preserve idempotency.
  </action>
  <verify>
    <automated>npx tsc --noEmit</automated>
  </verify>
  <done>lib/result-validation.ts exists and is pure; result/route.ts calls validateResultInput and 400s on invalid scores/placeholder/winner/knockout-draw; cascade runs AFTER the $transaction; comment corrected; scoring untouched. tsc passes.</done>
</task>

<task type="auto">
  <name>Task 3: bulk-result/route.ts (Fix 5 + Fix 4 + 5c) and tests (Fix 6)</name>
  <files>app/api/admin/matches/bulk-result/route.ts, tests/features/result-validation.test.ts, tests/features/deadline-format.test.ts</files>
  <action>
EDIT app/api/admin/matches/bulk-result/route.ts — apply the same validation + cascade-after-tx, with the 5c decision.

FIX 5c DECISION (planner, from reading AdminMatchesClient.tsx saveBulkResults lines 111-148):
**400 the whole batch listing offending matchNumbers in `error`.** Rationale: the consumer only reads `data.error` on
`!response.ok` (`alert(data.error || ...)`) — there is NO UI to render a per-match error array, so skip+report would be
silently dropped; a 400 with offending matchNumbers in the `error` string fits the existing response shape exactly and is
the least invasive.

Implementation:
- Import: `import { validateResultInput } from '@/lib/result-validation';`.
- BEFORE the write loop, do a validation PASS over `results`: for each entry, fetch its match
  (`prisma.match.findUnique`) and run `validateResultInput`. Collect the `matchNumber` (or matchId if the match is missing)
  of every entry that fails validation OR whose match is not found. (Reuse fetched matches in the write loop to avoid a
  double fetch if you prefer; keeping a `Map<matchId, match>` is acceptable and is not a refactor of unrelated code.)
- If any entry is invalid, return BEFORE writing anything:
  ```ts
  return NextResponse.json(
    { error: `Invalid results for match(es): ${offending.join(', ')}` },
    { status: 400 }
  );
  ```
  This replaces the current silent `continue` on bad/`undefined` scores AND the silent `actualWinnerId = winnerId ?? null`
  knockout-draw acceptance (line 50). The batch is now all-or-nothing on validation — matching the single route's strictness.
- Keep the existing per-match `$transaction` write loop and scoredUpdates computation UNCHANGED in intent.
- FIX 4 (cascade ordering): within the write loop, MOVE the cascade block (currently lines 86-91) to AFTER that match's
  `await prisma.$transaction(...)` completes. Do NOT move it inside the tx. Keep it per-match (inside the loop, after the tx).
- Fix the misleading "Run bracket cascade before the transaction for this match" comment to state it runs after the tx commits.
- The draw branch that set `actualWinnerId = winnerId ?? null` is now safe because validation already rejected
  knockout-draws-without-winner; keep computing actualWinnerId as before for the cascade.
- Do NOT change the success response shape (`{ message, totalMatchesUpdated }`).

FIX 6 — tests (Vitest, environment node, extract-logic style matching tests/features/*):

tests/features/result-validation.test.ts — import { validateResultInput } from '@/lib/result-validation':
- group match, valid integer scores -> returns null.
- homeScore null -> SCORES error; awayScore '2' (string) -> SCORES; homeScore 100 -> SCORES; homeScore 1.5 -> SCORES;
  negative -> SCORES.
- match with homeTeamId null (unresolved placeholder) -> PLACEHOLDER error.
- knockout match, winnerId = some foreign id (not home/away) -> WINNER error.
- knockout draw (2-2) with winnerId null -> KNOCKOUT_DRAW error.
- knockout draw (2-2) with winnerId = match.homeTeamId -> null (valid).
- knockout win (2-1) with no winnerId -> null (valid; winner derived from score, not required).
Use inline factory objects for `match` ({ homeTeamId, awayTeamId, stage }) per TESTING.md factory pattern.

tests/features/deadline-format.test.ts — copy the `toLocalDatetimeInput` helper used in AdminSettingsClient (or export it
from the component is NOT allowed since it's a client file; instead replicate the same pure helper in the test OR — preferred,
to keep one source — note the helper is also small enough to define inline). Test the round-trip no-op:
- Given a known UTC ISO, `toLocalDatetimeInput(iso)` produces a `YYYY-MM-DDTHH:mm` string whose
  `new Date(localString).toISOString()` equals the original ISO (to the minute). This proves the save path
  (`new Date(deadline).toISOString()`) is the inverse of initialization -> open->save->reopen is a no-op.
- Verify format with a regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$`.
(Browser-free, deterministic regardless of CI timezone because init and save use the same local interpretation.)

NOTE on the 72nd-group-result third-place fill (Fix 6 acceptance): the cascade-after-tx behavior is an ordering property of
the route, not pure logic, and the codebase has no DB-backed route tests (integration tests need a live server). Document in
the test file header comment that cascade-after-tx is covered structurally (cascade now textually follows the $transaction in
both routes, asserted by the existing knockout-cascade suite staying green) rather than via a new DB test — do NOT add a
flaky DB/integration test. Keep existing suites green and unmodified in intent.
  </action>
  <verify>
    <automated>npm test -- tests/features/result-validation.test.ts tests/features/deadline-format.test.ts</automated>
  </verify>
  <done>bulk-result validates via validateResultInput, 400s the batch with offending matchNumbers on any invalid entry (incl. knockout-draw-without-winner), runs cascade after each per-match tx; new tests pass; existing scoring/knockout suites remain green; success response shape unchanged.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes (no type regressions).
- `npm test` — new result-validation and deadline-format suites pass; existing scoring (14/14),
  knockout-cascade (17/17), knockout E2E (6/6) remain green and unmodified in intent.
  (The ~12 ECONNREFUSED:3000 integration tests are environmental, not failures.)
- Grep proof of cascade-after-tx in both routes: in result/route.ts and bulk-result/route.ts the
  `updateKnockoutBracket`/`advanceKnockoutWinner` calls appear AFTER `prisma.$transaction`.
- Both Notification call sites in InactivityMonitor.tsx are guarded with `typeof Notification`.
</verification>

<success_criteria>
- All six spec fixes implemented with smallest-possible diffs; nothing in the out-of-scope list touched.
- lib/scoring.ts single-source-of-truth preserved; no inline scoring math reintroduced; idempotency intact.
- Knockout bracket placeholder/feeder DATA untouched.
- Commits are atomic and reviewable; NOT pushed, NOT deployed.
</success_criteria>

<output>
After completion, create `.planning/quick/260610-mud-execute-pre-launch-hotfix-bundle-6-fixes/260610-mud-SUMMARY.md`.
Suggested atomic commits:
1. `fix(ui): guard Notification global + gate pre-deadline predictions + fix deadline tz init` (Task 1)
2. `fix(api): add shared result validation + move bracket cascade after tx (single route)` (Task 2)
3. `fix(api): harden bulk-result validation/cascade + add validation & deadline tests` (Task 3)
Do NOT push, do NOT deploy.
</output>
