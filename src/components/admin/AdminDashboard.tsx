// src/components/admin/AdminDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  LineChart,
  Info,
  Calendar,
  LayoutGrid,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Import chart components
import UserStatistics from "@/components/admin/dashboard/UserStatistics";
import BookingStatistics from "@/components/admin/dashboard/BookingStatistics";
import UserActivityStats from "@/components/admin/dashboard/UserActivityStats";
import SystemSummary from "@/components/admin/dashboard/SystemSummary";

// Dashboard types
export interface UserStats {
  totalUsers: number;
  usersByRole: {
    user: number;
    admin: number;
    it_admin: number;
    manager: number;
  };
  newUsersThisMonth: number;
  newUsersTrend: number[];
  passwordResets: number;
  passwordResetTrends?: {
    month: string;
    resets: number;
  }[];
  mostActiveUsers: {
    name: string;
    apartmentNumber?: number;
    actions: number;
  }[];
  // Additional user activity statistics
  sessionsByDevice: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geographicDistribution: {
    location: string;
    count: number;
  }[];
}

export interface BookingStats {
  totalBookings: number;
  totalConfirmed: number;
  totalPending: number;
  totalCancelled: number;
  bookingsByMonth: {
    month: string;
    count: number;
  }[];
  bookingsByType: {
    lunch: number;
    dinner: number;
  };
  averageAttendees: number;
  mostBookedApartments: {
    apartmentNumber: number;
    bookings: number;
  }[];
  // Additional booking statistics
  bookingModifications: number;
  bookingCancellations: number;
  mostUsedTables: {
    tableNumber: number;
    count: number;
  }[];
  additionalServices: {
    prepararFuego: number;
    reservaHorno: number;
    reservaBrasa: number;
  };
}

export default function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch('/api/dashboard');
        
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("No autorizado para acceder a estos datos");
          }
          throw new Error("Error al cargar los datos del dashboard");
        }
        
        const data = await res.json();
        
        setUserStats(data.userStats);
        setBookingStats(data.bookingStats);
        setLastUpdated(new Date());
        
      } catch (err: any) {
        setError(err.message || "Error al cargar las estadísticas");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Cargando datos del panel de estadísticas...</p>
        <p className="text-sm text-muted-foreground mt-2">Esto puede tomar unos momentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Last updated timestamp */}
      <div className="flex justify-end text-sm text-muted-foreground mb-2">
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          Actualizado: {format(lastUpdated, "d MMM, yyyy - HH:mm", { locale: es })}
        </div>
      </div>

      {userStats && bookingStats ? (
        <Tabs defaultValue="system">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="system" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span>Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Reservas</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <LineChart className="h-4 w-4" />
              <span>Actividad</span>
            </TabsTrigger>
          </TabsList>

          {/* System Summary Tab */}
          <TabsContent value="system">
            <SystemSummary userStats={userStats} bookingStats={bookingStats} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <UserStatistics stats={userStats} />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <BookingStatistics stats={bookingStats} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <UserActivityStats userStats={userStats} bookingStats={bookingStats} />
          </TabsContent>
        </Tabs>
      ) : (
        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertDescription className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            No se pudieron cargar los datos del panel. Por favor, inténtelo de nuevo más tarde.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}