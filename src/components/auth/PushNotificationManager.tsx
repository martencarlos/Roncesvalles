'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, BellRing, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { INotificationLog } from '@/models/NotificationLog';

export default function PushNotificationManager() {
  const { data: session } = useSession();
  const { permission, isLoading, subscribe, unsubscribe } = usePushSubscription();

  const [open, setOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [notifications, setNotifications] = useState<INotificationLog[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const isConserje = session?.user?.role === 'conserje';

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Auto-open once on first visit when permission unknown and user hasn't opted out
  useEffect(() => {
    if (!isConserje) return;
    if (permission !== 'unknown') return;
    if (hasPrompted) return;
    if (localStorage.getItem('push-opted-out') === 'true') return;
    const timer = setTimeout(() => {
      setOpen(true);
      setHasPrompted(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isConserje, permission, hasPrompted]);

  // Close mobile panel when clicking outside
  useEffect(() => {
    if (!isMobile || !open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobile, open]);

  if (!isConserje) return null;
  if (permission === 'unsupported') return null;

  const fetchRecentNotifications = async () => {
    setNotifLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=15');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } finally {
      setNotifLoading(false);
    }
  };

  const handleOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) fetchRecentNotifications();
  };

  const bellIcon = (() => {
    if (permission === 'granted') return <BellRing className="h-5 w-5 text-green-600" />;
    if (permission === 'denied') return <BellOff className="h-5 w-5 text-red-500" />;
    return <Bell className="h-5 w-5 text-amber-500" />;
  })();

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-semibold text-sm">Notificaciones</h3>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link href="/notifications" onClick={() => setOpen(false)}>
              Ver todas →
            </Link>
          </Button>
          {isMobile && (
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <Separator />

      {/* Notification list */}
      <div className="max-h-72 overflow-y-auto">
        {notifLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">
            Sin notificaciones recientes
          </p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className="px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatDistanceToNow(new Date(n.sentAt), { addSuffix: true, locale: es })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
            </div>
          ))
        )}
      </div>

      <Separator />

      {/* Footer: subscription toggle */}
      <div className="px-4 py-3">
        {permission === 'unknown' && (
          <Button size="sm" className="w-full" onClick={() => subscribe().then(() => setOpen(false))} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Activar notificaciones
          </Button>
        )}
        {permission === 'granted' && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => unsubscribe().then(() => setOpen(false))}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Desactivar notificaciones
          </Button>
        )}
        {permission === 'denied' && (
          <p className="text-xs text-muted-foreground text-center">
            Notificaciones bloqueadas por el navegador. Actívalas en la configuración del sitio.
          </p>
        )}
      </div>
    </>
  );

  const triggerButton = (
    <button
      title="Notificaciones"
      className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={isMobile ? () => handleOpen(!open) : undefined}
    >
      {bellIcon}
    </button>
  );

  // Mobile: fixed full-width overlay, no Radix portal involved
  if (isMobile) {
    return (
      <div>
        {triggerButton}
        {open && (
          <div
            ref={panelRef}
            className="fixed top-14 left-0 right-0 z-50 bg-popover border-b shadow-md"
          >
            {panelContent}
          </div>
        )}
      </div>
    );
  }

  // Desktop: normal Radix Popover
  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        {panelContent}
      </PopoverContent>
    </Popover>
  );
}
