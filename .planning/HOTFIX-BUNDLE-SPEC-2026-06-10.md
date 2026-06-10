# Pre-Launch Hotfix Bundle — Spec for GSD (2026-06-10)

Change-managed exception to the launch freeze, approved by Alexandre 2026-06-10 after a
4-lens read-only audit (HAL ecosystem session). App is LIVE (wc2026.sabeti.com), prediction
lock 2026-06-11. Six verified fixes. Smallest-possible diffs, no refactoring, no drive-by
cleanups. Commit atomically; do NOT push and do NOT deploy (prod deploy is a separate manual
procedure run by Alexandre).

## Fix 1 — iOS Safari crash guard (HIGH)

`components/InactivityMonitor.tsx` uses the `Notification` global unguarded at line 26
(`showWarning`: `Notification.permission === 'granted'`) and line 90 (mount `useEffect`:
`Notification.permission === 'default'` + `requestPermission()`). iOS Safari (non-PWA) does
not define `Notification`, so the mount effect throws a ReferenceError and, with no error
boundary anywhere in the app, React unmounts the whole tree — white screen for every
logged-in iPhone user. Guard both call sites with `typeof Notification !== 'undefined'`.
Do NOT add an error boundary in this bundle.

## Fix 2 — Pre-deadline prediction leak (HIGH, fairness)

`app/(main)/leaderboard/[id]/page.tsx` renders any user's full predictions (all 104 picks)
to any logged-in user with no deadline check; rows on the main leaderboard link straight to
it. Fix server-side: read the active tournament's `predictionDeadline` (same pattern as
`app/api/predictions/route.ts:68-77`) and, while `new Date() <= predictionDeadline`, do NOT
render the prediction rows for OTHER users. The page owner may still see their own
(compare `session.user.id` from `getServerSession(authOptions)` to `params.id`). Show a
short "Predictions are hidden until the deadline passes" notice instead. The stats cards
(totals/points) are all zeros pre-deadline and may stay.

## Fix 3 — Deadline form timezone bug (HIGH, ops)

`app/(main)/admin/settings/AdminSettingsClient.tsx` initializes the `datetime-local` input
with UTC wall time (`new Date(...).toISOString().slice(0, 16)`, ~line 71) but
`handleSaveDeadline` (~line 165) does `new Date(deadline).toISOString()`, which parses the
input as browser-LOCAL time. Net effect: every open→Save cycle shifts the stored deadline
EARLIER by the admin's UTC offset (2h in CEST). Fix the initialization to produce a
local-time string for the input (build `YYYY-MM-DDTHH:mm` from the date's local
components); the save path then becomes a correct local→UTC round-trip. Acceptance: open →
save → reopen is a no-op on the stored value.

## Fix 4 — Bracket cascade ordering (HIGH, bites at 72nd group result)

In `app/api/admin/matches/result/route.ts` (lines 91-96) and
`app/api/admin/matches/bulk-result/route.ts` (same pattern, ~lines 86-91),
`updateKnockoutBracket()` / `advanceKnockoutWinner()` run BEFORE the `$transaction` that
writes `realScoreHome/realScoreAway`, so the cascade always computes against the DB WITHOUT
the result being entered. Concrete failure: when the 72nd (final) group result is entered,
`updateKnockoutBracket`'s `completedGroupMatches` count reads 71 ≠ 72
(`lib/tournament.ts:106-109,144`), so the best-third R32 slots are never assigned, and the
just-entered match's effect on its group's winner/runner-up is missed. Fix: move the
cascade calls to AFTER the transaction commits, in BOTH routes. Correct the misleading
comment ("BEFORE the transaction so the match state it reads is current"). Do NOT move the
cascade inside the transaction (it uses the module-level prisma client by design).

## Fix 5 — Result input validation (both result routes)

a) Validate `homeScore`/`awayScore` are integers in 0-99 (`Number.isInteger`), explicitly
   rejecting `null` (current checks are `=== undefined` only; JSON `NaN` arrives as `null`,
   and bulk-result currently writes null scores — erasing the result while `lib/scoring.ts`
   pays draw points on null vs null).
b) When `winnerId` is provided, validate it is one of `match.homeTeamId` /
   `match.awayTeamId`, else 400.
c) `bulk-result/route.ts` (~line 50) currently accepts knockout draws with no `winnerId`
   silently (`actualWinnerId = null`, no advancement, no error) while the single route
   400s. Make bulk either skip that match and report it in the response as an error entry,
   or 400 the whole batch listing offending matchNumbers — pick whichever is less invasive
   to the existing response shape consumed by `AdminMatchesClient.tsx`.
d) Reject results for matches whose `homeTeamId` or `awayTeamId` is null (unresolved
   placeholder teams) with a clear 400.

## Fix 6 — Tests

Existing suites must stay green and unmodified in intent: scoring 14/14, knockout-cascade
17/17, knockout E2E 6/6. (The 12 ECONNREFUSED:3000 integration tests are environmental —
they need a running dev server — not failures.) Add focused tests for: the 72nd-group-result
third-place fill now working (cascade-after-tx); null/string/out-of-range score rejection;
foreign winnerId rejection; knockout-draw-without-winner handling in bulk; the deadline
round-trip no-op if testable without a browser.

## Out of scope (post-tournament backlog — do NOT touch)

Next.js upgrade (CVE-2025-29927), email PII in leaderboard payload/CSV, register rate
limiting, error boundaries, override-clobbering redesign, FIFA head-to-head tiebreakers,
dependency cleanup (puppeteer/bcrypt), cookies.txt / old-secret history scrub.
