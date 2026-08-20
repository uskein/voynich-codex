import { Router, Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    const worldId = req.params.worldId;

    const [world, manuscripts, characters, creatures, events, nations, magicSystems] = await Promise.all([
      prisma.world.findUnique({ where: { id: worldId }, select: { name: true } }),
      prisma.manuscript.findMany({ where: { worldId }, select: { wordCount: true, totalChapters: true, publishedChapters: true, completionPct: true } }),
      prisma.character.count({ where: { worldId } }),
      prisma.bestiaryEntry.count({ where: { worldId } }),
      prisma.timelineEvent.count({ where: { worldId } }),
      prisma.nation.count({ where: { worldId } }),
      prisma.magicSystem.count({ where: { worldId } })
    ]);

    const totalWords = manuscripts.reduce((sum, m) => sum + m.wordCount, 0);
    const totalChapters = manuscripts.reduce((sum, m) => sum + m.totalChapters, 0);
    const totalPublished = manuscripts.reduce((sum, m) => sum + m.publishedChapters, 0);

    res.json({
      world: world?.name,
      stats: {
        manuscripts: manuscripts.length,
        totalWords,
        totalChapters,
        publishedChapters: totalPublished,
        characters,
        creatures,
        events,
        nations,
        magicSystems,
        completionPct: totalChapters > 0 ? Math.round((totalPublished / totalChapters) * 100) : 0
      }
    });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/manuscript/:manuscriptId', async (req: Request, res: Response) => {
  try {
    const manuscriptId = req.params.manuscriptId;

    const [manuscript, chapters, tasks, members] = await Promise.all([
      prisma.manuscript.findUnique({ where: { id: manuscriptId }, select: { title: true, wordCount: true, totalChapters: true, publishedChapters: true, completionPct: true } }),
      prisma.chapter.findMany({ where: { manuscriptId }, select: { id: true, title: true, wordCount: true, status: true, isPublished: true } }),
      prisma.task.groupBy({ where: { manuscriptId }, by: ['status'], _count: true }),
      prisma.manuscriptMember.count({ where: { manuscriptId } })
    ]);

    const taskStats = tasks.reduce((acc, t) => { acc[t.status] = t._count; return acc; }, {} as Record<string, number>);

    res.json({
      manuscript: manuscript?.title,
      stats: {
        wordCount: manuscript?.wordCount || 0,
        totalChapters: manuscript?.totalChapters || 0,
        publishedChapters: manuscript?.publishedChapters || 0,
        completionPct: manuscript?.completionPct || 0,
        chapters: chapters.map(c => ({ id: c.id, title: c.title, wordCount: c.wordCount, status: c.status, isPublished: c.isPublished })),
        tasks: taskStats,
        members
      }
    });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
