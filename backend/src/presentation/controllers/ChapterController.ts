import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { requireManuscriptMember } from '../middlewares/access';

const router = Router();
router.use(authenticate);

const createChapterSchema = z.object({
  title: z.string().min(1),
  genre: z.string().optional(),
  epigraph: z.string().optional(),
  content: z.string().optional().default(''),
  coverImageUrl: z.string().optional()
});

const updateChapterSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  genre: z.string().optional(),
  epigraph: z.string().optional(),
  coverImageUrl: z.string().optional()
});

async function getChapter(manuscriptId: string, chapterId: string) {
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, manuscriptId }
  });
  if (!chapter) throw new AppError(404, 'Chapter not found');
  return chapter;
}

router.get('/manuscripts/:manuscriptId/chapters', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const chapters = await prisma.chapter.findMany({
      where: { manuscriptId: req.params.manuscriptId },
      select: {
        id: true, number: true, title: true, genre: true, epigraph: true,
        content: true, wordCount: true, status: true, isPublished: true,
        publishedAt: true, scheduledAt: true, version: true, order: true,
        updatedAt: true,
        _count: { select: { tasks: true } }
      },
      orderBy: { order: 'asc' }
    });

    res.json({ chapters });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manuscripts/:manuscriptId/chapters/:id', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const chapter = await prisma.chapter.findFirst({
      where: { id: req.params.id, manuscriptId: req.params.manuscriptId },
      include: {
        characters: { include: { character: { select: { id: true, name: true, title: true } } } },
        _count: { select: { tasks: true } }
      }
    });

    if (!chapter) throw new AppError(404, 'Chapter not found');
    res.json({ chapter });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/chapters', async (req: Request, res: Response) => {
  try {
    const data = createChapterSchema.parse(req.body);
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'EDITOR_TEXTO']);

    const maxOrder = await prisma.chapter.findFirst({
      where: { manuscriptId: req.params.manuscriptId },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const chapter = await prisma.chapter.create({
      data: {
        manuscriptId: req.params.manuscriptId,
        title: data.title,
        genre: data.genre,
        epigraph: data.epigraph,
        content: data.content,
        coverImageUrl: data.coverImageUrl,
        number: (maxOrder?.order || 0) + 1,
        order: (maxOrder?.order || 0) + 1
      }
    });

    await prisma.manuscript.update({
      where: { id: req.params.manuscriptId },
      data: { totalChapters: { increment: 1 } }
    });

    res.status(201).json({ chapter });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/manuscripts/:manuscriptId/chapters/:id', async (req: Request, res: Response) => {
  try {
    const data = updateChapterSchema.parse(req.body);
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'EDITOR_TEXTO']);

    const chapter = await getChapter(req.params.manuscriptId, req.params.id);

    let wordCount: number | undefined;
    if (data.content !== undefined) {
      wordCount = data.content.split(/\s+/).length;
    }

    const updated = await prisma.chapter.update({
      where: { id: chapter.id },
      data: {
        title: data.title,
        genre: data.genre,
        epigraph: data.epigraph,
        coverImageUrl: data.coverImageUrl,
        ...(data.content !== undefined && { content: data.content, wordCount }),
        version: { increment: 1 }
      }
    });

    if (wordCount !== undefined) {
      const totalWords = await prisma.chapter.aggregate({
        where: { manuscriptId: req.params.manuscriptId },
        _sum: { wordCount: true }
      });
      await prisma.manuscript.update({
        where: { id: req.params.manuscriptId },
        data: {
          wordCount: totalWords._sum.wordCount || 0,
          readTimeMinutes: Math.ceil((totalWords._sum.wordCount || 0) / 250)
        }
      });
    }

    res.json({ chapter: updated });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/chapters/:id/publish', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'PUBLICADOR']);

    const chapter = await getChapter(req.params.manuscriptId, req.params.id);

    if (!chapter.isPublished) {
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: {
          isPublished: true,
          publishedAt: new Date(),
          status: 'PUBLISHED'
        }
      });

      await prisma.manuscript.update({
        where: { id: req.params.manuscriptId },
        data: { publishedChapters: { increment: 1 } }
      });
    }

    res.json({ chapter: { ...chapter, isPublished: true } });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/chapters/:id/unpublish', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'PUBLICADOR']);

    const chapter = await getChapter(req.params.manuscriptId, req.params.id);

    if (chapter.isPublished) {
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { isPublished: false, publishedAt: null, status: 'BORRADOR' }
      });

      const manuscript = await prisma.manuscript.findUnique({
        where: { id: req.params.manuscriptId },
        select: { publishedChapters: true }
      });
      const nextPublished = manuscript ? Math.max(0, manuscript.publishedChapters - 1) : 0;

      await prisma.manuscript.update({
        where: { id: req.params.manuscriptId },
        data: { publishedChapters: nextPublished }
      });
    }

    res.json({ chapter: { ...chapter, isPublished: false } });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/manuscripts/:manuscriptId/chapters/:id/schedule', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const chapter = await getChapter(req.params.manuscriptId, req.params.id);
    const { scheduledAt } = req.body;
    if (!scheduledAt) throw new AppError(400, 'scheduledAt required');

    const updated = await prisma.chapter.update({
      where: { id: chapter.id },
      data: { scheduledAt: new Date(scheduledAt), status: 'SCHEDULED' }
    });

    res.json({ chapter: updated });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/manuscripts/:manuscriptId/chapters/:id', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'EDITOR_TEXTO']);

    const chapter = await getChapter(req.params.manuscriptId, req.params.id);

    await prisma.chapter.delete({ where: { id: chapter.id } });

    await prisma.manuscript.update({
      where: { id: req.params.manuscriptId },
      data: { totalChapters: { decrement: 1 } }
    });

    res.json({ message: 'Chapter deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;