import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const generateSecureToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(token).digest('hex');
};
