// src/components/admin/AdminDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  LineChart,
  Info,
  Calendar,
  LayoutGrid,
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
        // In a real application, these would be API calls to endpoints that calculate the statistics
        // For demonstration purposes, we're simulating the data
        
        // Simulate API call for user statistics
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock user statistics
        const mockUserStats: UserStats = {
          totalUsers: 35,
          usersByRole: {
            user: 28,
            admin: 4,
            it_admin: 1,
            manager: 2
          },
          newUsersThisMonth: 3,
          newUsersTrend: [2, 5, 3, 4, 6, 3, 2, 1, 0, 3, 2, 3],
          passwordResets: 7,
          mostActiveUsers: [
            { name: "Juan Pérez", apartmentNumber: 15, actions: 24 },
            { name: "María García", apartmentNumber: 8, actions: 18 },
            { name: "Carlos Rodríguez", apartmentNumber: 22, actions: 15 },
            { name: "Admin General", actions: 42 }
          ],
          sessionsByDevice: {
            desktop: 65,
            mobile: 28,
            tablet: 7
          },
          geographicDistribution: [
            { location: "Madrid", count: 28 },
            { location: "Barcelona", count: 4 },
            { location: "Valencia", count: 2 },
            { location: "Sevilla", count: 1 }
          ]
        };
        
        // Mock booking statistics
        const mockBookingStats: BookingStats = {
          totalBookings: 287,
          totalConfirmed: 215,
          totalPending: 42,
          totalCancelled: 30,
          bookingsByMonth: [
            { month: "Ene", count: 18 },
            { month: "Feb", count: 22 },
            { month: "Mar", count: 28 },
            { month: "Abr", count: 32 },
            { month: "May", count: 35 },
            { month: "Jun", count: 42 },
            { month: "Jul", count: 38 },
            { month: "Ago", count: 30 },
            { month: "Sep", count: 25 },
            { month: "Oct", count: 12 },
            { month: "Nov", count: 10 },
            { month: "Dic", count: 15 }
          ],
          bookingsByType: {
            lunch: 168,
            dinner: 119
          },
          averageAttendees: 5.3,
          mostBookedApartments: [
            { apartmentNumber: 15, bookings: 24 },
            { apartmentNumber: 8, bookings: 22 },
            { apartmentNumber: 22, bookings: 20 },
            { apartmentNumber: 3, bookings: 18 },
            { apartmentNumber: 43, bookings: 17 }
          ],
          bookingModifications: 78,
          bookingCancellations: 30,
          mostUsedTables: [
            { tableNumber: 3, count: 85 },
            { tableNumber: 4, count: 72 },
            { tableNumber: 1, count: 65 },
            { tableNumber: 2, count: 58 },
            { tableNumber: 5, count: 52 },
            { tableNumber: 6, count: 45 }
          ],
          additionalServices: {
            prepararFuego: 124,
            reservaHorno: 87,
            reservaBrasa: 103
          }
        };
        
        setUserStats(mockUserStats);
        setBookingStats(mockBookingStats);
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}

          <Card className="col-span-1 md:col-span-2 lg:col-span-4 animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        </div>
      ) : (
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
            {userStats && bookingStats && (
              <SystemSummary userStats={userStats} bookingStats={bookingStats} />
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            {userStats && <UserStatistics stats={userStats} />}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            {bookingStats && <BookingStatistics stats={bookingStats} />}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            {userStats && bookingStats && (
              <UserActivityStats userStats={userStats} bookingStats={bookingStats} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}