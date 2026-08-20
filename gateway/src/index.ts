import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': ["'self'", 'data:', 'https:']
    }
  }
}));

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

app.use(morgan('combined'));

app.get('/health', async (_req, res) => {
  try {
    const backendHealth = await fetch(`${BACKEND_URL}/api/health`);
    const backendOk = backendHealth.ok;
    res.json({
      status: backendOk ? 'ok' : 'degraded',
      service: 'gateway',
      backend: backendOk ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString()
    });
  } catch {
    res.json({
      status: 'degraded',
      service: 'gateway',
      backend: 'unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, _res) => {
    console.log(`[Gateway] ${req.method} ${req.url} -> ${BACKEND_URL}`);
  },
  onError: (err, _req, res) => {
    console.error('[Gateway] Proxy error:', err.message);
    (res as express.Response).status(502).json({ error: 'Backend service unavailable' });
  }
}));

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log(`[Gateway] Serving frontend from ${frontendDist}`);
}

app.listen(PORT, () => {
  console.log(`[Gateway] Running on port ${PORT}`);
  console.log(`[Gateway] Proxying to backend: ${BACKEND_URL}`);
  console.log(`[Gateway] CORS allowed: ${FRONTEND_URL}`);
});

export default app;
