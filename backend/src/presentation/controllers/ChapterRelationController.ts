import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { requireManuscriptMember, requireWorldMember } from '../middlewares/access';

const router = Router();
router.use(authenticate);

const createRelationSchema = z.object({
  chapterId: z.string().uuid(),
  targetType: z.enum(['CHARACTER', 'BESTIARY', 'CONTINENT', 'SEA', 'REGION', 'MAP', 'NATION', 'MAGIC_SYSTEM', 'SPELL', 'LAW', 'HERALDRY', 'TIMELINE_EVENT']),
  targetId: z.string().uuid(),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  selectedText: z.string().optional(),
  label: z.string().optional()
});

const updateRelationSchema = z.object({
  label: z.string().optional(),
  selectedText: z.string().optional()
});

async function getTargetEntity(targetType: string, targetId: string) {
  const modelMap: Record<string, any> = {
    CHARACTER: prisma.character,
    BESTIARY: prisma.bestiaryEntry,
    CONTINENT: prisma.continent,
    SEA: prisma.sea,
    REGION: prisma.region,
    MAP: prisma.map,
    NATION: prisma.nation,
    MAGIC_SYSTEM: prisma.magicSystem,
    SPELL: prisma.spell,
    LAW: prisma.law,
    HERALDRY: prisma.heraldryItem,
    TIMELINE_EVENT: prisma.timelineEvent
  };
  const includeMap: Record<string, any> = {
    BESTIARY: { images: true, region: { select: { id: true, name: true } } },
    CHARACTER: { images: true },
    NATION: { continent: { select: { id: true, name: true } } }
  };
  const model = modelMap[targetType];
  if (!model) throw new AppError(400, `Invalid target type: ${targetType}`);
  const entity = await model.findUnique({ where: { id: targetId }, include: includeMap[targetType] || undefined });
  if (!entity) throw new AppError(404, `${targetType} not found`);
  return entity;
}

// List relations for a chapter
router.get('/chapters/:chapterId/relations', async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { manuscriptId: true } });
    if (!chapter) throw new AppError(404, 'Chapter not found');
    await requireManuscriptMember(chapter.manuscriptId, req.user!.userId);

    const relations = await prisma.chapterRelation.findMany({
      where: { chapterId },
      orderBy: { startOffset: 'asc' }
    });

    // Fetch target entities
    const enriched = await Promise.all(relations.map(async (rel) => {
      const entity = await getTargetEntity(rel.targetType, rel.targetId);
      return { ...rel, target: entity };
    }));

    res.json({ relations: enriched });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a relation
router.post('/chapters/:chapterId/relations', async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { manuscriptId: true } });
    if (!chapter) throw new AppError(404, 'Chapter not found');
    await requireManuscriptMember(chapter.manuscriptId, req.user!.userId);

    const data = createRelationSchema.parse({ ...req.body, chapterId });

    // Verify target exists
    await getTargetEntity(data.targetType, data.targetId);

    const relation = await prisma.chapterRelation.create({ data });
    res.status(201).json({ relation });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a relation
router.put('/relations/:id', async (req: Request, res: Response) => {
  try {
    const relation = await prisma.chapterRelation.findUnique({ where: { id: req.params.id }, include: { chapter: { select: { manuscriptId: true } } } });
    if (!relation) throw new AppError(404, 'Relation not found');
    await requireManuscriptMember(relation.chapter.manuscriptId, req.user!.userId);

    const data = updateRelationSchema.parse(req.body);
    const updated = await prisma.chapterRelation.update({ where: { id: req.params.id }, data });
    res.json({ relation: updated });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a relation
router.delete('/relations/:id', async (req: Request, res: Response) => {
  try {
    const relation = await prisma.chapterRelation.findUnique({ where: { id: req.params.id }, include: { chapter: { select: { manuscriptId: true } } } });
    if (!relation) throw new AppError(404, 'Relation not found');
    await requireManuscriptMember(relation.chapter.manuscriptId, req.user!.userId);

    await prisma.chapterRelation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all world elements for a world (for relation picker)
router.get('/worlds/:worldId/elements', async (req: Request, res: Response) => {
  try {
    const { worldId } = req.params;
    await requireWorldMember(worldId, req.user!.userId);

    const [characters, bestiary, continents, seas, regions, maps, nations, magicSystems, spells, laws, heraldry, events] = await Promise.all([
      prisma.character.findMany({ where: { worldId }, select: { id: true, name: true } }),
      prisma.bestiaryEntry.findMany({ where: { worldId }, select: { id: true, name: true, species: true } }),
      prisma.continent.findMany({ where: { worldId }, select: { id: true, name: true, climate: true } }),
      prisma.sea.findMany({ where: { worldId }, select: { id: true, name: true, tone: true } }),
      prisma.region.findMany({ where: { worldId }, select: { id: true, name: true } }),
      prisma.map.findMany({ where: { worldId }, select: { id: true, name: true, era: true } }),
      prisma.nation.findMany({ where: { worldId }, select: { id: true, name: true } }),
      prisma.magicSystem.findMany({ where: { worldId }, select: { id: true, name: true } }),
      prisma.spell.findMany({ where: { worldId }, select: { id: true, name: true } }),
      prisma.law.findMany({ where: { worldId }, select: { id: true, title: true } }),
      prisma.heraldryItem.findMany({ where: { worldId }, select: { id: true, name: true } }),
      prisma.timelineEvent.findMany({ where: { worldId }, select: { id: true, title: true, dateInWorld: true } })
    ]);

    res.json({
      elements: {
        CHARACTER: characters,
        BESTIARY: bestiary,
        CONTINENT: continents,
        SEA: seas,
        REGION: regions,
        MAP: maps,
        NATION: nations,
        MAGIC_SYSTEM: magicSystems,
        SPELL: spells,
        LAW: laws,
        HERALDRY: heraldry,
        TIMELINE_EVENT: events
      }
    });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
