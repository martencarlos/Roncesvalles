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
  // New login activity data
  loginActivity: {
    totalLogins: number;
    loginsByUser: { 
      userId: string; 
      name: string; 
      apartmentNumber?: number; 
      count: number 
    }[];
    recentLogins: {
      id: string;
      userId: string;
      userName: string;
      apartmentNumber?: number;
      timestamp: string;
      deviceType: "desktop" | "mobile" | "tablet";
      browser: string;
      location: string;
      ipAddress: string;
    }[];
    loginsByMonth: { month: string; count: number }[];
    loginsByDevice: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
  };
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
      <div className="flex flex-col items-center justify-center p-4 sm:p-8 h-[70vh]">
        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-spin mb-3 sm:mb-4" />
        <p className="text-base sm:text-lg font-medium text-center">Cargando datos del panel</p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 text-center">Esto puede tomar unos momentos</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Last updated timestamp */}
      <div className="flex justify-end text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
        <div className="flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span className="text-xs">
            Actualizado: {format(lastUpdated, "d MMM, HH:mm", { locale: es })}
          </span>
        </div>
      </div>

      {userStats && bookingStats ? (
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="mb-4 sm:mb-6 w-full justify-start overflow-x-auto scrollbar-hide flex-nowrap pb-1">
            <TabsTrigger value="system" className="gap-1 min-w-fit">
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-sm">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1 min-w-fit">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-sm">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1 min-w-fit">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-sm">Reservas</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1 min-w-fit">
              <LineChart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline text-sm">Actividad</span>
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
          <AlertDescription className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            No se pudieron cargar los datos del panel. Inténtelo más tarde.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}