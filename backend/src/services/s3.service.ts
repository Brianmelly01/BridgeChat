import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from '../config/logger';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const CDN_URL = process.env.CLOUDFRONT_URL;

export const uploadFile = async (buffer: Buffer, key: string, mimeType: string): Promise<string> => {
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'max-age=31536000',
    }));
    return getPublicUrl(key);
  } catch (err) {
    logger.error('S3 upload error:', err);
    throw new Error('File upload failed');
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    logger.error('S3 delete error:', err);
  }
};

export const getPresignedUploadUrl = async (key: string, mimeType: string, expiresIn = 3600): Promise<string> => {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mimeType });
  return getSignedUrl(s3, command, { expiresIn });
};

export const getPresignedDownloadUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
};

export const getPublicUrl = (key: string): string => {
  if (CDN_URL) return `${CDN_URL}/${key}`;
  return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const generateUniqueKey = (folder: string, originalName: string): string => {
  const ext = path.extname(originalName);
  return `${folder}/${uuidv4()}${ext}`;
};

export const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'documents';
};
