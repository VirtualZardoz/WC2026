# Testing Patterns

**Analysis Date:** 2026-06-09

## Test Framework

**Runner:**
- Vitest 3.2.4
- Config: `vitest.config.ts`
- Environment: Node (not DOM/happy-dom)

**Assertion Library:**
- Vitest built-in expect API (no separate assertion library)

**Run Commands:**
```bash
npm test              # Run all tests (vitest run)
npm run test:watch   # Watch mode (vitest)
npm run test:security # Run security-specific tests (vitest run tests/security)
```

**Configuration (`vitest.config.ts`):**
```typescript
export default defineConfig({
  test: {
    globals: true,           // describe, it, expect available globally
    environment: 'node',     // Node environment
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),  // Path alias support
    },
  },
});
```

## Test File Organization

**Location:**
- Separate `tests/` directory at project root
- Co-located by concern, not by feature location

**Naming:**
- Files: `*.test.ts` pattern
- Example: `tests/features/leaderboard.test.ts`, `tests/security/password-validation.test.ts`

**Structure:**
```
tests/
├── features/              # Feature-specific logic tests
│   ├── bonus-matches.test.ts
│   ├── knockout-cascade.test.ts
│   ├── leaderboard.test.ts
│   └── signup-toggle.test.ts
├── integration/           # Integration tests
│   └── signup-toggle.integration.test.ts
└── security/             # Security-focused tests
    ├── password-validation.test.ts
    ├── rate-limit.test.ts
    └── security-headers.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Specific Aspect', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestData();

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Patterns:**

1. **Descriptive test names:** Use `it('should [description]')` format
   - Example: `it('should allow first attempt')`
   - Example: `it('should assign rank 1 to user with highest points')`

2. **Setup/Teardown:** `beforeEach()` for per-test initialization
   - Example from `rate-limit.test.ts:8-10`:
     ```typescript
     beforeEach(() => {
       resetRateLimit(testKey);
     });
     ```

3. **Assertion pattern:** Direct use of `expect()` with matcher methods
   - `expect(value).toBe(exact)`
   - `expect(array).toContain(item)`
   - `expect(value).toBeGreaterThan(min)`
   - `expect(value).toBeLessThanOrEqual(max)`
   - `expect(string).toBeNull()`
   - `expect(array).toHaveLength(n)`

## Mocking

**Framework:** Vitest `vi` utilities

**Patterns:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocking is minimal in this codebase
// Tests focus on pure functions rather than mocking
```

**What to Mock:**
- External dependencies (APIs, databases) - in integration tests
- Vitest `vi.* ` utilities available but not heavily used in current tests

**What NOT to Mock:**
- Pure utility functions: test them directly
- Data structures and calculations: use real objects
- Business logic: execute real implementation, not mocks

**Current approach:** Tests use **real implementations** and **factory functions** to create test data, avoiding heavy mocking.

## Fixtures and Factories

**Test Data Pattern:**
Factory functions create consistent test objects. Example from `leaderboard.test.ts:26-41`:

```typescript
interface LeaderboardEntry {
  id: string;
  name: string;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  bonusMatchPoints: number;
  bonusMatchExact: number;
  exactScores: number;
  correctResults: number;
  predictedCount: number;
}

function createMockEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test User',
    totalPoints: 50,
    groupPoints: 30,
    knockoutPoints: 20,
    bonusMatchPoints: 6,
    bonusMatchExact: 2,
    exactScores: 10,
    correctResults: 20,
    predictedCount: 104,
    ...overrides,
  };
}
```

**Usage pattern:**
```typescript
const entry = createMockEntry({ totalPoints: 100 });
const entries = [
  createMockEntry({ id: 'user-1', totalPoints: 100 }),
  createMockEntry({ id: 'user-2', totalPoints: 80 }),
];
```

**Location:**
- Factories defined within test files (not in separate fixtures directory)
- Inline with test suite, just before describe block

**Benefits:**
- Tests are self-contained and readable
- Overrides allow customization without boilerplate
- Type-safe through interface matching

## Coverage

**Requirements:** Not enforced (no coverage thresholds in config)

