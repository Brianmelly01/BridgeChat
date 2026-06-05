import rateLimit from 'express-rate-limit';

const createLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
  });

export const generalLimiter = createLimiter(15 * 60 * 1000, 500, 'Too many requests, please try again later');
export const authLimiter = createLimiter(15 * 60 * 1000, 20, 'Too many authentication attempts, please try again in 15 minutes');
export const messageLimiter = createLimiter(60 * 1000, 120, 'Message rate limit exceeded');
export const uploadLimiter = createLimiter(60 * 60 * 1000, 50, 'Upload limit exceeded, try again in an hour');
export const discoveryLimiter = createLimiter(60 * 1000, 30, 'Discovery rate limit exceeded');
