// src/components/admin/dashboard/UserActivityStats.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats, BookingStats } from "@/components/admin/AdminDashboard";
import {
  ActivityIcon,
  CheckCircle2,
  RefreshCwIcon,
  Trash2Icon,
  PenToolIcon,
  UserCheckIcon,
  UserPlusIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area
} from "recharts";

interface UserActivityStatsProps {
  userStats: UserStats;
  bookingStats: BookingStats;
}

export default function UserActivityStats({ userStats, bookingStats }: UserActivityStatsProps) {
  // Create activity type data for pie chart
  const activityData = [
    { name: "Creación de Reservas", value: bookingStats.totalBookings - bookingStats.bookingModifications - bookingStats.bookingCancellations, color: "#3b82f6" },
    { name: "Modificaciones", value: bookingStats.bookingModifications, color: "#8b5cf6" },
    { name: "Cancelaciones", value: bookingStats.bookingCancellations, color: "#ef4444" },
    { name: "Confirmaciones", value: bookingStats.totalConfirmed, color: "#10b981" }
  ];

  // Create user vs booking activity data
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  // Simulated monthly activity data
  const activityTrendData = monthNames.map((month, index) => {
    return {
      month,
      bookings: bookingStats.bookingsByMonth[index].count,
      newUsers: userStats.newUsersTrend[index],
      totalActivity: bookingStats.bookingsByMonth[index].count * 1.5 + userStats.newUsersTrend[index] * 3
    };
  });

  const passwordResetData = userStats.passwordResetTrends || 
  // Fallback to simulated data if not provided from API
  [
    { month: "Ene", resets: 0 },
    { month: "Feb", resets: 1 },
    { month: "Mar", resets: 0 },
    { month: "Abr", resets: 2 },
    { month: "May", resets: 1 },
    { month: "Jun", resets: 0 },
    { month: "Jul", resets: 0 },
    { month: "Ago", resets: 0 },
    { month: "Sep", resets: 1 },
    { month: "Oct", resets: 0 },
    { month: "Nov", resets: 1 },
    { month: "Dic", resets: 1 }
  ];

  return (
    <div className="space-y-6">
      {/* Activity Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activities Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookingStats.totalBookings + userStats.totalUsers + bookingStats.totalConfirmed}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Registradas en el sistema</p>
          </CardContent>
        </Card>

        {/* Bookings Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actividad de Reservas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Creaciones, modificaciones y cancelaciones</p>
          </CardContent>
        </Card>

        {/* User Activity Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Actividad de Usuarios</CardTitle>
            <UserCheckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers + userStats.passwordResets}</div>
            <p className="text-xs text-muted-foreground mt-1">Registros y gestión de cuentas</p>
          </CardContent>
        </Card>

        {/* Password Resets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reestablecimientos</CardTitle>
            <RefreshCwIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.passwordResets}</div>
            <p className="text-xs text-muted-foreground mt-1">Solicitudes de contraseña</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Trends Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de Actividad</CardTitle>
            <CardDescription>Actividad mensual (reservas vs. usuarios)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={activityTrendData}>
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left" 
                    dataKey="bookings" 
                    name="Reservas" 
                    fill="#3b82f6" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="newUsers" 
                    name="Nuevos Usuarios" 
                    stroke="#ef4444"
                    strokeWidth={2} 
                  />
                  <Area 
                    yAxisId="left"
                    dataKey="totalActivity" 
                    name="Actividad Total" 
                    fill="#8b5cf6" 
                    fillOpacity={0.3}
                    stroke="#8b5cf6"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Actividad</CardTitle>
            <CardDescription>Tipos de acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {activityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} actividades`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Password Reset Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Reestablecimientos</CardTitle>
            <CardDescription>Solicitudes de reestablecimiento de contraseña por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={passwordResetData}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="resets" name="Reestablecimientos" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Booking Modifications Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modificaciones</CardTitle>
            <PenToolIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.bookingModifications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((bookingStats.bookingModifications / bookingStats.totalBookings) * 100).toFixed(1)}% de reservas editadas
            </p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Media por reserva:</span>
                <span className="font-medium">
                  {(bookingStats.bookingModifications / bookingStats.totalBookings).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Cancellations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancelaciones</CardTitle>
            <Trash2Icon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.bookingCancellations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((bookingStats.bookingCancellations / bookingStats.totalBookings) * 100).toFixed(1)}% de reservas canceladas
            </p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tasa de cancelación:</span>
                <span className="font-medium">
                  {(bookingStats.bookingCancellations / bookingStats.totalBookings).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New User Registrations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Registros</CardTitle>
            <UserPlusIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Nuevos usuarios este mes
            </p>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total acumulado:</span>
                <span className="font-medium">{userStats.totalUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad del Sistema</CardTitle>
          <CardDescription>Vista general del uso y actividad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-base">Actividad de Reservas</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span>Reservas totales:</span>
                  <span className="font-medium">{bookingStats.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span>Confirmaciones:</span>
                  <span className="font-medium">{bookingStats.totalConfirmed}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span>Modificaciones:</span>
                  <span className="font-medium">{bookingStats.bookingModifications}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span>Cancelaciones:</span>
                  <span className="font-medium">{bookingStats.bookingCancellations}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-base">Actividad de Usuarios</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span>Usuarios totales:</span>
                  <span className="font-medium">{userStats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span>Nuevos usuarios:</span>
                  <span className="font-medium">{userStats.newUsersThisMonth} este mes</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded">
                  <span>Cambios de contraseña:</span>
                  <span className="font-medium">{userStats.passwordResets}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                  <span>Sesiones por dispositivo:</span>
                  <span className="font-medium">
                    {userStats.sessionsByDevice.desktop}% Escritorio / 
                    {userStats.sessionsByDevice.mobile}% Móvil
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}