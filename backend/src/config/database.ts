import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global { var __prisma: PrismaClient | undefined; }

export const prisma: PrismaClient = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }]
    : [{ emit: 'event', level: 'error' }],
});

if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 500) logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
  });
}

(prisma as any).$on('error', (e: any) => logger.error('Prisma error:', e));

if (process.env.NODE_ENV !== 'production') globalThis.__prisma = prisma;

export default prisma;
