import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  worldId: z.string().uuid(),
  name: z.string().min(1),
  species: z.enum(['PLANTA', 'HONGO', 'ANIMAL', 'CRIATURA_MITICA', 'ENTIDAD']).optional(),
  dangerLevel: z.enum(['INOFENSIVA', 'BAJA', 'MEDIA', 'ALTA', 'MORTAL']).optional(),
  habitat: z.string().optional(),
  diet: z.string().optional(),
  description: z.string().min(1),
  folklore: z.string().optional(),
  regionId: z.string().uuid().optional(),
  characteristics: z.any().optional(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    order: z.number().optional()
  })).optional()
});

const updateSchema = createSchema.partial().omit({ worldId: true });

async function resolveWorldIdForEntry(entryId: string): Promise<string> {
  const entry = await prisma.bestiaryEntry.findUnique({ where: { id: entryId }, select: { worldId: true } });
  if (!entry) throw new AppError(404, 'Entry not found');
  return entry.worldId;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const { images, ...creatureData } = data;

    const entry = await prisma.bestiaryEntry.create({
      data: {
        ...creatureData,
        images: images ? {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            order: img.order ?? idx
          }))
        } : undefined
      },
      include: { images: true, region: true }
    });
    res.status(201).json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Create bestiary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const { species, dangerLevel, search, regionId } = req.query;
    const where: any = { worldId: req.params.worldId };
    if (species) where.species = String(species);
    if (dangerLevel) where.dangerLevel = String(dangerLevel);
    if (regionId) where.regionId = String(regionId);
    if (search) where.name = { contains: String(search), mode: 'insensitive' };

    const entries = await prisma.bestiaryEntry.findMany({
      where,
      include: {
        region: { select: { id: true, name: true } },
        images: { orderBy: { order: 'asc' } },
        _count: { select: { images: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ entries });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('List bestiary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveWorldIdForEntry(req.params.id);
    await requireWorldMember(worldId, req.userId);
    const entry = await prisma.bestiaryEntry.findUnique({
      where: { id: req.params.id },
      include: {
        region: true,
        images: { orderBy: { order: 'asc' } },
        characters: { include: { character: { select: { id: true, name: true } } } }
      }
    });
    if (!entry) throw new AppError(404, 'Not found');
    res.json({ entry });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Get bestiary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const worldId = await resolveWorldIdForEntry(req.params.id);
    await requireWorldMember(worldId, req.userId);
    const { images, ...updateData } = data;

    // If images provided, delete existing and create new
    if (images) {
      await prisma.image.deleteMany({ where: { creatureId: req.params.id } });
    }

    const entry = await prisma.bestiaryEntry.update({
      where: { id: req.params.id },
      data: {
        ...updateData,
        images: images ? {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            order: img.order ?? idx
          }))
        } : undefined
      },
      include: { images: true, region: true }
    });
    res.json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Update bestiary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveWorldIdForEntry(req.params.id);
    await requireWorldMember(worldId, req.userId);
    await prisma.image.deleteMany({ where: { creatureId: req.params.id } });
    await prisma.bestiaryEntry.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Delete bestiary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Image management routes
router.post('/:id/images', async (req: Request, res: Response) => {
  try {
    const { url, alt, caption, order } = req.body;
    if (!url) { res.status(400).json({ error: 'URL is required' }); return; }
    const worldId = await resolveWorldIdForEntry(req.params.id);
    await requireWorldMember(worldId, req.userId);

    const image = await prisma.image.create({
      data: {
        url,
        alt,
        caption,
        order: order ?? 0,
        creatureId: req.params.id
      }
    });
    res.status(201).json({ image });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Add image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/images/:imageId', async (req: Request, res: Response) => {
  try {
    const image = await prisma.image.findUnique({
      where: { id: req.params.imageId },
      include: { creature: { select: { worldId: true } } }
    });
    if (!image || !image.creature) throw new AppError(404, 'Image not found');
    await requireWorldMember(image.creature.worldId, req.userId);
    await prisma.image.delete({ where: { id: req.params.imageId } });
    res.json({ message: 'Image deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;