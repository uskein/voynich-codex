import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

const schema = z.object({
  worldId: z.string().uuid(), name: z.string().min(1), title: z.string().optional(),
  biography: z.string().min(1), psychology: z.string().optional(), origin: z.string().optional(),
  role: z.string().optional(), nationId: z.string().uuid().optional(), regionId: z.string().uuid().optional(),
  images: z.array(z.object({
    url: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
    order: z.number().optional()
  })).optional()
});

const updateSchema = schema.partial().omit({ worldId: true });

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = schema.parse(req.body);
    await requireWorldMember(data.worldId, req.userId);
    const { images, ...characterData } = data;
    const character = await prisma.character.create({
      data: {
        ...characterData,
        images: images ? {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            order: img.order ?? idx
          }))
        } : undefined
      },
      include: { images: true }
    });
    res.status(201).json({ character });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const { search, role } = req.query;
    const where: any = { worldId: req.params.worldId };
    if (search) where.name = { contains: String(search), mode: 'insensitive' };
    if (role) where.role = String(role);

    const characters = await prisma.character.findMany({
      where, include: {
        nation: { select: { id: true, name: true } },
        region: { select: { id: true, name: true } },
        images: { take: 1, orderBy: { order: 'asc' } },
        _count: { select: { images: true, chapters: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ characters });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const character = await prisma.character.findUnique({
      where: { id: req.params.id },
      include: { nation: true, images: true, creatures: { include: { creature: { select: { id: true, name: true, species: true } } } },
        chapters: { include: { chapter: { select: { id: true, title: true, number: true } } } }
      }
    });
    if (!character) throw new AppError(404, 'Not found');
    await requireWorldMember(character.worldId, req.userId);
    res.json({ character });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const character = await prisma.character.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!character) throw new AppError(404, 'Not found');
    await requireWorldMember(character.worldId, req.userId);
    const data = updateSchema.parse(req.body);
    const { images, ...characterData } = data;

    if (images) {
      await prisma.image.deleteMany({ where: { characterId: req.params.id } });
    }

    const updated = await prisma.character.update({
      where: { id: req.params.id },
      data: {
        ...characterData,
        images: images ? {
          create: images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            caption: img.caption,
            order: img.order ?? idx
          }))
        } : undefined
      },
      include: { images: true }
    });
    res.json({ character: updated });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    console.error('Update character error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const character = await prisma.character.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!character) throw new AppError(404, 'Not found');
    await requireWorldMember(character.worldId, req.userId);
    await prisma.character.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;