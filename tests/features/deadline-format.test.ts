/**
 * Deadline Format Tests
 *
 * Verifies the deadline round-trip no-op: the toLocalDatetimeInput helper
 * (used in AdminSettingsClient.tsx to initialize the datetime-local input)
 * produces a local YYYY-MM-DDTHH:mm string such that
 *   new Date(localString).toISOString() === originalISO (to the minute).
 *
 * This proves that handleSaveDeadline's new Date(deadline).toISOString()
 * is the exact inverse of the initialization — open -> save -> reopen is a no-op.
 *
 * Browser-free and deterministic: init and save both use the same local
 * interpretation of the string, so CI timezone does not affect the outcome.
 */

import { describe, it, expect } from 'vitest';

// Replicate the pure helper from AdminSettingsClient.tsx (not exported from
// the client component file; small enough to define inline here).
function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

describe('toLocalDatetimeInput', () => {
  it('produces a YYYY-MM-DDTHH:mm format string', () => {
    const iso = '2026-06-11T06:00:00.000Z';
    const result = toLocalDatetimeInput(iso);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('round-trip: new Date(localString).toISOString() equals original ISO to the minute', () => {
    // Use an ISO time truncated to the minute as the source of truth.
    const isoMinutePrecision = '2026-06-11T06:00:00.000Z';
    // Strip subsecond precision for comparison (toISOString always emits .000Z
    // when the input has no sub-second component, but be explicit).
    const expectedIso = new Date(isoMinutePrecision).toISOString();

    const localString = toLocalDatetimeInput(isoMinutePrecision);
    // Simulate what handleSaveDeadline does: new Date(deadline).toISOString()
    const roundTripIso = new Date(localString).toISOString();

    expect(roundTripIso).toBe(expectedIso);
  });

  it('round-trip holds for a non-UTC-midnight time', () => {
    // Pick a time that would differ if UTC wall clock were used vs local
    const isoMinutePrecision = '2026-06-10T14:30:00.000Z';
    const expectedIso = new Date(isoMinutePrecision).toISOString();

    const localString = toLocalDatetimeInput(isoMinutePrecision);
    const roundTripIso = new Date(localString).toISOString();

    expect(roundTripIso).toBe(expectedIso);
  });
});
