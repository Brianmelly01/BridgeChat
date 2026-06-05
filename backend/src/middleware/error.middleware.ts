import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { logger } from '../config/logger';

export const errorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({ success: false, error: `${fields} already in use` });
    }
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Record not found' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, error: 'Invalid foreign key reference' });
    return res.status(400).json({ success: false, error: 'Database error', code: err.code });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ success: false, error: 'Invalid data provided' });
  }

  // Zod validation
  if (err instanceof ZodError) {
    const errors = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    return res.status(422).json({ success: false, error: 'Validation failed', errors });
  }

  // JWT errors
  if (err instanceof TokenExpiredError) return res.status(401).json({ success: false, error: 'Token expired' });
  if (err instanceof JsonWebTokenError) return res.status(401).json({ success: false, error: 'Invalid token' });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, error: 'File too large (max 100MB)' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, error: 'Unexpected file field' });

  // HTTP errors with status
  if (err.status || err.statusCode) {
    return res.status(err.status || err.statusCode).json({ success: false, error: err.message || 'An error occurred' });
  }

  // Default 500
  res.status(500).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
};
