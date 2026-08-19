import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

const schema = z.object({
  worldId: z.string().uuid(), title: z.string().min(1), description: z.string().min(1),
  dateInWorld: z.string().min(1), era: z.enum(['PREHISTORIA', 'EDAD_ANTIGUA', 'ERA_DE_LA_GUERRA', 'ERA_DE_LA_RECONSTRUCCION', 'ERA_ACTUAL']).optional(),
  importance: z.number().min(1).max(10).optional(),
  relations: z.array(z.object({
    targetType: z.enum(['BESTIARY', 'CHARACTER', 'NATION', 'EVENT']),
    targetId: z.string().uuid()
  })).optional()
});

function toRelationData(relations: { targetType: string; targetId: string }[]) {
  return relations.map(({ targetType, targetId }) => ({
    targetId,
    targetType,
    ...(targetType === 'BESTIARY' ? { bestiaryEntryId: targetId } : {}),
    ...(targetType === 'CHARACTER' ? { characterId: targetId } : {}),
    ...(targetType === 'NATION' ? { nationId: targetId } : {})
  }));
}

function enrichEventRelations(events: any[]) {
  const map = new Map(events.map((e) => [e.id, e]));
  for (const event of events) {
    for (const rel of event.relations || []) {
      if (rel.targetType === 'EVENT') {
        const target = map.get(rel.targetId);
        rel.Event = target ? { id: target.id, title: target.title } : null;
      }
    }
  }
  return events;
}

const relationInclude = {
  relations: {
    include: {
      BestiaryEntry: { select: { id: true, name: true } },
      Character: { select: { id: true, name: true } },
      Nation: { select: { id: true, name: true } }
    }
  }
};

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = schema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const { relations, ...rest } = data;
    const event = await prisma.timelineEvent.create({
      data: { ...rest, ...(relations?.length ? { relations: { create: toRelationData(relations) } } : {}) },
      include: relationInclude
    });
    res.status(201).json({ event: enrichEventRelations([event])[0] });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const { era, search } = req.query;
    const where: any = { worldId: req.params.worldId };
    if (era) where.era = String(era);
    if (search) where.title = { contains: String(search), mode: 'insensitive' };

    const events = await prisma.timelineEvent.findMany({ where, orderBy: { dateInWorld: 'asc' }, include: relationInclude });
    res.json({ events: enrichEventRelations(events) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await prisma.timelineEvent.findUnique({ where: { id: req.params.id }, include: { relations: true } });
    if (!event) throw new AppError(404, 'Not found');
    await requireWorldMember(event.worldId, req.userId);
    const enriched = enrichEventRelations([event])[0];
    res.json({ event: enriched });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const event = await prisma.timelineEvent.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!event) throw new AppError(404, 'Not found');
    await requireWorldMember(event.worldId, req.userId);
    const data = schema.partial().parse(req.body);
    const { relations, ...rest } = data;
    const updated = await prisma.$transaction(async (tx) => {
      const ev = await tx.timelineEvent.update({ where: { id: req.params.id }, data: rest });
      if (relations) {
        await tx.eventRelation.deleteMany({ where: { eventId: req.params.id } });
        if (relations.length > 0) {
          await tx.eventRelation.createMany({ data: toRelationData(relations).map((r) => ({ ...r, eventId: req.params.id })) });
        }
      }
      return ev;
    });
    const withRels = await prisma.timelineEvent.findUnique({ where: { id: req.params.id }, include: relationInclude });
    res.json({ event: enrichEventRelations([withRels])[0] });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const event = await prisma.timelineEvent.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!event) throw new AppError(404, 'Not found');
    await requireWorldMember(event.worldId, req.userId);
    await prisma.timelineEvent.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;