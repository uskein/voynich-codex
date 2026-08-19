import { Router, Request, Response } from 'express';
import { prisma } from '../../index';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

async function resolveWorldIdForSystem(systemId: string): Promise<string> {
  const system = await prisma.magicSystem.findUnique({ where: { id: systemId }, select: { worldId: true } });
  if (!system) throw new AppError(404, 'System not found');
  return system.worldId;
}

router.post('/systems', async (req: Request, res: Response) => {
  try {
    const { worldId } = req.body;
    if (!worldId) throw new AppError(400, 'worldId required');
    await requireWorldMember(worldId, req.userId);
    const system = await prisma.magicSystem.create({ data: req.body });
    res.status(201).json({ system });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/systems/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const systems = await prisma.magicSystem.findMany({
      where: { worldId: req.params.worldId },
      include: { _count: { select: { spells: true } } }
    });
    res.json({ systems });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/systems/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveWorldIdForSystem(req.params.id);
    await requireWorldMember(worldId, req.userId);
    const system = await prisma.magicSystem.update({ where: { id: req.params.id }, data: req.body });
    res.json({ system });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/systems/:id', async (req: Request, res: Response) => {
  try {
    const worldId = await resolveWorldIdForSystem(req.params.id);
    await requireWorldMember(worldId, req.userId);
    await prisma.magicSystem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/spells', async (req: Request, res: Response) => {
  try {
    let worldId: string = req.body.worldId;
    if (!worldId && req.body.systemId) worldId = await resolveWorldIdForSystem(req.body.systemId);
    if (!worldId) throw new AppError(400, 'worldId or systemId required');
    await requireWorldMember(worldId, req.userId);
    const spell = await prisma.spell.create({ data: req.body });
    res.status(201).json({ spell });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/spells/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const { school } = req.query;
    const where: any = { worldId: req.params.worldId };
    if (school) where.system = { school: String(school) };

    const spells = await prisma.spell.findMany({
      where, include: { system: { select: { id: true, name: true, school: true } } }
    });
    res.json({ spells });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/spells/:id', async (req: Request, res: Response) => {
  try {
    const spell = await prisma.spell.findUnique({
      where: { id: req.params.id },
      include: { system: true, practitioner: { select: { id: true, name: true } } }
    });
    if (!spell) throw new AppError(404, 'Not found');
    await requireWorldMember(spell.worldId, req.userId);
    res.json({ spell });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/spells/:id', async (req: Request, res: Response) => {
  try {
    const spell = await prisma.spell.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!spell) throw new AppError(404, 'Not found');
    await requireWorldMember(spell.worldId, req.userId);
    const updated = await prisma.spell.update({ where: { id: req.params.id }, data: req.body });
    res.json({ spell: updated });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/spells/:id', async (req: Request, res: Response) => {
  try {
    const spell = await prisma.spell.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!spell) throw new AppError(404, 'Not found');
    await requireWorldMember(spell.worldId, req.userId);
    await prisma.spell.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;