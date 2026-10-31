import { logger } from '@/lib/logger';
import webPush from 'web-push';
import { db } from '@/lib/db';
import { SITE_CONFIG } from '@/lib/site-config';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || SITE_CONFIG.emails.pushSubject;

let isConfigured = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isConfigured = true;
  } catch (err) {
    logger.warn('[PUSH_NOTIFICATIONS_CONFIG_WARNING]', { detail: String(err) });
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string; [key: string]: string } },
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!isConfigured) return false;

  try {
    const formattedPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      data: {
        url: payload.url || '/',
        ...payload.data,
      },
    });

    await webPush.sendNotification(subscription as webPush.PushSubscription, formattedPayload);
    return true;
  } catch (error: unknown) {
    const errObj = error as { statusCode?: number } | null;
    if (errObj?.statusCode === 404 || errObj?.statusCode === 410) {
      try {
        await db.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
      } catch {}
    }
    return false;
  }
}

export async function broadcastPushNotification(payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  const subscriptions = await db.pushSubscription.findMany();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    if (!sub.keys || typeof sub.keys !== 'object' || Array.isArray(sub.keys)) continue;
    const keys = sub.keys as { p256dh: string; auth: string; [key: string]: string };
    if (!keys.p256dh || !keys.auth) continue;
    const success = await sendPushNotification(
      { endpoint: sub.endpoint, keys },
      payload
    );
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
