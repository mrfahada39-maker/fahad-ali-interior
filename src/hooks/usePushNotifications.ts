'use client';

import { useState, useEffect, useCallback } from 'react';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface UsePushNotificationsReturn {
  permission: PushPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const raw = window.atob(base64);
  const outputArray = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; ++i) {
    outputArray[i] = raw.charCodeAt(i);
  }

  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PushPermission);

    navigator.serviceWorker.register('/sw-push.js').then(async (reg) => {
      setRegistration(reg);

      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!registration) return;

    setIsLoading(true);

    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('Missing VAPID key');

      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);

      if (perm !== 'granted') return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const { apiFetchJson } = await import('@/lib/api-client');

      await apiFetchJson('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      // 🔥 SEND VAPID KEY TO SERVICE WORKER
      registration.active?.postMessage({
        type: 'SET_VAPID_KEY',
        key: vapidKey,
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [registration]);

  const unsubscribe = useCallback(async () => {
    if (!registration) return;

    setIsLoading(true);

    try {
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [registration]);

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}
