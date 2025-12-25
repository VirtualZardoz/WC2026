import { describe, it, expect } from 'vitest';
import { validatePassword, isCommonPassword } from '../../lib/password-validation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('lowercase1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should accept valid passwords', () => {
      const result = validatePassword('ValidPass1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should rate password strength correctly', () => {
      expect(validatePassword('weak').strength).toBe('weak');
      expect(validatePassword('Medium1a').strength).toBe('medium');
      expect(validatePassword('Strong1Pass!').strength).toBe('strong');
    });
  });

  describe('isCommonPassword', () => {
    it('should detect common passwords', () => {
      expect(isCommonPassword('password')).toBe(true);
      expect(isCommonPassword('password123')).toBe(true);
      expect(isCommonPassword('12345678')).toBe(true);
      expect(isCommonPassword('qwerty')).toBe(true);
      expect(isCommonPassword('admin')).toBe(true);
    });

    it('should not flag unique passwords', () => {
      expect(isCommonPassword('xK9mPq2Zr')).toBe(false);
      expect(isCommonPassword('MyUniquePass123')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isCommonPassword('PASSWORD')).toBe(true);
      expect(isCommonPassword('Password')).toBe(true);
      expect(isCommonPassword('QWERTY')).toBe(true);
    });
  });
});
