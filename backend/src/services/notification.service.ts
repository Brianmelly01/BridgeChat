import { prisma } from '../config/database';
import { getFirebaseMessaging, initializeFirebase } from '../config/firebase';
import { logger } from '../config/logger';

initializeFirebase();

export const createAndSendNotification = async (
  userId: string,
  type: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> => {
  try {
    await prisma.notification.create({ data: { userId, type, title, body, data } });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) {
      await sendFCMNotification(user.fcmToken, title, body, { ...data, type });
    }
  } catch (err) {
    logger.error('Notification error:', err);
  }
};

export const sendFCMNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> => {
  try {
    const messaging = getFirebaseMessaging();
    await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: { priority: 'high', notification: { channelId: 'bridgechat_messages', priority: 'high', sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1, contentAvailable: true } } },
    });
  } catch (err) {
    logger.error('FCM send error:', err);
  }
};

export const sendBulkNotifications = async (
  userIds: string[],
  type: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> => {
  await Promise.allSettled(userIds.map(uid => createAndSendNotification(uid, type, title, body, data)));
};
