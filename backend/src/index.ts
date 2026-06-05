import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { initSocketService } from './services/socket.service';
import router from './routes';
import { logger } from './config/logger';
import { prisma } from './config/database';
import { redis } from './config/redis';

dotenv.config();

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
initSocketService(io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(generalLimiter);

// Health check
app.get('/api/health', async (_req, res) => {
  const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisOk = await redis.ping().then(r => r === 'PONG').catch(() => false);
  res.json({ status: 'ok', db: dbOk, redis: redisOk, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', router);

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// Global error handler
app.use(errorMiddleware);

// Graceful shutdown
const PORT = parseInt(process.env.PORT || '5000', 10);
const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 BridgeChat server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    await prisma.$disconnect();
    await redis.quit();
    logger.info('Server closed');
    process.exit(0);
  });
  setTimeout(() => { logger.error('Forced shutdown'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => { logger.error('Uncaught Exception:', err); process.exit(1); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled Rejection:', reason); });

export { io };
