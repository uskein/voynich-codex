import { Router, Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

const FIELDS = ['name', 'description', 'composition'] as const;

function pickFields(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

function linkArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function detailInclude() {
  return {
    links: {
      include: {
        nation: { select: { id: true, name: true } },
        character: { select: { id: true, name: true, title: true } }
      }
    }
  };
}

function formatItem(item: any) {
  const { links, ...rest } = item;
  const nations: any[] = [];
  const characters: any[] = [];
  for (const link of links || []) {
    if (link.nation) nations.push({ id: link.nation.id, name: link.nation.name });
    if (link.character) characters.push({ id: link.character.id, name: link.character.name, title: link.character.title });
  }
  return { ...rest, nations, characters };
}

async function syncLinks(heraldryId: string, nationIds: string[], characterIds: string[]) {
  await prisma.heraldryLink.deleteMany({ where: { heraldryId } });
  if (nationIds.length > 0 || characterIds.length > 0) {
    await prisma.heraldryLink.createMany({
      data: [
        ...nationIds.map((nationId) => ({ heraldryId, nationId })),
        ...characterIds.map((characterId) => ({ heraldryId, characterId }))
      ]
    });
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { worldId } = req.body;
    if (!worldId) throw new AppError(400, 'worldId required');
    await requireWorldMember(worldId, req.userId);
    const data = pickFields(req.body);
    if (!data.name) throw new AppError(400, 'name required');

    const nationIds = linkArray(req.body.nationIds);
    const characterIds = linkArray(req.body.characterIds);

    const item = await prisma.heraldryItem.create({ data: { ...data, worldId } as any });
    await syncLinks(item.id, nationIds, characterIds);

    const result = await prisma.heraldryItem.findUnique({ where: { id: item.id }, include: detailInclude() });
    res.status(201).json({ item: formatItem(result) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const items = await prisma.heraldryItem.findMany({
      where: { worldId: req.params.worldId },
      orderBy: { createdAt: 'desc' },
      include: detailInclude()
    });
    res.json({ items: items.map(formatItem) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.heraldryItem.findUnique({ where: { id: req.params.id }, include: detailInclude() });
    if (!item) throw new AppError(404, 'Not found');
    await requireWorldMember(item.worldId, req.userId);
    res.json({ item: formatItem(item) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.heraldryItem.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!item) throw new AppError(404, 'Not found');
    await requireWorldMember(item.worldId, req.userId);

    const nationIds = linkArray(req.body.nationIds);
    const characterIds = linkArray(req.body.characterIds);

    await prisma.heraldryItem.update({ where: { id: req.params.id }, data: pickFields(req.body) as any });
    await syncLinks(req.params.id, nationIds, characterIds);

    const result = await prisma.heraldryItem.findUnique({ where: { id: req.params.id }, include: detailInclude() });
    res.json({ item: formatItem(result) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const item = await prisma.heraldryItem.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!item) throw new AppError(404, 'Not found');
    await requireWorldMember(item.worldId, req.userId);
    await prisma.heraldryItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;