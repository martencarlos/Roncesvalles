'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export type PushPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

export interface PushSubscriptionState {
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  // Call this after the user confirms they want notifications
  subscribe: () => Promise<void>;
  // Call this to unsubscribe
  unsubscribe: () => Promise<void>;
}

export function usePushSubscription(): PushSubscriptionState {
  const { data: session, status } = useSession();
  const isConserje = session?.user?.role === 'conserje';
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  const [permission, setPermission] = useState<PushPermissionState>('unknown');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const initialized = useRef(false);

  // On mount: read current permission state and check for existing subscription
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (!isConserje) return;
    if (!isSupported) {
      setPermission('unsupported');
      return;
    }
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;
        registrationRef.current = reg;

        const currentPermission = Notification.permission;
        if (currentPermission === 'granted') {
          setPermission('granted');
          const sub = await reg.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        } else if (currentPermission === 'denied') {
          setPermission('denied');
          setIsSubscribed(false);
        } else {
          // 'default' — not yet asked
          setPermission('unknown');
          setIsSubscribed(false);
        }
      } catch (err) {
        console.error('[push] Init error:', err);
      }
    }

    init();
  }, [status, isConserje, isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported || !registrationRef.current) return;
    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        setPermission('denied');
        setIsSubscribed(false);
        return;
      }
      setPermission('granted');

      let sub = await registrationRef.current.pushManager.getSubscription();
      if (!sub) {
        sub = await registrationRef.current.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subJson = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });

      setIsSubscribed(true);
    } catch (err) {
      console.error('[push] Subscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!registrationRef.current) return;
    setIsLoading(true);
    try {
      const sub = await registrationRef.current.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('[push] Unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
