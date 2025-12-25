# HAL9000 Task: Implement Signup Toggle Feature

## Objective
Implement the admin signup toggle feature that allows admins to enable/disable user registration.

## Requirements
Read the full spec at: `docs/FEATURE-SPEC-signup-toggle.md`

## Success Criteria
All tests in `tests/features/signup-toggle.test.ts` must pass.
Currently: 12 failing, 1 passing.

Run tests with:
```bash
npm run test -- tests/features/signup-toggle.test.ts
```

## Implementation Steps

### 1. Add Prisma Model
Add to `prisma/schema.prisma`:
```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Boolean  @default(true)
  updatedAt DateTime @updatedAt
}
```

Then run:
```bash
npx prisma db push
```

### 2. Create Feature Flags Library
Create `lib/feature-flags.ts` with:
- `isSignupEnabled(): Promise<boolean>` - returns current signup setting
- `setSignupEnabled(enabled: boolean): Promise<void>` - updates setting

### 3. Create Admin API Route
Create `app/api/admin/settings/signup/route.ts`:
- GET: Return `{ signupEnabled: boolean }`
- PUT: Accept `{ enabled: boolean }`, update setting, return new value
- Require admin role (403 if not admin, 401 if not authenticated)

### 4. Modify Registration API
Update `app/api/register/route.ts`:
- At the start, check `isSignupEnabled()`
- If false, return 403 with `{ error: "Registration is currently disabled" }`

### 5. Update Admin Settings UI
Add toggle to `app/(main)/admin/settings/AdminSettingsClient.tsx`:
- Show current signup status
- Toggle switch to enable/disable
- Call PUT /api/admin/settings/signup on toggle

## Reference Implementation
See: `/home/sardar/SynologyDrive/HAL/jobforge-standalone/frontend/lib/feature-flags.ts`

## Notes
- Default signup to ENABLED (true) when setting doesn't exist
- Handle database errors gracefully
- Use upsert pattern for creating/updating settings
