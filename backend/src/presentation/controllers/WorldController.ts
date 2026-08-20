import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { deleteVectorsByWorld } from '../../infrastructure/vector/qdrant.service';

const router = Router();
router.use(authenticate);

const createWorldSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional()
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createWorldSchema.parse(req.body);
    const world = await prisma.world.create({
      data: {
        ...data,
        createdBy: req.user!.userId,
        members: {
          create: {
            userId: req.user!.userId,
            role: 'OWNER'
          }
        }
      },
      include: { members: true }
    });
    res.status(201).json({ world });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const worlds = await prisma.world.findMany({
      where: {
        members: { some: { userId: req.user!.userId } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        _count: { select: { manuscripts: true, characters: true, bestiary: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ worlds });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: {
        worldId_userId: {
          worldId: req.params.id,
          userId: req.user!.userId
        }
      }
    });

    if (!membership) throw new AppError(403, 'Access denied');

    const world = await prisma.world.findUnique({
      where: { id: req.params.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true, systemRole: true } } } },
        stats: true,
        _count: {
          select: {
            manuscripts: true, characters: true, bestiary: true,
            events: true, nations: true, magicSystems: true, members: true,
            heraldry: true
          }
        }
      }
    });

    if (!world) throw new AppError(404, 'World not found');
    res.json({ world, membership });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const updateWorldSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImage: z.string().url().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional()
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const data = updateWorldSchema.parse(req.body);
    const world = await prisma.world.update({
      where: { id: req.params.id },
      data
    });
    res.json({ world });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || membership.role !== 'OWNER') {
      throw new AppError(403, 'Only the owner can delete a world');
    }

    await deleteVectorsByWorld(req.params.id);
    await prisma.world.delete({ where: { id: req.params.id } });

    res.json({ message: 'World deleted successfully' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const { password } = req.body;
    const shareToken = crypto.randomUUID();
    const sharePassword = password ? await bcrypt.hash(password, 12) : null;

    const world = await prisma.world.update({
      where: { id: req.params.id },
      data: { shareToken, sharePassword, visibility: 'UNLISTED' }
    });

    res.json({ shareToken: world.shareToken, hasPassword: !!sharePassword });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/share', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    await prisma.world.update({
      where: { id: req.params.id },
      data: { shareToken: null, sharePassword: null }
    });

    res.json({ message: 'Share access revoked' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const { userId, role = 'VIEWER' } = req.body;
    if (!userId) throw new AppError(400, 'userId required');

    const member = await prisma.worldMember.upsert({
      where: { worldId_userId: { worldId: req.params.id, userId } },
      update: { role },
      create: { worldId: req.params.id, userId, role }
    });

    res.json({ member });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    await prisma.worldMember.delete({
      where: { worldId_userId: { worldId: req.params.id, userId: req.params.userId } }
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/members', async (req: Request, res: Response) => {
  try {
    const members = await prisma.worldMember.findMany({
      where: { worldId: req.params.id },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true, systemRole: true } } }
    });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/export', async (req: Request, res: Response) => {
  try {
    const world = await prisma.world.findUnique({
      where: { id: req.params.id },
      include: {
        bestiary: true, characters: true, events: true,
        continents: true, seas: true, regions: true,
        nations: true, magicSystems: true, maps: true
      }
    });

    if (!world) throw new AppError(404, 'World not found');

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      world: {
        name: world.name,
        description: world.description,
        coverImage: world.coverImage
      },
      bestiary: world.bestiary,
      characters: world.characters,
      events: world.events,
      continents: world.continents,
      seas: world.seas,
      regions: world.regions,
      nations: world.nations,
      magicSystems: world.magicSystems,
      maps: world.maps
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${world.name.replace(/[^a-z0-9]/gi, '_')}_export.json"`);
    res.json(exportData);
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
