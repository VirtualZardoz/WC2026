# Coding Conventions

**Analysis Date:** 2026-06-09

## Naming Patterns

**Files:**
- Component files: PascalCase (e.g., `AuthHeader.tsx`, `MatchCard.tsx`)
- Utility/library files: camelCase (e.g., `password-validation.ts`, `rate-limit.ts`, `auth.ts`)
- API route files: use Next.js convention with `route.ts` and descriptive directory structure (e.g., `/api/predictions/route.ts`, `/api/admin/matches/result/route.ts`)

**Functions:**
- Regular functions: camelCase (e.g., `validatePassword`, `checkRateLimit`, `calculateGroupStandings`)
- React components: PascalCase as default exports (e.g., `export default function MatchCard()`)
- Async functions: camelCase regardless of type (e.g., `async function isRegistrationEnabled()`)

**Variables:**
- Local variables: camelCase (e.g., `homeScore`, `awayTeam`, `isLocked`)
- State variables (React): camelCase with semantic prefixes (e.g., `saving`, `saved`, `error`, `isDraw`)
- Constants: UPPER_SNAKE_CASE (e.g., `MIN_LENGTH`, `FEATURE_FLAGS`, `COMMON_PASSWORDS`)
- Type/interface names: PascalCase (e.g., `Team`, `Prediction`, `Match`, `MatchCardProps`)

**Types:**
- Interfaces: PascalCase, suffixed with `Props` for component props (e.g., `MatchCardProps`, `LeaderboardEntry`)
- Type aliases: PascalCase (e.g., `SortField`)
- Generic interfaces match React conventions: `interface Component<T> {}`

## Code Style

**Formatting:**
- No Prettier config file detected. ESLint is configured with Next.js core-web-vitals preset
- Indentation: 2 spaces (inferred from source code)
- Line length: No strict limit observed, but code avoids excessive horizontal scrolling
- String quotes: Single quotes for imports and most strings, backticks for template strings

**Linting:**
- Tool: ESLint with `eslint-config-next` (14.2.15)
- Config file: `.eslintrc.json`
- Extends: `next/core-web-vitals`
- Run: `npm run lint`

## Import Organization

**Order:**
1. External packages (e.g., `import { NextRequest, NextResponse } from 'next/server'`)
2. Next.js/React libraries (e.g., `import { useState } from 'react'`)
3. NextAuth imports (e.g., `import { getServerSession } from 'next-auth'`)
4. Local imports with `@/` alias (e.g., `import prisma from '@/lib/prisma'`)
5. No blank lines between groups typically observed

**Path Aliases:**
- `@/*` resolves to project root
- All local imports use the `@/` prefix (e.g., `@/lib/auth`, `@/components/ThemeProvider`, `@/lib/prisma`)

**Example pattern from `app/api/register/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { validatePassword, isCommonPassword } from '@/lib/password-validation';
import { isRegistrationEnabled } from '@/lib/feature-flags';
```

## Error Handling

**Pattern - API Routes:**
- Try-catch wrapper around all async operations
- Explicit error logging: `console.error('Context:', error)`
- Generic user-facing errors: `{ error: 'Internal server error' }` with 500 status
- Validation errors: Return 400 status with specific error message
- Authorization errors: Return 401/403 status
- Not found errors: Return 404 status
- See `app/api/register/route.ts`, `app/api/predictions/route.ts` for examples

**Pattern - Components:**
- Local error state: `const [error, setError] = useState('')`
- Client-side validation before async operations
- Error display in UI with error state (e.g., `MatchCard.tsx` lines 362-365)
- Clear error messages on form submissions (e.g., "Please enter both scores")

