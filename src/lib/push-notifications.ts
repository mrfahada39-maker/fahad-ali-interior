import webPush from 'web-push';
import { db } from '@/lib/db';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'UUxI4Owt1qGEkJMYvlKblMVvnpHkxvK6MvYc3k1iA68';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@fahadali.com';

let isConfigured = false;
try {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  isConfigured = true;
} catch (err) {
  console.warn('[PUSH_NOTIFICATIONS_CONFIG_WARNING]', err);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, any>;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: any },
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

    await webPush.sendNotification(subscription as any, formattedPayload);
    return true;
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      try {
        await db.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint },
        });
      } catch (_) {}
    }
    return false;
  }
}

export async function broadcastPushNotification(payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
  const subscriptions = await db.pushSubscription.findMany();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const success = await sendPushNotification(
      { endpoint: sub.endpoint, keys: sub.keys },
      payload
    );
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
