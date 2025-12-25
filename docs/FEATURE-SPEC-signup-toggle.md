# Feature Spec: Admin Signup Toggle

## Overview
Admin users should be able to enable/disable the user registration (signup) functionality from the admin settings panel.

## User Story
As an admin, I want to toggle user signups on/off so that I can control when new users can register for the World Cup predictions app.

## Requirements

### 1. Database Schema
Add a `SystemSetting` model to store feature flags:

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Boolean  @default(true)
  updatedAt DateTime @updatedAt
}
```

Create initial migration with `SIGNUP_ENABLED` set to `true` by default.

### 2. Feature Flag Library
Create `lib/feature-flags.ts` with:

```typescript
// Functions needed:
export async function isSignupEnabled(): Promise<boolean>
export async function setSignupEnabled(enabled: boolean): Promise<void>
```

- Default to `true` if setting doesn't exist in DB
- Handle database errors gracefully (return default)

### 3. Admin API Endpoint
Create `app/api/admin/settings/signup/route.ts`:

**GET** - Returns current signup status
```json
{ "signupEnabled": true }
```

**PUT** - Toggle signup (requires admin role)
```json
// Request: { "enabled": false }
// Response: { "success": true, "signupEnabled": false }
```

- Return 401 if not authenticated
- Return 403 if not admin role

### 4. Registration API Check
Modify `app/api/register/route.ts`:
- Check `isSignupEnabled()` at the start
- If disabled, return 403: `{ "error": "Registration is currently disabled" }`

### 5. Admin Settings UI
Add to existing admin settings page (`app/(main)/admin/settings/`):
- Toggle switch for "User Registration"
- Show current status (Enabled/Disabled)
- Confirmation when changing status

### 6. Registration Page Check
Modify registration page to:
- Check if signup is enabled on load
- If disabled, show message: "Registration is currently closed"
- Hide/disable the registration form

## Test Cases

### Unit Tests (lib/feature-flags)
1. `isSignupEnabled` returns true when setting exists and is true
2. `isSignupEnabled` returns false when setting exists and is false
3. `isSignupEnabled` returns true (default) when setting doesn't exist
4. `setSignupEnabled` creates setting if it doesn't exist
5. `setSignupEnabled` updates existing setting

### API Tests
1. GET /api/admin/settings/signup returns 401 for unauthenticated users
2. GET /api/admin/settings/signup returns 403 for non-admin users
3. GET /api/admin/settings/signup returns current status for admin
4. PUT /api/admin/settings/signup returns 401 for unauthenticated users
5. PUT /api/admin/settings/signup returns 403 for non-admin users
6. PUT /api/admin/settings/signup toggles setting for admin
7. POST /api/register returns 403 when signup is disabled
8. POST /api/register works normally when signup is enabled

## Reference Implementation
See `jobforge-standalone/frontend/lib/feature-flags.ts` for a similar pattern using Supabase.

## Acceptance Criteria
- [ ] Admin can see current signup status in settings
- [ ] Admin can toggle signup on/off
- [ ] Users see "registration closed" message when disabled
- [ ] Registration API rejects requests when disabled
- [ ] All tests pass
