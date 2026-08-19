import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../index';
import { AppError } from '../middlewares/errorHandler';

const router = Router();

router.get('/:token', async (req: Request, res: Response) => {
  try {
    const manuscript = await prisma.manuscript.findUnique({
      where: { shareToken: req.params.token },
      select: {
        id: true, title: true, subtitle: true, author: true, genre: true,
        coverImage: true, synopsis: true, wordCount: true, readTimeMinutes: true,
        sharePassword: true,
        world: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, avatarUrl: true } }
      }
    });

    if (!manuscript) throw new AppError(404, 'Manuscript not found');

    const hasPassword = !!manuscript.sharePassword;
    const { sharePassword, ...manuscriptData } = manuscript;

    res.json({ manuscript: manuscriptData, hasPassword });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:token/verify', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const manuscript = await prisma.manuscript.findUnique({
      where: { shareToken: req.params.token },
      select: { id: true, sharePassword: true, title: true }
    });

    if (!manuscript) throw new AppError(404, 'Manuscript not found');

    if (!manuscript.sharePassword) {
      const token = jwt.sign(
        { manuscriptId: manuscript.id, access: 'shared' },
        process.env.JWT_SECRET || 'fallback',
        { expiresIn: '24h' }
      );
      res.json({ valid: true, token, title: manuscript.title });
      return;
    }

    if (!password) throw new AppError(400, 'Password required');

    const isValid = await bcrypt.compare(password, manuscript.sharePassword);
    if (!isValid) throw new AppError(401, 'Invalid password');

    const token = jwt.sign(
      { manuscriptId: manuscript.id, access: 'shared' },
      process.env.JWT_SECRET || 'fallback',
      { expiresIn: '24h' }
    );

    res.json({ valid: true, token, title: manuscript.title });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:token/read/:chapterId', async (req: Request, res: Response) => {
  try {
    const manuscript = await prisma.manuscript.findUnique({
      where: { shareToken: req.params.token },
      select: { id: true }
    });

    if (!manuscript) throw new AppError(404, 'Manuscript not found');

    const chapter = await prisma.chapter.findFirst({
      where: {
        id: req.params.chapterId,
        manuscriptId: manuscript.id,
        isPublished: true
      },
      include: {
        characters: { include: { character: { select: { id: true, name: true, title: true } } } }
      }
    });

    if (!chapter) throw new AppError(404, 'Chapter not found or not published');

    await prisma.manuscript.update({
      where: { id: manuscript.id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({ chapter });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