**View Coverage:**
```bash
# Config supports multiple reporters:
# vitest.config.ts includes coverage reporters: ['text', 'json', 'html']
# Run with coverage flag (if vitest supports):
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions and business logic
- Approach: Test pure functions with real objects (no mocks)
- Location: `tests/features/` and `tests/security/`
- Examples: password validation, rate limiting, leaderboard calculations, knockout logic
- Pattern: Input → Process → Assert Output

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Test actual API endpoints and database interactions
- Location: `tests/integration/`
- Example: `signup-toggle.integration.test.ts` (tests feature flag interaction with registration)
- Pattern: Full request/response cycle

**E2E Tests:**
- Not used in this project
- Puppeteer is a dependency (line 21 of `package.json`) but used for other purposes

## Common Patterns

**Async Testing:**
```typescript
// From password-validation.test.ts - synchronous test of sync function
it('should detect common passwords', () => {
  expect(isCommonPassword('password')).toBe(true);
  expect(isCommonPassword('password123')).toBe(true);
});

// Async pattern not heavily used - most tests are synchronous
// When needed: async test function with await
```

**Error Testing:**
```typescript
// From password-validation.test.ts:12-16
it('should reject passwords shorter than 8 characters', () => {
  const result = validatePassword('Short1');
  expect(result.valid).toBe(false);
  expect(result.errors).toContain('Password must be at least 8 characters');
});
```

**Loop-based Tests (multiple scenarios):**
```typescript
// From rate-limit.test.ts:20-26
it('should allow up to 5 attempts', () => {
  for (let i = 0; i < 5; i++) {
    const result = checkRateLimit(testKey);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4 - i);
  }
});
```

**State Progression Tests:**
```typescript
// From rate-limit.test.ts:28-40
it('should lock after 6th attempt', () => {
  // Use up 5 attempts
  for (let i = 0; i < 5; i++) {
    checkRateLimit(testKey);
  }

  // 6th attempt should lock
  const result = checkRateLimit(testKey);
  expect(result.allowed).toBe(false);
  expect(result.locked).toBe(true);
  expect(result.remaining).toBe(0);
  expect(result.resetIn).toBeGreaterThan(0);
});
```

**Complex Logic Testing (Knockout Cascade):**
From `knockout-cascade.test.ts`: Tests extract and verify logic from React components
```typescript
// Extracted logic from component
function resolveTeamFromPlaceholder(
  placeholder: string | null,
  match: Match,
  predictedQualifiers: PredictedQualifiers,
  // ... other params
): Team | null {
  // Logic extracted into testable function
}

// Test multiple placeholder formats
describe('Group Winner Resolution', () => {
  it('should resolve "Winner A" to group A winner', () => {
    const qualifiers: PredictedQualifiers = {
      winners: { A: createTeam('France', 'fra') },
      runnersUp: {},
      bestThirds: [],
    };
    // ...test assertion...
  });
});
```

## Test Organization Philosophy

**Key Principle:** Tests focus on **pure functions and business logic**, not on framework integration.

**Implementation Examples:**
- `leaderboard.test.ts` tests ranking and sorting logic by extracting pure functions from React components
- `knockout-cascade.test.ts` tests team resolution logic independently of component state
- `password-validation.test.ts` tests validation directly from `lib/password-validation.ts`
- `rate-limit.test.ts` tests rate limit tracking from `lib/rate-limit.ts`

**Bonus Match Calculation (tests/features/leaderboard.test.ts:196-242):**
```typescript
function calculateBonusStats(
  predictions: Prediction[],
  bonusMatchIds: Set<string>
) {
  const bonusPredictions = predictions.filter((p) =>
    bonusMatchIds.has(p.matchId)
  );
  const bonusMatchExact = bonusPredictions.filter(
    (p) => p.pointsEarned >= 3
  ).length;
  const bonusMatchPoints = bonusPredictions.reduce(
    (sum, p) => sum + p.pointsEarned,
    0
  );

  return { bonusMatchExact, bonusMatchPoints };
}

it('should calculate bonus points from bonus matches only', () => {
  const bonusMatchIds = new Set(['match-1', 'match-3']);
  const predictions = [
    { matchId: 'match-1', pointsEarned: 3 },
    { matchId: 'match-2', pointsEarned: 3 },
    { matchId: 'match-3', pointsEarned: 1 },
  ];

  const stats = calculateBonusStats(predictions, bonusMatchIds);
  expect(stats.bonusMatchPoints).toBe(4); // 3 + 1
});
```

## Test Coverage Gaps

**Not tested:**
- React component rendering (no DOM-based tests)
- NextAuth integration details
- Database schema and migrations
- API endpoint routing
- TailwindCSS styling

**Areas with tests:**
- Core business logic (validation, calculations, ranking)
- Security (password strength, rate limiting)
- Feature flags and toggles
- Complex knockout tournament logic

---

*Testing analysis: 2026-06-09*
