import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../../index';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

const createManuscriptSchema = z.object({
  worldId: z.string().uuid(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  coverImage: z.string().url().optional(),
  synopsis: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional(),
  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional()
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const data = createManuscriptSchema.parse(req.body);

    const membership = await prisma.worldMember.findUnique({
      where: { worldId_userId: { worldId: data.worldId, userId: req.user!.userId } }
    });
    if (!membership) throw new AppError(403, 'Access denied to this world');

    const manuscript = await prisma.manuscript.create({
      data: {
        ...data,
        createdBy: req.user!.userId,
        members: {
          create: {
            userId: req.user!.userId,
            role: 'ESCRITOR'
          }
        }
      },
      include: { world: { select: { id: true, name: true } } }
    });

    res.status(201).json({ manuscript });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { worldId } = req.query;
    const where: any = {
      members: { some: { userId: req.user!.userId } }
    };
    if (worldId) where.worldId = String(worldId);

    const manuscripts = await prisma.manuscript.findMany({
      where,
      include: {
        world: { select: { id: true, name: true } },
        _count: { select: { chapters: true, members: true, tasks: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ manuscripts });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/public', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', genre, status, sort = 'newest' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { visibility: 'PUBLIC' };
    if (genre) where.genre = String(genre);
    if (status) where.status = String(status);

    const orderBy: any = sort === 'popular' ? { viewCount: 'desc' }
      : sort === 'words' ? { wordCount: 'desc' }
      : { publishedAt: 'desc' };

    const [manuscripts, total] = await Promise.all([
      prisma.manuscript.findMany({
        where,
        select: {
          id: true, title: true, subtitle: true, author: true, genre: true,
          coverImage: true, synopsis: true, wordCount: true, readTimeMinutes: true,
          viewCount: true, rating: true, publishedAt: true, publishedChapters: true,
          world: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { chapters: true, members: true } }
        },
        skip,
        take: Number(limit),
        orderBy
      }),
      prisma.manuscript.count({ where })
    ]);

    res.json({
      manuscripts,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const manuscript = await prisma.manuscript.findUnique({
      where: { id: req.params.id },
      include: {
        world: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
        chapters: {
          select: { id: true, title: true, content: true, order: true, isPublished: true },
          orderBy: { order: 'asc' }
        },
        _count: { select: { chapters: true, tasks: true, milestones: true } }
      }
    });

    if (!manuscript) throw new AppError(404, 'Manuscript not found');

    const membership = await prisma.manuscriptMember.findUnique({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId: req.user!.userId } }
    });

    if (!membership && manuscript.visibility !== 'PUBLIC') {
      throw new AppError(403, 'Access denied to this manuscript');
    }

    res.json({ manuscript, membership });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

const updateManuscriptSchema = z.object({
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  coverImage: z.string().url().optional(),
  synopsis: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC', 'UNLISTED']).optional(),
  status: z.enum(['BORRADOR', 'EN_REVISION', 'PUBLICADO', 'ARCHIVADO']).optional(),
  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional()
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.manuscriptMember.findUnique({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['ESCRITOR', 'EDITOR_TEXTO', 'PUBLICADOR'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const data = updateManuscriptSchema.parse(req.body);
    const manuscript = await prisma.manuscript.update({
      where: { id: req.params.id },
      data
    });

    res.json({ manuscript });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/share', authenticate, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.manuscriptMember.findUnique({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['ESCRITOR', 'PUBLICADOR'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const { password } = req.body;
    const shareToken = crypto.randomUUID();
    const sharePassword = password ? await bcrypt.hash(password, 12) : null;

    const manuscript = await prisma.manuscript.update({
      where: { id: req.params.id },
      data: { shareToken, sharePassword, visibility: 'UNLISTED' }
    });

    res.json({ shareToken: manuscript.shareToken, hasPassword: !!sharePassword });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/share', authenticate, async (req: Request, res: Response) => {
  try {
    await prisma.manuscript.update({
      where: { id: req.params.id },
      data: { shareToken: null, sharePassword: null }
    });
    res.json({ message: 'Share access revoked' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/team', authenticate, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.manuscriptMember.findUnique({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['ESCRITOR', 'PUBLICADOR'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const { userId, role } = req.body;
    if (!userId || !role) throw new AppError(400, 'userId and role required');

    const member = await prisma.manuscriptMember.upsert({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId } },
      update: { role },
      create: { manuscriptId: req.params.id, userId, role }
    });

    res.json({ member });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/team', authenticate, async (req: Request, res: Response) => {
  try {
    const members = await prisma.manuscriptMember.findMany({
      where: { manuscriptId: req.params.id },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } }
    });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/members', authenticate, async (req: Request, res: Response) => {
  try {
    const membership = await prisma.manuscriptMember.findUnique({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId: req.user!.userId } }
    });
    if (!membership || !['ESCRITOR', 'PUBLICADOR'].includes(membership.role)) {
      throw new AppError(403, 'Insufficient permissions');
    }

    const { userId, role } = req.body;
    if (!userId || !role) throw new AppError(400, 'userId and role required');

    const member = await prisma.manuscriptMember.upsert({
      where: { manuscriptId_userId: { manuscriptId: req.params.id, userId } },
      update: { role },
      create: { manuscriptId: req.params.id, userId, role }
    });

    res.json({ member });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/members', authenticate, async (req: Request, res: Response) => {
  try {
    const members = await prisma.manuscriptMember.findMany({
      where: { manuscriptId: req.params.id },
      include: { user: { select: { id: true, name: true, username: true, avatarUrl: true } } }
    });
    res.json({ members });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/publication-status', authenticate, async (req: Request, res: Response) => {
  try {
    const chapters = await prisma.chapter.findMany({
      where: { manuscriptId: req.params.id },
      select: {
        id: true, number: true, title: true, wordCount: true,
        status: true, isPublished: true, publishedAt: true, scheduledAt: true
      },
      orderBy: { order: 'asc' }
    });

    const published = chapters.filter(c => c.isPublished).length;
    const total = chapters.length;

    res.json({
      chapters,
      summary: {
        total,
        published,
        inReview: chapters.filter(c => c.status === 'IN_REVIEW').length,
        draft: chapters.filter(c => c.status === 'BORRADOR').length,
        percentage: total > 0 ? Math.round((published / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
