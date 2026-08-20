import { describe, it, expect } from 'vitest';
import { BcryptService } from '../infrastructure/auth/bcrypt.service';

describe('BcryptService', () => {
  it('should hash a password', async () => {
    const password = 'testPassword123';
    const hash = await BcryptService.hash(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  it('should verify a password against its hash', async () => {
    const password = 'testPassword123';
    const hash = await BcryptService.hash(password);
    const isValid = await BcryptService.compare(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const password = 'testPassword123';
    const hash = await BcryptService.hash(password);
    const isValid = await BcryptService.compare('wrongPassword', hash);
    expect(isValid).toBe(false);
  });
});
