/**
 * Signup Toggle Feature - Integration Tests
 *
 * These tests require a RUNNING SERVER at localhost:3000.
 * They test the actual HTTP API endpoints.
 *
 * Run locally with: npm run dev (in one terminal) + npm test (in another)
 * These are excluded from CI by default.
 *
 * For unit tests (no server required), see:
 * tests/features/signup-toggle.test.ts
 */

import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('Signup Toggle Feature - Integration Tests', () => {
  describe('Admin Settings API (/api/admin/settings/signup)', () => {
    it('GET should redirect unauthenticated requests (307)', async () => {
      // Middleware redirects to login for browser-friendly behavior
      const response = await fetch(`${BASE_URL}/api/admin/settings/signup`, {
        redirect: 'manual', // Don't follow redirects
      });
      expect(response.status).toBe(307);
    });

    it('POST should redirect unauthenticated requests (307)', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/settings/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
        redirect: 'manual',
      });
      expect(response.status).toBe(307);
    });

    // Note: Testing authenticated admin requests requires session mocking
    // which should be implemented as part of the feature
  });

  describe('Registration API (/api/register) - Signup Disabled', () => {
    it('should return 403 when signup is disabled', async () => {
      // First, disable signup via the feature-flags library
      const { setRegistrationEnabled } = await import('../../lib/feature-flags');
      await setRegistrationEnabled(false);

      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test-disabled@example.com',
          password: 'SecurePass123',
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('disabled');

      // Cleanup: re-enable signup
      await setRegistrationEnabled(true);
    });

    it('should allow registration when signup is enabled', async () => {
      const { setRegistrationEnabled } = await import('../../lib/feature-flags');
      await setRegistrationEnabled(true);

      // Note: This test would need cleanup to delete the user after
      // For now, using a unique email to avoid conflicts
      const uniqueEmail = `test-enabled-${Date.now()}@example.com`;

      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: uniqueEmail,
          password: 'SecurePass123',
        }),
      });

      // Should succeed (201) or fail for other reasons (400/409) but NOT 403
      expect(response.status).not.toBe(403);
    });
  });

  describe('API Route Existence', () => {
    it('API route /api/admin/settings/signup should exist', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/settings/signup`);
      // Should return redirect (307) or success, not 404 (not found)
      expect(response.status).not.toBe(404);
    });
  });
});
