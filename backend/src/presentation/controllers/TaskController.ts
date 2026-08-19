import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../index';
import { authenticate } from '../middlewares/auth.middleware';
import { AppError } from '../middlewares/errorHandler';
import { requireManuscriptMember } from '../middlewares/access';

const router = Router();
router.use(authenticate);

const PRIORITY_TO_DB: Record<string, any> = {
  LOW: 'BAJA',
  MEDIUM: 'MEDIA',
  HIGH: 'ALTA',
  CRITICAL: 'CRITICA'
};

const PRIORITY_TO_FRONT: Record<string, any> = {
  BAJA: 'LOW',
  MEDIA: 'MEDIUM',
  ALTA: 'HIGH',
  CRITICA: 'CRITICAL'
};

function toDbPriority(priority?: string) {
  if (!priority) return undefined;
  return PRIORITY_TO_DB[priority] || priority;
}

function serializeTags(tags?: string[] | string): string | undefined {
  if (Array.isArray(tags)) return tags.join(', ');
  return tags;
}

function deserializeTags(tags?: string | null): string[] {
  if (!tags) return [];
  return tags.split(',').map(t => t.trim()).filter(Boolean);
}

function toFrontTask(task: any): any {
  const { priority, tags, ...rest } = task;
  return {
    ...rest,
    priority: PRIORITY_TO_FRONT[priority] || priority,
    labels: deserializeTags(tags)
  };
}

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['TASK', 'BUG', 'FEATURE', 'REVIEW', 'CHAPTER', 'MILESTONE_TASK']).optional(),
  priority: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'ARCHIVED']).optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  assigneeId: z.string().uuid().optional(),
  sprintId: z.string().uuid().optional(),
  chapterId: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  labels: z.array(z.string()).optional(),
  parentTaskId: z.string().uuid().optional()
});

const createSprintSchema = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string()
});

const createMilestoneSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string(),
  type: z.enum(['PROJECT_START', 'FIRST_DRAFT', 'EDITORIAL_REVIEW', 'FINAL_REVIEW', 'PUBLICATION', 'CUSTOM']).optional()
});

async function getTask(manuscriptId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, manuscriptId }
  });
  if (!task) throw new AppError(404, 'Task not found');
  return task;
}

