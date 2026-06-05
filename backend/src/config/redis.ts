import Redis from 'ioredis';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      logger.warn('Redis: max retries reached — running without cache');
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  reconnectOnError: () => false,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', () => {}); // Suppress error logs — Redis is optional

// Connect but don't crash if unavailable
redis.connect().catch(() => {
  logger.warn('⚠️  Redis unavailable — continuing without cache');
});

// ─── Helper utilities ────────────────────────────────────────
export const redisKeys = {
  userOnline: (userId: string) => `online:${userId}`,
  refreshToken: (userId: string) => `refresh:${userId}`,
  emailVerify: (userId: string) => `verify:${userId}`,
  passwordReset: (token: string) => `reset:${token}`,
  qrToken: (token: string) => `qr:${token}`,
  onlineUsers: () => 'online_users',
  rateLimitPrefix: (ip: string) => `rl:${ip}`,
  conversationTyping: (convId: string) => `typing:${convId}`,
  wifiUsers: (ssid: string) => `wifi:${ssid}`,
};

export const setOnline = async (userId: string, socketId: string) => {
  await redis.setex(redisKeys.userOnline(userId), 300, socketId);
  await redis.sadd(redisKeys.onlineUsers(), userId);
};

export const setOffline = async (userId: string) => {
  await redis.del(redisKeys.userOnline(userId));
  await redis.srem(redisKeys.onlineUsers(), userId);
};

export const getOnlineUsers = async (): Promise<string[]> => {
  return redis.smembers(redisKeys.onlineUsers());
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
  const val = await redis.get(redisKeys.userOnline(userId));
  return val !== null;
};

export const setRefreshToken = async (userId: string, token: string, ttlSeconds = 604800) => {
  await redis.setex(redisKeys.refreshToken(userId), ttlSeconds, token);
};

export const getRefreshToken = async (userId: string): Promise<string | null> => {
  return redis.get(redisKeys.refreshToken(userId));
};

export const deleteRefreshToken = async (userId: string) => {
  await redis.del(redisKeys.refreshToken(userId));
};

export const setQRToken = async (token: string, userId: string, ttlSeconds = 300) => {
  await redis.setex(redisKeys.qrToken(token), ttlSeconds, userId);
};

export const getQRToken = async (token: string): Promise<string | null> => {
  return redis.get(redisKeys.qrToken(token));
};

export default redis;
