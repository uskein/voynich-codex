import { describe, it, expect } from 'vitest';
import { JwtService, TokenPayload } from '../infrastructure/auth/jwt.service';

describe('JwtService', () => {
  const payload: TokenPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    systemRole: 'USER'
  };

  it('should generate an access token', () => {
    const token = JwtService.generateAccessToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should generate a refresh token', () => {
    const token = JwtService.generateRefreshToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should verify an access token', () => {
    const token = JwtService.generateAccessToken(payload);
    const decoded = JwtService.verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.systemRole).toBe(payload.systemRole);
  });

  it('should verify a refresh token', () => {
    const token = JwtService.generateRefreshToken(payload);
    const decoded = JwtService.verifyRefreshToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('should reject invalid token', () => {
    expect(() => JwtService.verifyAccessToken('invalid-token')).toThrow();
  });

  it('should return a valid refresh token expiry date', () => {
    const expiry = JwtService.getRefreshTokenExpiry();
    expect(expiry).toBeInstanceOf(Date);
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});
