import prisma from '../../../infrastructure/database/prisma/client';
import { BcryptService } from '../../../infrastructure/auth/bcrypt.service';
import { JwtService, TokenPayload } from '../../../infrastructure/auth/jwt.service';
import { hashRefreshToken } from '../../../infrastructure/auth/token-hash.service';
import { AppError } from '../../../presentation/middlewares/errorHandler';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  username?: string;
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

export class RegisterUseCase {
  async execute(input: RegisterInput): Promise<AuthResult> {
    const username = input.username ||
      input.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substring(2, 6);

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username }] }
    });

    if (existingUser) {
      throw new AppError(409, existingUser.email === input.email ? 'Email already registered' : 'Username already taken');
    }

    const hashedPassword = await BcryptService.hash(input.password);

    const user = await prisma.user.create({
      data: { email: input.email, password: hashedPassword, name: input.name, username }
    });

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
      user: { id: user.id, email: user.email, name: user.name, username: user.username, systemRole: user.systemRole },
      accessToken,
      refreshToken
    };
  }
}
