import { Router, Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';
import { requireWorldMember } from '../middlewares/access';
import { AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authenticate);

router.post('/', async (req: Request, res: Response) => {
  try {
    const { worldId } = req.body;
    if (!worldId) throw new AppError(400, 'worldId required');
    await requireWorldMember(worldId, req.userId);
    const law = await prisma.law.create({ data: req.body });
    res.status(201).json({ law });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/world/:worldId', async (req: Request, res: Response) => {
  try {
    await requireWorldMember(req.params.worldId, req.userId);
    const { severity, status } = req.query;
    const where: any = { worldId: req.params.worldId };
    if (severity) where.severity = String(severity);
    if (status) where.status = String(status);

    const laws = await prisma.law.findMany({
      where, include: { nation: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' }
    });
    res.json({ laws });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const law = await prisma.law.findUnique({ where: { id: req.params.id }, include: { nation: true } });
    if (!law) throw new AppError(404, 'Not found');
    await requireWorldMember(law.worldId, req.userId);
    res.json({ law });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const law = await prisma.law.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!law) throw new AppError(404, 'Not found');
    await requireWorldMember(law.worldId, req.userId);
    const updated = await prisma.law.update({ where: { id: req.params.id }, data: req.body });
    res.json({ law: updated });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const law = await prisma.law.findUnique({ where: { id: req.params.id }, select: { worldId: true } });
    if (!law) throw new AppError(404, 'Not found');
    await requireWorldMember(law.worldId, req.userId);
    await prisma.law.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;