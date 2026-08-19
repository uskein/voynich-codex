import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import authRoutes from './presentation/controllers/AuthController';
import userRoutes from './presentation/controllers/UserController';
import worldRoutes from './presentation/controllers/WorldController';
import manuscriptRoutes from './presentation/controllers/ManuscriptController';
import chapterRoutes from './presentation/controllers/ChapterController';
import taskRoutes from './presentation/controllers/TaskController';
import shareRoutes from './presentation/controllers/ShareController';
import bestiaryRoutes from './presentation/controllers/BestiaryController';
import characterRoutes from './presentation/controllers/CharacterController';
import timelineRoutes from './presentation/controllers/TimelineController';
import geographyRoutes from './presentation/controllers/GeographyController';
import nationRoutes from './presentation/controllers/NationController';
import lawRoutes from './presentation/controllers/LawController';
import magicRoutes from './presentation/controllers/MagicController';
import notificationRoutes from './presentation/controllers/NotificationController';
import statsRoutes from './presentation/controllers/StatsController';
import heraldryRoutes from './presentation/controllers/HeraldryController';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { setupQdrantCollection } from './infrastructure/vector/qdrant.service';

const app = express();
const PORT = process.env.PORT || 3000;

export const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || (15 * 60 * 1000).toString(), 10),
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '50', 10),
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'voynich-codex-backend', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/worlds', worldRoutes);
app.use('/api/manuscripts', manuscriptRoutes);
app.use('/api', chapterRoutes);
app.use('/api', taskRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/bestiary', bestiaryRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/events', timelineRoutes);
app.use('/api/geography', geographyRoutes);
app.use('/api/nations', nationRoutes);
app.use('/api/laws', lawRoutes);
app.use('/api/magic', magicRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/heraldry', heraldryRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Voynich Codex Backend running on port ${PORT}`);
  setupQdrantCollection().catch((err) => {
    console.error('Qdrant collection setup failed at boot:', err.message);
  });
});

export default app;





