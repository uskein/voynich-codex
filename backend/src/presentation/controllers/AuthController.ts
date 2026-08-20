import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { RegisterUseCase, LoginUseCase, RefreshTokenUseCase } from '../../application/usecases/auth';
import { hashRefreshToken } from '../../infrastructure/auth/token-hash.service';

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

const registerUseCase = new RegisterUseCase();
const loginUseCase = new LoginUseCase();
const refreshTokenUseCase = new RefreshTokenUseCase();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUseCase.execute(data);
    res.status(201).json(result);
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
    const result = await loginUseCase.execute(data);
    res.json(result);
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
    const result = await refreshTokenUseCase.execute(refreshToken);
    res.json(result);
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
        id: true, email: true, name: true, username: true,
        avatarUrl: true, bio: true, systemRole: true, status: true, createdAt: true
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
