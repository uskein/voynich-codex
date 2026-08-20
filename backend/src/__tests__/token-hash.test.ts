import { describe, it, expect } from 'vitest';
import { hashRefreshToken } from '../infrastructure/auth/token-hash.service';

describe('token-hash.service', () => {
  it('should hash a refresh token consistently', () => {
    const token = 'test-refresh-token-12345';
    const hash1 = hashRefreshToken(token);
    const hash2 = hashRefreshToken(token);
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different tokens', () => {
    const hash1 = hashRefreshToken('token-1');
    const hash2 = hashRefreshToken('token-2');
    expect(hash1).not.toBe(hash2);
  });

  it('should return a hex string', () => {
    const hash = hashRefreshToken('test-token');
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });
});
