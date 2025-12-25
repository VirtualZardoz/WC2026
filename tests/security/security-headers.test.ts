import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

describe('Security Headers', () => {
  it('should include X-Frame-Options header', async () => {
    const response = await fetch(BASE_URL);
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
  });

  it('should include X-Content-Type-Options header', async () => {
    const response = await fetch(BASE_URL);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('should include X-XSS-Protection header', async () => {
    const response = await fetch(BASE_URL);
    expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
  });

  it('should include Referrer-Policy header', async () => {
    const response = await fetch(BASE_URL);
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });

  it('should include Permissions-Policy header', async () => {
    const response = await fetch(BASE_URL);
    const policy = response.headers.get('permissions-policy');
    expect(policy).toContain('camera=()');
    expect(policy).toContain('microphone=()');
    expect(policy).toContain('geolocation=()');
  });

  it('should include Content-Security-Policy header', async () => {
    const response = await fetch(BASE_URL);
    const csp = response.headers.get('content-security-policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
  });

  it('should include X-DNS-Prefetch-Control header', async () => {
    const response = await fetch(BASE_URL);
    expect(response.headers.get('x-dns-prefetch-control')).toBe('on');
  });
});
