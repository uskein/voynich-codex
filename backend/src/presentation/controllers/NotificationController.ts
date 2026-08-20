import { Router, Request, Response } from 'express';
import prisma from '../../infrastructure/database/prisma/client';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId: req.user!.userId };
    if (unreadOnly === 'true') where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.userId, read: false } })
    ]);

    res.json({ notifications, total, unreadCount, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!.userId, read: false } });
    res.json({ count });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ message: 'Marked as read' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

router.put('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.userId, read: false }, data: { read: true } });
    res.json({ message: 'All marked as read' });
  } catch (error) { res.status(500).json({ error: 'Internal server error' }); }
});

export default router;
