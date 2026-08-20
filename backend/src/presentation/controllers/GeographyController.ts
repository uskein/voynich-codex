import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

// ============================================
// CONTINENTS
// ============================================
const continentSchema = z.object({
  worldId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  climate: z.string().optional(),
  tone: z.string().optional(),
  geopoliticalWeight: z.number().optional()
});

async function resolveContinentWorld(continentId: string): Promise<string> {
  const continent = await prisma.continent.findUnique({ where: { id: continentId }, select: { worldId: true } });
  if (!continent) throw new AppError(404, 'Continent not found');
  return continent.worldId;
}

router.post('/continents', async (req: Request, res: Response) => {
  try {
    const data = continentSchema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const continent = await prisma.continent.create({ data });
    res.status(201).json({ continent });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/continents/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const continents = await prisma.continent.findMany({
      where: { worldId: req.params.worldId },
      include: {
        regions: { select: { id: true, name: true } },
        maps: { select: { id: true, name: true, imageUrl: true } },
        _count: { select: { regions: true, maps: true } }
      }
    });
    res.json({ continents });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/continents/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveContinentWorld(req.params.id);
    await requireWorldMember(worldId, req.userId);
    const continent = await prisma.continent.update({ where: { id: req.params.id }, data: req.body });
    res.json({ continent });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/continents/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveContinentWorld(req.params.id);
    await requireWorldMember(worldId, req.userId);
    await prisma.continent.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// SEAS
// ============================================
const seaSchema = z.object({
  worldId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  tradeRoutes: z.string().optional(),
  tone: z.string().optional()
});

router.post('/seas', async (req: Request, res: Response) => {
  try {
    const data = seaSchema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const sea = await prisma.sea.create({ data });
    res.status(201).json({ sea });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/seas/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const seas = await prisma.sea.findMany({
      where: { worldId: req.params.worldId },
      include: {
        maps: { select: { id: true, name: true, imageUrl: true } },
        _count: { select: { maps: true } }
      }
    });
    res.json({ seas });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/seas/:id', async (req: Request, res: Response) => {
  try {
    const sea = await prisma.sea.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!sea) throw new AppError(404, 'Sea not found');
    await requireWorldMember(sea.worldId, req.userId);
    const updated = await prisma.sea.update({ where: { id: req.params.id }, data: req.body });
    res.json({ sea: updated });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/seas/:id', async (req: Request, res: Response) => {
  try {
    const sea = await prisma.sea.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!sea) throw new AppError(404, 'Sea not found');
    await requireWorldMember(sea.worldId, req.userId);
    await prisma.sea.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// REGIONS
// ============================================
const regionSchema = z.object({
  worldId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  climate: z.string().optional(),
  continentId: z.string().uuid()
});

async function resolveRegionWorld(regionId: string): Promise<string> {
  const region = await prisma.region.findUnique({ where: { id: regionId }, select: { worldId: true } });
  if (!region) throw new AppError(404, 'Region not found');
  return region.worldId;
}

router.post('/regions', async (req: Request, res: Response) => {
  try {
    const data = regionSchema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const region = await prisma.region.create({
      data,
      include: { continent: { select: { id: true, name: true } } }
    });
    res.status(201).json({ region });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/regions/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const regions = await prisma.region.findMany({
      where: { worldId: req.params.worldId },
      include: {
        continent: { select: { id: true, name: true } },
        _count: { select: { creatures: true, characters: true, nations: true } }
      }
    });
    res.json({ regions });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/regions/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveRegionWorld(req.params.id);
    await requireWorldMember(worldId, req.userId);
    const region = await prisma.region.update({ where: { id: req.params.id }, data: req.body });
    res.json({ region });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/regions/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveRegionWorld(req.params.id);
    await requireWorldMember(worldId, req.userId);
    await prisma.region.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// MAPS
// ============================================
const mapSchema = z.object({
  worldId: z.string().uuid(),
  name: z.string().min(1),
  era: z.enum(['EDAD_ANTIGUA', 'EDAD_MEDIA', 'EDAD_MODERNA', 'ERA_FUTURA']),
  imageUrl: z.string().url(),
  layers: z.any().optional(),
  continentId: z.string().uuid().optional(),
  seaId: z.string().uuid().optional(),
  pointsOfInterest: z.any().optional()
});

router.post('/maps', async (req: Request, res: Response) => {
  try {
    const data = mapSchema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const map = await prisma.map.create({
      data,
      include: {
        continent: { select: { id: true, name: true } },
        sea: { select: { id: true, name: true } }
      }
    });
    res.status(201).json({ map });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/maps/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const { continentId, seaId } = req.query;
    const where: any = { worldId: req.params.worldId };
    if (continentId) where.continentId = String(continentId);
    if (seaId) where.seaId = String(seaId);

    const maps = await prisma.map.findMany({
      where,
      include: {
        continent: { select: { id: true, name: true } },
        sea: { select: { id: true, name: true } }
      }
    });
    res.json({ maps });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/maps/:id', async (req: Request, res: Response) => {
  try {
    const map = await prisma.map.findUnique({
      where: { id: req.params.id },
      include: {
        continent: true,
        sea: true
      }
    });
    if (!map) throw new AppError(404, 'Not found');
    await requireWorldMember(map.worldId, req.userId);
    res.json({ map });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/maps/:id', async (req: Request, res: Response) => {
  try {
    const map = await prisma.map.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!map) throw new AppError(404, 'Not found');
    await requireWorldMember(map.worldId, req.userId);
    const updated = await prisma.map.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        continent: { select: { id: true, name: true } },
        sea: { select: { id: true, name: true } }
      }
    });
    res.json({ map: updated });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/maps/:id', async (req: Request, res: Response) => {
  try {
    const map = await prisma.map.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!map) throw new AppError(404, 'Not found');
    await requireWorldMember(map.worldId, req.userId);
    await prisma.map.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;