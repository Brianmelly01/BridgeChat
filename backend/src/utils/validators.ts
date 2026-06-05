import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(2).max(50),
}).refine(data => data.email || data.phone, { message: 'Email or phone number is required' });

export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(1),
}).refine(data => data.email || data.phone, { message: 'Email or phone is required' });

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isPrivate: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().max(10000).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'VOICE_NOTE', 'EMOJI']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
  forwardedFromId: z.string().uuid().optional(),
});

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
  memberIds: z.array(z.string().uuid()).min(1).max(256),
});

export const createConversationSchema = z.object({
  type: z.enum(['DIRECT', 'GROUP']),
  participantIds: z.array(z.string().uuid()).min(1),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const socialLinksSchema = z.array(z.object({
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'TWITTER', 'SNAPCHAT', 'LINKEDIN', 'WEBSITE']),
  url: z.string().url(),
}));

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const reportSchema = z.object({
  reason: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
});
