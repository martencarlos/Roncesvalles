// src/components/admin/dashboard/SystemSummary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats, BookingStats } from "@/components/admin/AdminDashboard";
import {
  Users,
  CalendarDays,
  CheckCircle2,
  UtensilsCrossed,
  UserPlus,
  Clock,
  CalendarCheck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface SystemSummaryProps {
  userStats: UserStats;
  bookingStats: BookingStats;
}

export default function SystemSummary({ userStats, bookingStats }: SystemSummaryProps) {
  // Calculate growth percentage for bookings (comparing last two months)
  const lastMonthBookings = bookingStats.bookingsByMonth[bookingStats.bookingsByMonth.length - 1].count;
  const previousMonthBookings = bookingStats.bookingsByMonth[bookingStats.bookingsByMonth.length - 2].count;
  const bookingGrowth = previousMonthBookings > 0 
    ? ((lastMonthBookings - previousMonthBookings) / previousMonthBookings) * 100 
    : 0;

  // Prepare data for Role distribution pie chart
  const roleData = [
    { name: "Usuarios", value: userStats.usersByRole.user, color: "#3b82f6" },
    { name: "Administradores", value: userStats.usersByRole.admin, color: "#8b5cf6" },
    { name: "Admin IT", value: userStats.usersByRole.it_admin, color: "#ef4444" },
    { name: "Conserjes", value: userStats.usersByRole.manager, color: "#10b981" },
  ];

  // Prepare data for Booking status pie chart
  const bookingStatusData = [
    { name: "Confirmadas", value: bookingStats.totalConfirmed, color: "#10b981" },
    { name: "Pendientes", value: bookingStats.totalPending, color: "#f59e0b" },
    { name: "Canceladas", value: bookingStats.totalCancelled, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* System Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <UserPlus className="h-3 w-3 mr-1 text-green-500" />
              {userStats.newUsersThisMonth} nuevos este mes
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              {bookingGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
              )}
              {Math.abs(bookingGrowth).toFixed(1)}% respecto al mes anterior
            </p>
          </CardContent>
        </Card>

        {/* Confirmed Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas Confirmadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.totalConfirmed}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <CalendarCheck className="h-3 w-3 mr-1 text-blue-500" />
              {((bookingStats.totalConfirmed / bookingStats.totalBookings) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        {/* Average Attendees Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Media de Asistentes</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.averageAttendees.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <Clock className="h-3 w-3 mr-1 text-amber-500" />
              Por reserva
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Reservas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingStats.bookingsByMonth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Reservas" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Roles Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} usuarios`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} reservas`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}