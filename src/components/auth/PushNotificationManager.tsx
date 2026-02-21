'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
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
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushSubscription();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [notifications, setNotifications] = useState<INotificationLog[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const isConserje = session?.user?.role === 'conserje';

  // Auto-open popover once when permission is still unknown (first visit)
  useEffect(() => {
    if (!isConserje) return;
    if (permission !== 'unknown') return;
    if (hasPrompted) return;

    const timer = setTimeout(() => {
      setPopoverOpen(true);
      setHasPrompted(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isConserje, permission, hasPrompted]);

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

  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open) fetchRecentNotifications();
  };

  const handleEnable = async () => {
    await subscribe();
  };

  const handleDisable = async () => {
    await unsubscribe();
  };

  const bellIcon = (() => {
    if (permission === 'granted') {
      return <BellRing className="h-5 w-5 text-green-600" />;
    }
    if (permission === 'denied') {
      return <BellOff className="h-5 w-5 text-red-500" />;
    }
    return <Bell className="h-5 w-5 text-amber-500" />;
  })();

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <button
          title="Notificaciones"
          className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {bellIcon}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="font-semibold text-sm">Notificaciones</h3>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link href="/notifications" onClick={() => setPopoverOpen(false)}>
              Ver todas →
            </Link>
          </Button>
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
                    {formatDistanceToNow(new Date(n.sentAt), {
                      addSuffix: true,
                      locale: es,
                    })}
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
            <Button
              size="sm"
              className="w-full"
              onClick={handleEnable}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Activar notificaciones
            </Button>
          )}
          {permission === 'granted' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
              onClick={handleDisable}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Desactivar notificaciones
            </Button>
          )}
          {permission === 'denied' && (
            <p className="text-xs text-muted-foreground text-center">
              Notificaciones bloqueadas por el navegador. Actívalas en la
              configuración del sitio.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