router.get('/manuscripts/:manuscriptId/tasks', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const { status, assigneeId, sprintId, type } = req.query;
    const where: any = { manuscriptId: req.params.manuscriptId };

    if (status) where.status = String(status);
    if (assigneeId) where.assigneeId = String(assigneeId);
    if (sprintId) where.sprintId = String(sprintId);
    if (type) where.type = String(type);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { comments: true, children: true } }
      },
      orderBy: [{ status: 'asc' }, { order: 'asc' }]
    });

    const frontTasks = tasks.map(toFrontTask);
    const grouped = {
      TODO: frontTasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: frontTasks.filter(t => t.status === 'IN_PROGRESS'),
      IN_REVIEW: frontTasks.filter(t => t.status === 'IN_REVIEW'),
      BLOCKED: frontTasks.filter(t => t.status === 'BLOCKED'),
      DONE: frontTasks.filter(t => t.status === 'DONE')
    };

    res.json({ tasks: frontTasks, grouped });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/manuscripts/:manuscriptId/tasks/reorder', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const { taskId, status, order } = req.body;
    if (!taskId) throw new AppError(400, 'taskId required');

    const task = await getTask(req.params.manuscriptId, taskId);

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { order, ...(status && { status }) }
    });

    res.json({ task: toFrontTask(updated) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manuscripts/:manuscriptId/tasks/:id', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const task = await prisma.task.findFirst({
      where: { id: req.params.id, manuscriptId: req.params.manuscriptId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } },
        comments: { include: { user: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'desc' } },
        attachments: true,
        children: { include: { assignee: { select: { id: true, name: true } } } },
        parentTask: { select: { id: true, title: true } },
        chapter: { select: { id: true, title: true, number: true } }
      }
    });

    if (!task) throw new AppError(404, 'Task not found');
    res.json({ task: toFrontTask(task) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/tasks', async (req: Request, res: Response) => {
  try {
    const data = createTaskSchema.parse(req.body);
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const maxOrder = await prisma.task.findFirst({
      where: { manuscriptId: req.params.manuscriptId, status: data.status || 'TODO' },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const task = await prisma.task.create({
      data: {
        manuscriptId: req.params.manuscriptId,
        title: data.title,
        description: data.description,
        type: data.type,
        priority: toDbPriority(data.priority),
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        estimatedHours: data.estimatedHours,
        assigneeId: data.assigneeId,
        sprintId: data.sprintId,
        chapterId: data.chapterId,
        tags: serializeTags(data.tags || data.labels),
        parentTaskId: data.parentTaskId,
        creatorId: req.user!.userId,
        order: (maxOrder?.order || 0) + 1
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    if (data.assigneeId) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          title: 'New task assigned',
          message: `You have been assigned to "${task.title}"`,
          type: 'TASK_ASSIGNED',
          actionUrl: `/manuscripts/${req.params.manuscriptId}/tasks`,
          entity: 'task',
          entityId: task.id
        }
      });
    }

    res.status(201).json({ task: toFrontTask(task) });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/manuscripts/:manuscriptId/tasks/:id', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const task = await getTask(req.params.manuscriptId, req.params.id);

    const { title, description, type, priority, status, dueDate, startDate, estimatedHours, tags, labels, assignee } = req.body;
    const data: any = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (type !== undefined) data.type = type;
    if (priority !== undefined) data.priority = toDbPriority(priority);
    if (status !== undefined) data.status = status;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
    if (estimatedHours !== undefined) data.estimatedHours = estimatedHours;
    if (tags !== undefined || labels !== undefined) data.tags = serializeTags(labels !== undefined ? labels : tags);
    if (assignee !== undefined) data.assigneeId = assignee?.id ?? null;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data,
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        creator: { select: { id: true, name: true } }
      }
    });

    res.json({ task: toFrontTask(updated) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/manuscripts/:manuscriptId/tasks/:id/status', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const { status } = req.body;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE', 'ARCHIVED'];
    if (!validStatuses.includes(status)) throw new AppError(400, 'Invalid status');

    const task = await getTask(req.params.manuscriptId, req.params.id);

    const updateData: any = { status };
    if (status === 'DONE') updateData.completedAt = new Date();

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: updateData
    });

    if (task.assigneeId && status === 'DONE') {
      await prisma.notification.create({
        data: {
          userId: task.creatorId,
          title: 'Task completed',
          message: `"${task.title}" has been completed`,
          type: 'TASK_COMPLETED',
          entity: 'task',
          entityId: task.id
        }
      });
    }

    res.json({ task: toFrontTask(updated) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/tasks/:id/assign', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const task = await getTask(req.params.manuscriptId, req.params.id);
    const { assigneeId } = req.body;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: { assigneeId }
    });

    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Task assigned',
          message: `You have been assigned to "${task.title}"`,
          type: 'TASK_ASSIGNED',
          entity: 'task',
          entityId: task.id
        }
      });
    }

    res.json({ task: toFrontTask(updated) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manuscripts/:manuscriptId/tasks/:id/comments', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const task = await getTask(req.params.manuscriptId, req.params.id);

    const comments = await prisma.taskComment.findMany({
      where: { taskId: task.id },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ comments });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/tasks/:id/comments', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const { content } = req.body;
    if (!content) throw new AppError(400, 'Content required');

    const task = await getTask(req.params.manuscriptId, req.params.id);

    const comment = await prisma.taskComment.create({
      data: {
        taskId: task.id,
        userId: req.user!.userId,
        content
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } }
    });

    if (task.assigneeId && task.assigneeId !== req.user!.userId) {
      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          title: 'New comment on task',
          message: `New comment on "${task.title}"`,
          type: 'TASK_COMMENT',
          entity: 'task',
          entityId: task.id
        }
      });
    }

    res.status(201).json({ comment });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/manuscripts/:manuscriptId/tasks/:id', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const task = await getTask(req.params.manuscriptId, req.params.id);

    await prisma.task.delete({ where: { id: task.id } });
    res.json({ message: 'Task deleted' });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manuscripts/:manuscriptId/sprints', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const sprints = await prisma.sprint.findMany({
      where: { manuscriptId: req.params.manuscriptId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { startDate: 'desc' }
    });

    res.json({ sprints: sprints.map(s => ({ ...s, isActive: s.status === 'ACTIVE' })) });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/sprints', async (req: Request, res: Response) => {
  try {
    const data = createSprintSchema.parse(req.body);
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'EDITOR_TEXTO', 'PUBLICADOR']);

    const sprint = await prisma.sprint.create({
      data: {
        manuscriptId: req.params.manuscriptId,
        name: data.name,
        goal: data.goal,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate)
      }
    });

    res.status(201).json({ sprint });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manuscripts/:manuscriptId/milestones', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const milestones = await prisma.milestone.findMany({
      where: { manuscriptId: req.params.manuscriptId },
      orderBy: { dueDate: 'asc' }
    });

    res.json({
      milestones: milestones.map(m => ({
        id: m.id,
        name: m.title,
        description: m.description,
        dueDate: m.dueDate,
        isCompleted: m.status === 'ACHIEVED',
        _count: { tasks: 0 }
      }))
    });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/manuscripts/:manuscriptId/milestones', async (req: Request, res: Response) => {
  try {
    const data = createMilestoneSchema.parse(req.body);
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId, ['ESCRITOR', 'EDITOR_TEXTO', 'PUBLICADOR']);

    const milestone = await prisma.milestone.create({
      data: {
        manuscriptId: req.params.manuscriptId,
        title: data.name,
        description: data.description,
        dueDate: new Date(data.dueDate),
        ...(data.type && { type: data.type })
      }
    });

    res.status(201).json({ milestone });
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation error', details: error.errors }); return; }
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/manuscripts/:manuscriptId/calendar', async (req: Request, res: Response) => {
  try {
    await requireManuscriptMember(req.params.manuscriptId, req.user!.userId);

    const { startDate, endDate } = req.query;
    const where: any = { manuscriptId: req.params.manuscriptId };

    const [tasks, milestones, chapters] = await Promise.all([
      prisma.task.findMany({
        where: { ...where, dueDate: { not: null } },
        select: { id: true, title: true, dueDate: true, status: true, priority: true, assignee: { select: { name: true } } }
      }),
      prisma.milestone.findMany({
        where,
        select: { id: true, title: true, dueDate: true, status: true, type: true }
      }),
      prisma.chapter.findMany({
        where: { manuscriptId: req.params.manuscriptId, scheduledAt: { not: null } },
        select: { id: true, title: true, scheduledAt: true, status: true }
      })
    ]);

    const events = [
      ...tasks.map(t => ({ id: t.id, title: t.title, date: t.dueDate, type: 'task', status: t.status, priority: t.priority, assignee: t.assignee?.name })),
      ...milestones.map(m => ({ id: m.id, title: m.title, date: m.dueDate, type: 'milestone', status: m.status, milestoneType: m.type })),
      ...chapters.map(c => ({ id: c.id, title: c.title, date: c.scheduledAt, type: 'chapter', status: c.status }))
    ];

    res.json({ events });
  } catch (error) {
    if (error instanceof AppError) { res.status(error.statusCode).json({ error: error.message }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;