'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useSession } from 'next-auth/react';

export default function PushNotificationManager() {
  const { data: session } = useSession();
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Only relevant for conserje
  const isConserje = session?.user?.role === 'conserje';

  // Auto-open dialog once when permission is still unknown (first visit)
  useEffect(() => {
    if (!isConserje) return;
    if (permission !== 'unknown') return;
    if (hasPrompted) return;

    // Small delay so the page finishes loading before showing the dialog
    const timer = setTimeout(() => {
      setDialogOpen(true);
      setHasPrompted(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isConserje, permission, hasPrompted]);

  if (!isConserje) return null;
  if (permission === 'unsupported') return null;

  // ── Status indicator ────────────────────────────────────────────────────────

  const indicator = (() => {
    if (permission === 'unknown') {
      return (
        <button
          onClick={() => setDialogOpen(true)}
          title="Configurar notificaciones"
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <Bell className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Notificaciones desactivadas</span>
        </button>
      );
    }

    if (permission === 'denied') {
      return (
        <div
          title="Notificaciones bloqueadas por el navegador. Actívalas en la configuración del sitio."
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-300"
        >
          <BellOff className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Notificaciones bloqueadas</span>
        </div>
      );
    }

    if (permission === 'granted') {
      return (
        <button
          onClick={() => setDialogOpen(true)}
          title="Notificaciones activas. Haz clic para gestionar."
          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-300 hover:bg-green-100 transition-colors cursor-pointer"
        >
          <BellRing className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline">Notificaciones activas</span>
        </button>
      );
    }
  })();

  // ── Dialog ──────────────────────────────────────────────────────────────────

  const handleEnable = async () => {
    await subscribe();
    setDialogOpen(false);
  };

  const handleDisable = async () => {
    await unsubscribe();
    setDialogOpen(false);
  };

  const dialogContent = (() => {
    if (permission === 'denied') {
      return {
        title: 'Notificaciones bloqueadas',
        description:
          'El navegador ha bloqueado las notificaciones para este sitio. Para activarlas, ve a la configuración de tu navegador → Privacidad y seguridad → Configuración del sitio → Notificaciones y permite este sitio.',
        actions: (
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cerrar
          </Button>
        ),
      };
    }

    if (permission === 'granted') {
      return {
        title: 'Notificaciones activas',
        description:
          'Recibirás una notificación cada vez que se cree o modifique una reserva con servicio de conserjería. ¿Quieres desactivarlas?',
        actions: (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Mantener activas
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Desactivar notificaciones
            </Button>
          </div>
        ),
      };
    }

    return {
      title: 'Activar notificaciones',
      description:
        'Recibirás una notificación del navegador cada vez que se cree o modifique una reserva que requiera servicio de conserjería. ¿Quieres activarlas?',
      actions: (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Ahora no
          </Button>
          <Button onClick={handleEnable} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Activar notificaciones
          </Button>
        </div>
      ),
    };
  })();

  return (
    <>
      {indicator}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {dialogContent.title}
            </DialogTitle>
            <DialogDescription>{dialogContent.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>{dialogContent.actions}</DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
