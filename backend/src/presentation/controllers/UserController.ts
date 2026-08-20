import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

router.use(authenticate);

router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, name: true, username: true,
        avatarUrl: true, bio: true, systemRole: true, status: true,
        createdAt: true, updatedAt: true
      }
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json({ user });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional()
});

router.put('/me', async (req: Request, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: { id: true, name: true, avatarUrl: true, bio: true }
    });
    res.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireRole('GRAN_ESCRIBA', 'ARCHIVERO'), async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { email: { contains: String(search), mode: 'insensitive' as const } },
        { username: { contains: String(search), mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, username: true,
          avatarUrl: true, systemRole: true, status: true, createdAt: true
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, username: true, avatarUrl: true, bio: true,
        systemRole: true, createdAt: true
      }
    });
    if (!user) throw new AppError(404, 'User not found');
    res.json({ user });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/role', requireRole('GRAN_ESCRIBA'), async (req: Request, res: Response) => {
  try {
    const { systemRole } = req.body;
    if (!['GRAN_ESCRIBA', 'ARCHIVERO', 'CURADOR', 'USER'].includes(systemRole)) {
      throw new AppError(400, 'Invalid role');
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { systemRole },
      select: { id: true, name: true, systemRole: true }
    });
    res.json({ user });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id/status', requireRole('GRAN_ESCRIBA', 'ARCHIVERO'), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      throw new AppError(400, 'Invalid status');
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
      select: { id: true, name: true, status: true }
    });
    res.json({ user });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
