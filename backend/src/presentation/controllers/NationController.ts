import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

const NATION_FIELDS = ['name', 'motto', 'government', 'population', 'militaryPower', 'culture', 'coatOfArmsUrl', 'regionId'] as const;

type NationData = {
  name?: string;
  motto?: string;
  government?: string;
  population?: number;
  militaryPower?: number;
  culture?: string;
  coatOfArmsUrl?: string;
  regionId?: string;
};

function pickFields(body: Record<string, unknown>): NationData {
  const data: NationData = {};
  for (const key of NATION_FIELDS) {
    if (body[key] !== undefined) (data as Record<string, unknown>)[key] = body[key];
  }
  return data;
}

function linkArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function listInclude() {
  return {
    region: { select: { id: true, name: true } },
    continents: { select: { continent: { select: { id: true, name: true } } } },
    heraldry: { include: { heraldry: { select: { id: true, name: true, composition: true } } } },
    _count: { select: { characters: true, laws: true, events: true } }
  };
}

function detailInclude() {
  return {
    region: { select: { id: true, name: true } },
    continents: { select: { continent: { select: { id: true, name: true } } } },
    characters: { select: { id: true, name: true, title: true } },
    events: { select: { event: { select: { id: true, title: true } } } },
    heraldry: { include: { heraldry: { select: { id: true, name: true, composition: true } } } },
    _count: { select: { characters: true, laws: true, events: true } }
  };
}

function formatNation(nation: any) {
  const { continents, events, heraldry, ...rest } = nation;
  return {
    ...rest,
    continents: continents?.map((c: any) => c.continent).filter(Boolean) || [],
    events: events?.map((r: any) => r.event).filter(Boolean) || [],
    heraldry: heraldry?.map((l: any) => l.heraldry).filter(Boolean) || []
  };
}

async function linkCharacters(nationId: string, worldId: string, characterIds: string[]) {
  await prisma.character.updateMany({ where: { nationId, NOT: { id: { in: characterIds } } }, data: { nationId: null } });
  if (characterIds.length > 0) {
    await prisma.character.updateMany({ where: { id: { in: characterIds }, worldId }, data: { nationId } });
  }
}

async function syncEventRelations(nationId: string, eventIds: string[]) {
  await prisma.eventRelation.deleteMany({ where: { nationId, targetType: 'NATION' } });
  if (eventIds.length > 0) {
    await prisma.eventRelation.createMany({
      data: eventIds.map((eventId) => ({ eventId, targetId: nationId, targetType: 'NATION', nationId }))
    });
  }
}

async function syncContinents(nationId: string, continentIds: string[]) {
  await prisma.nationContinent.deleteMany({ where: { nationId } });
  if (continentIds.length > 0) {
    await prisma.nationContinent.createMany({
      data: continentIds.map((continentId) => ({ nationId, continentId }))
    });
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { worldId } = req.body;
    if (!worldId) throw new AppError(400, 'worldId required');
    await requireWorldMember(worldId, req.userId);

    const continentIds = linkArray(req.body.continentIds);
    const characterIds = linkArray(req.body.characterIds);
    const eventIds = linkArray(req.body.eventIds);
    const data = pickFields(req.body);
    if (!data.name) throw new AppError(400, 'name required');

    const nation = await prisma.nation.create({ data: { ...data, worldId } as Prisma.NationUncheckedCreateInput });

    await syncContinents(nation.id, continentIds);
    await linkCharacters(nation.id, worldId, characterIds);
    await syncEventRelations(nation.id, eventIds);

    const result = await prisma.nation.findUnique({ where: { id: nation.id }, include: detailInclude() });
    res.status(201).json({ nation: formatNation(result) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const nations = await prisma.nation.findMany({
      where: { worldId: req.params.worldId },
      include: listInclude()
    });
    res.json({ nations: nations.map(formatNation) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const nation = await prisma.nation.findUnique({
      where: { id: req.params.id },
      include: detailInclude()
    });
    if (!nation) throw new AppError(404, 'Not found');
    await requireWorldMember(nation.worldId, req.userId);
    res.json({ nation: formatNation(nation) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const nation = await prisma.nation.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!nation) throw new AppError(404, 'Not found');
    await requireWorldMember(nation.worldId, req.userId);

    const continentIds = linkArray(req.body.continentIds);
    const characterIds = linkArray(req.body.characterIds);
    const eventIds = linkArray(req.body.eventIds);

    await prisma.nation.update({ where: { id: req.params.id }, data: pickFields(req.body) as Prisma.NationUncheckedUpdateInput });
    await syncContinents(req.params.id, continentIds);
    await linkCharacters(req.params.id, nation.worldId, characterIds);
    await syncEventRelations(req.params.id, eventIds);

    const result = await prisma.nation.findUnique({ where: { id: req.params.id }, include: detailInclude() });
    res.json({ nation: formatNation(result) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const nation = await prisma.nation.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!nation) throw new AppError(404, 'Not found');
    await requireWorldMember(nation.worldId, req.userId);
    await prisma.nation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;