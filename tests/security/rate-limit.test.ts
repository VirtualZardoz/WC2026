import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, resetRateLimit } from '../../lib/rate-limit';

describe('Rate Limiting', () => {
  const testKey = 'test:user@example.com';

  beforeEach(() => {
    // Reset the rate limit for our test key before each test
    resetRateLimit(testKey);
  });

  describe('checkRateLimit', () => {
    it('should allow first attempt', () => {
      const result = checkRateLimit(testKey);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 5 max - 1 used
      expect(result.locked).toBe(false);
    });

    it('should allow up to 5 attempts', () => {
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(testKey);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

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

    it('should return lockout time remaining', () => {
      // Trigger lockout
      for (let i = 0; i < 6; i++) {
        checkRateLimit(testKey);
      }

      const result = checkRateLimit(testKey);
      expect(result.locked).toBe(true);
      // Should be approximately 15 minutes (900 seconds)
      expect(result.resetIn).toBeGreaterThan(800);
      expect(result.resetIn).toBeLessThanOrEqual(900);
    });

    it('should track different identifiers separately', () => {
      const key1 = 'test:user1@example.com';
      const key2 = 'test:user2@example.com';

      // Lock out key1
      for (let i = 0; i < 6; i++) {
        checkRateLimit(key1);
      }

      // key2 should still be allowed
      const result = checkRateLimit(key2);
      expect(result.allowed).toBe(true);

      // Clean up
      resetRateLimit(key1);
      resetRateLimit(key2);
    });
  });

  describe('resetRateLimit', () => {
    it('should reset attempts after successful login', () => {
      // Use up some attempts
      for (let i = 0; i < 3; i++) {
        checkRateLimit(testKey);
      }

      // Reset (simulating successful login)
      resetRateLimit(testKey);

      // Should have full attempts again
      const result = checkRateLimit(testKey);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should clear lockout', () => {
      // Trigger lockout
      for (let i = 0; i < 6; i++) {
        checkRateLimit(testKey);
      }

      expect(checkRateLimit(testKey).locked).toBe(true);

      // Reset clears lockout
      resetRateLimit(testKey);

      const result = checkRateLimit(testKey);
      expect(result.allowed).toBe(true);
      expect(result.locked).toBe(false);
    });
  });
});
