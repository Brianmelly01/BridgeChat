import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

// ── Validate critical env vars early ──────────────────────────────────────────
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnv = requiredEnv.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`❌ Missing required env vars: ${missingEnv.join(', ')}`);
  console.error('Server cannot start. Set these in Railway Variables.');
  process.exit(1);
}

console.log('✅ Env vars OK');
console.log('🔌 Loading modules...');

import { generalLimiter } from './middleware/rateLimit.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';

// Load router AFTER env validation to catch import-time crashes
let router: express.Router;
let initSocketService: (io: SocketServer) => void;

try {
  router = require('./routes').default;
  console.log('✅ Routes loaded');
} catch (err) {
  console.error('❌ Failed to load routes:', err);
  process.exit(1);
}

try {
  initSocketService = require('./services/socket.service').initSocketService;
  console.log('✅ Socket service loaded');
} catch (err) {
  console.warn('⚠️  Socket service failed to load (continuing without it):', err);
  initSocketService = () => {}; // no-op fallback
}

const app = express();
const httpServer = http.createServer(app);

// Socket.IO
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

try { initSocketService(io); } catch (e) { console.warn('⚠️  Socket init error:', e); }

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(generalLimiter);

// Health check — always 200 so Railway healthcheck passes
app.get('/api/health', async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisOk = await redis.ping().then((r: string) => r === 'PONG').catch(() => false);
  res.status(200).json({ status: 'ok', db: dbOk, redis: redisOk, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', router);

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler
app.use(errorMiddleware);

// Start server
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 BridgeChat API running on ${HOST}:${PORT}`);
  logger.info(`🚀 BridgeChat server running on ${HOST}:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  logger.error('Unhandled Rejection:', reason);
});

export { io };
