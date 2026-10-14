import { describe, it, expect } from 'vitest';
import { validateAndSanitizePhone, sanitizePhoneForStorage } from './phoneValidation';

describe('phone validation (employee form flow)', () => {
  it('empty is allowed and stored as null', () => expect(validateAndSanitizePhone('  ')).toEqual({ valid: true, sanitized: null }));
  it('accepts danish number', () => expect(validateAndSanitizePhone(' +45 12 34 56 78 ').sanitized).toBe('+45 12 34 56 78'));
  it('rejects letters', () => expect(validateAndSanitizePhone('12ab5678').valid).toBe(false));
  it('rejects too short', () => expect(validateAndSanitizePhone('-').valid).toBe(false));
  it('storage helper returns null for invalid', () => expect(sanitizePhoneForStorage('abc')).toBeNull());
});
