import admin from 'firebase-admin';
import { logger } from './logger';

let firebaseApp: admin.app.App;

export function initializeFirebase(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!process.env.FIREBASE_PROJECT_ID || !privateKey || !process.env.FIREBASE_CLIENT_EMAIL) {
      logger.warn('⚠️  Firebase env vars missing — Firebase auth disabled');
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });

    logger.info('✅ Firebase Admin SDK initialized');
    return firebaseApp;
  } catch (error) {
    logger.warn('⚠️  Firebase initialization failed — Firebase auth disabled:', error);
    return null;
  }
}

export const getFirebaseAuth = () => admin.auth();
export const getFirebaseMessaging = () => admin.messaging();
export { admin };
