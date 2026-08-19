import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { BcryptService } from '../../infrastructure/auth/bcrypt.service';
import { JwtService } from '../../infrastructure/auth/jwt.service';
import { hashRefreshToken } from '../../infrastructure/auth/token-hash.service';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  username: z.string().min(3).max(30).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    // Auto-generate username if not provided
    const username = data.username || data.name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substring(2, 6);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new AppError(409, existingUser.email === data.email ? 'Email already registered' : 'Username already taken');
    }

    const hashedPassword = await BcryptService.hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        username
      }
    });

    const tokenPayload = {
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

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        systemRole: user.systemRole
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'Account is not active');
    }

    const isPasswordValid = await BcryptService.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const tokenPayload = {
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

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        systemRole: user.systemRole,
        avatarUrl: user.avatarUrl
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

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

    await prisma.refreshToken.delete({
      where: { token: tokenHash }
    });

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashRefreshToken(newRefreshToken),
        expiresAt: JwtService.getRefreshTokenExpiry()
      }
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          userId: req.user!.userId,
          token: hashRefreshToken(refreshToken)
        }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        bio: true,
        systemRole: true,
        status: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ user });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