**Example from `MatchCard.tsx` (lines 103-167):**
```typescript
const handleSave = async () => {
  if (isLocked) return;

  // Input validation
  const homeVal = homeScore.trim();
  const awayVal = awayScore.trim();

  if (homeVal === '' || awayVal === '') {
    setError('Please enter both scores');
    return;
  }

  // ... more validation ...

  try {
    const response = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ /* ... */ }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || 'Failed to save prediction');
      return;
    }
    // success handling
  } catch (err) {
    setError('An unexpected error occurred');
  } finally {
    setSaving(false);
  }
};
```

## Logging

**Framework:** `console` (no dedicated logging library observed)

**Patterns:**
- `console.error('Context: description', error)` for error logging in server functions
- Context-prefixed messages (e.g., `console.error('Registration error:', error)`)
- Errors logged in API route catch blocks before sending response
- No verbose logging observed in success paths

**Examples:**
- `console/error('Registration error:', error)` in `app/api/register/route.ts:83`
- `console.error('Error fetching predictions:', error)` in `app/api/predictions/route.ts:28`
- `console.error('Error saving match result:', error)` in `app/api/admin/matches/result/route.ts:138`

## Comments

**When to Comment:**
- JSDoc for public functions and exported utilities
- Inline comments for complex logic (e.g., rating calculations, knockout advancement logic)
- No comments for obvious code
- Comment section headers for major code blocks (e.g., "Rate limiting by email", "Calculate points and goals")

**JSDoc Pattern:**
- Single-line JSDoc summary before exported functions
- See `lib/tournament.ts` for examples:
  ```typescript
  /**
   * Calculates standings for a group based on match results
   */
  export async function calculateGroupStandings(group: string) { ... }

  /**
   * Updates knockout bracket based on group results
   */
  export async function updateKnockoutBracket() { ... }
  ```

**Password validation header:** See `lib/password-validation.ts:1-3`:
```typescript
/**
 * Password strength validation
 */
```

## Function Design

**Size:** 
- Most functions 20-50 lines
- Complex functions like `advanceKnockoutWinner` (~40 lines) and `updateKnockoutBracket` (~80 lines) may be longer for domain-specific logic
- Component functions can be longer due to JSX

**Parameters:**
- Destructured props in components: `function MatchCard({ match, isLocked, onSaved, ... })`
- Function parameters: typically 2-5 parameters
- Complex types passed as single interface (e.g., `match: Match` instead of individual properties)
- Optional parameters marked with `?` in types and given default values (e.g., `isKnockout = false`)

**Return Values:**
- Functions return typed values (e.g., `function validatePassword(...): PasswordValidationResult`)
- Components: return JSX elements
- API routes: return `NextResponse` with typed JSON payloads
- Promise-based: async functions return `Promise<Type>`
- Example from `password-validation.ts:18-64`:
  ```typescript
  export function validatePassword(password: string): PasswordValidationResult {
    // ... implementation ...
    return {
      valid: errors.length === 0,
      errors,
      strength,
    };
  }
  ```

## Module Design

**Exports:**
- Named exports for utilities: `export function validatePassword(...)`, `export interface PasswordValidationResult`
- Default export for React components: `export default function MatchCard(...)`
- Constants exported as named: `export const FEATURE_FLAGS = { ... }`

**Barrel Files:**
- Not observed in codebase

**Example pattern - Utility module (`lib/password-validation.ts`):**
```typescript
export interface PasswordValidationResult { ... }
export function validatePassword(password: string): PasswordValidationResult { ... }
export function isCommonPassword(password: string): boolean { ... }
```

**Example pattern - Component:**
```typescript
export default function AuthHeader() { ... }
```

**Example pattern - API route:**
```typescript
export async function POST(request: NextRequest) { ... }
export async function GET(request: NextRequest) { ... }
```

## Type Safety

- Strict TypeScript: `"strict": true` in `tsconfig.json`
- All function parameters and returns are typed
- Module augmentation used for NextAuth type extensions (see `lib/auth.ts:88-111`)
- Interface-based props in components
- No `any` types observed in main codebase

---

*Convention analysis: 2026-06-09*
