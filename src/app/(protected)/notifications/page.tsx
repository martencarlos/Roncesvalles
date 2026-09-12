'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Bell } from 'lucide-react';
import { PageContainer, PageHeader } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import Pagination from '@/components/Pagination';
import { INotificationLog } from '@/models/NotificationLog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<INotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/notifications?page=${currentPage}&limit=${itemsPerPage}`);
        if (!res.ok) throw new Error('Error al obtener notificaciones');
        const data = await res.json();
        setNotifications(data.notifications);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Historial de Notificaciones"
        description="Historial de notificaciones de conserjería enviadas al conserje"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4" />
              Volver a Reservas
            </Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Notificaciones recibidas</h2>
        </div>

        {loading && currentPage === 1 ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-4">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <>
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div key={n._id} className="flex items-start gap-3 px-4 py-4">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-info/10 text-info">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <StatusBadge tone="info" className="shrink-0">
                        Enviada
                      </StatusBadge>
                      <time
                        dateTime={new Date(n.sentAt).toISOString()}
                        className="ml-auto shrink-0 whitespace-nowrap text-xs text-muted-foreground"
                      >
                        <span className="hidden sm:inline">
                          {format(new Date(n.sentAt), "d MMM yyyy · HH:mm", { locale: es })}
                        </span>
                        <span className="sm:hidden">
                          {format(new Date(n.sentAt), "d MMM · HH:mm", { locale: es })}
                        </span>
                      </time>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="border-t border-border p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={Bell}
              title="No hay notificaciones aún"
              description="Las notificaciones enviadas al conserje aparecerán aquí."
              className="border-0 bg-transparent"
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
