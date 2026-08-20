import prisma from '../../../infrastructure/database/prisma/client';
import { BcryptService } from '../../../infrastructure/auth/bcrypt.service';
import { JwtService, TokenPayload } from '../../../infrastructure/auth/jwt.service';
import { hashRefreshToken } from '../../../infrastructure/auth/token-hash.service';
import { AppError } from '../../../presentation/middlewares/errorHandler';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    username: string | null;
    systemRole: string;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  async execute(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Account is not active');
    }

    const isPasswordValid = await BcryptService.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole
    };

    const accessToken = JwtService.generateAccessToken(tokenPayload);
    const refreshToken = JwtService.generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashRefreshToken(refreshToken),
        expiresAt: JwtService.getRefreshTokenExpiry()
      }
    });

    return {
      user: {
        id: user.id, email: user.email, name: user.name,
        username: user.username, systemRole: user.systemRole, avatarUrl: user.avatarUrl
      },
      accessToken,
      refreshToken
    };
  }
}
