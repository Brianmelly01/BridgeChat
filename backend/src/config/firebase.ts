import admin from 'firebase-admin';
import { logger } from './logger';

let firebaseApp: admin.app.App;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
    logger.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

export const getFirebaseAuth = () => admin.auth();
export const getFirebaseMessaging = () => admin.messaging();
export { admin };
