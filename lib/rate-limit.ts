/**
 * Simple in-memory rate limiter for login attempts
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const MAX_ATTEMPTS = 5;           // Max attempts before lockout
const WINDOW_MS = 15 * 60 * 1000; // 15 minute window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minute lockout

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (now - entry.firstAttempt > WINDOW_MS && !entry.lockedUntil) {
      rateLimitStore.delete(key);
    }
    if (entry.lockedUntil && now > entry.lockedUntil) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
  locked: boolean;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Check if currently locked out
  if (entry?.lockedUntil) {
    if (now < entry.lockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((entry.lockedUntil - now) / 1000),
        locked: true,
      };
    }
    // Lockout expired, clear entry
    rateLimitStore.delete(identifier);
  }

  // No entry or expired window - first attempt
  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    rateLimitStore.set(identifier, { count: 1, firstAttempt: now });
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      resetIn: Math.ceil(WINDOW_MS / 1000),
      locked: false,
    };
  }

  // Within window - increment count
  entry.count++;

  if (entry.count > MAX_ATTEMPTS) {
    // Lock out the user
    entry.lockedUntil = now + LOCKOUT_MS;
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil(LOCKOUT_MS / 1000),
      locked: true,
    };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetIn: Math.ceil((entry.firstAttempt + WINDOW_MS - now) / 1000),
    locked: false,
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}
