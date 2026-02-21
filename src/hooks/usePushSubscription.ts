'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function usePushSubscription() {
  const { data: session, status } = useSession();
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (session?.user?.role !== 'conserje') return;
    if (hasAttempted.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    hasAttempted.current = true;

    async function registerAndSubscribe() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        await navigator.serviceWorker.ready;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('[push] Notification permission denied');
          return;
        }

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        const subJson = subscription.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });

        console.log('[push] Push subscription registered successfully');
      } catch (error) {
        console.error('[push] Error setting up push subscription:', error);
      }
    }

    registerAndSubscribe();
  }, [status, session]);
}
