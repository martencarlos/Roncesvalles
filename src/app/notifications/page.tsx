'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bell } from 'lucide-react';
import Pagination from '@/components/Pagination';
import { INotificationLog } from '@/models/NotificationLog';
import { format, formatDistanceToNow } from 'date-fns';
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
      } catch (err: any) {
        setError(err.message);
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
    <div className="max-w-4xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Historial de Notificaciones</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Reservas
            </Link>
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="px-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notificaciones recibidas
          </CardTitle>
          <CardDescription className="text-sm">
            Historial de notificaciones de conserjería enviadas al conserje
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          {loading && currentPage === 1 ? (
            <div className="flex justify-center p-6 sm:p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length > 0 ? (
            <>
              <div>
                {notifications.map((n, idx) => (
                  <div key={n._id}>
                    <div className="py-4 flex gap-3 items-start">
                      <div className="p-2 rounded-full bg-blue-50 self-center shrink-0">
                        <Bell className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-sm text-muted-foreground">{n.body}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="hidden sm:inline">
                            {format(new Date(n.sentAt), "d MMM yyyy · HH:mm", { locale: es })}
                          </span>
                          <span className="sm:hidden">
                            {format(new Date(n.sentAt), "d MMM · HH:mm", { locale: es })}
                          </span>
                        </p>
                      </div>
                    </div>
                    {idx < notifications.length - 1 && <Separator />}
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6">
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
            <p className="text-muted-foreground py-6 sm:py-8 text-center">
              No hay notificaciones aún.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
