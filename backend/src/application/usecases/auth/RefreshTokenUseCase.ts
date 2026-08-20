import prisma from '../../../infrastructure/database/prisma/client';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { hashRefreshToken } from '../../../infrastructure/auth/token-hash.service';
import { AppError } from '../../../presentation/middlewares/errorHandler';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  async execute(refreshToken: string): Promise<RefreshResult> {
    if (!refreshToken) {
      throw new AppError(400, 'Refresh token required');
    }

    const payload = JwtService.verifyRefreshToken(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: tokenHash }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'User not found or inactive');
    }

    const newTokenPayload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole
    };

    const newAccessToken = JwtService.generateAccessToken(newTokenPayload);
    const newRefreshToken = JwtService.generateRefreshToken(newTokenPayload);

    await prisma.refreshToken.delete({ where: { token: tokenHash } });
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashRefreshToken(newRefreshToken),
        expiresAt: JwtService.getRefreshTokenExpiry()
      }
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
