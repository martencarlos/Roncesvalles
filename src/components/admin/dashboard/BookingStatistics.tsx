// src/components/admin/dashboard/BookingStatistics.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStats } from "@/components/admin/AdminDashboard";
import {
  CalendarDays,
  CheckCircle2,
  ClockIcon,
  AlertCircle,
  UtensilsCrossed,
  Users,
  Home
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
  Line
} from "recharts";

interface BookingStatisticsProps {
  stats: BookingStats;
}

export default function BookingStatistics({ stats }: BookingStatisticsProps) {
  // Colors for charts
  const COLORS = {
    lunch: "#f97316", // orange
    dinner: "#4f46e5", // indigo
    confirmed: "#10b981", // green
    pending: "#f59e0b", // amber
    cancelled: "#ef4444", // red
    default: "#3b82f6", // blue
  };

  // Prepare booking type data for pie chart
  const bookingTypeData = [
    { name: "Comida", value: stats.bookingsByType.lunch, color: COLORS.lunch },
    { name: "Cena", value: stats.bookingsByType.dinner, color: COLORS.dinner }
  ];

  // Prepare booking status data for pie chart
  const bookingStatusData = [
    { name: "Confirmadas", value: stats.totalConfirmed, color: COLORS.confirmed },
    { name: "Pendientes", value: stats.totalPending, color: COLORS.pending },
    { name: "Canceladas", value: stats.totalCancelled, color: COLORS.cancelled }
  ];

  // Prepare data for services usage
  const servicesData = [
    { name: "Preparación de Fuego", value: stats.additionalServices.prepararFuego, color: "#f97316" },
    { name: "Reserva de Horno", value: stats.additionalServices.reservaHorno, color: "#8b5cf6" }
  ];

  // Prepare data for most used tables
  const tablesData = stats.mostUsedTables;

  return (
    <div className="space-y-6">
      {/* Booking Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Registradas en el sistema</p>
          </CardContent>
        </Card>

        {/* Confirmed Bookings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas Confirmadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConfirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.totalConfirmed / stats.totalBookings) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        {/* Pending Confirmations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Confirmar</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.totalPending / stats.totalBookings) * 100).toFixed(1)}% del total
            </p>
          </CardContent>
        </Card>

        {/* Cancellations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancelaciones</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCancelled}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de cancelación: {((stats.totalCancelled / stats.totalBookings) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Reservas por Mes</CardTitle>
            <CardDescription>Evolución anual de reservas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.bookingsByMonth}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Reservas" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Reservas</CardTitle>
            <CardDescription>Distribución entre comidas y cenas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {bookingTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} reservas`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Reservas</CardTitle>
            <CardDescription>Distribución por estado</CardDescription>
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

        {/* Most Used Tables */}
        <Card>
          <CardHeader>
            <CardTitle>Uso de Mesas</CardTitle>
            <CardDescription>Mesas más reservadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tablesData}>
                  <XAxis dataKey="tableNumber" label={{ value: 'Número de Mesa', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} reservas`, 'Cantidad']} />
                  <Bar dataKey="count" name="Reservas" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Additional Services Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Uso de Servicios Adicionales</CardTitle>
            <CardDescription>Servicios más solicitados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip formatter={(value) => [`${value} reservas`, 'Cantidad']} />
                  <Bar dataKey="value" name="Reservas">
                    {servicesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Active Apartments */}
      <Card>
        <CardHeader>
          <CardTitle>Apartamentos Más Activos</CardTitle>
          <CardDescription>Apartamentos con mayor número de reservas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.mostBookedApartments.map((apt, index) => (
              <div key={index} className="flex flex-col items-center p-4 border rounded-md">
                <Home className="h-6 w-6 text-primary mb-2" />
                <span className="text-lg font-bold">#{apt.apartmentNumber}</span>
                <span className="text-sm text-muted-foreground">{apt.bookings} reservas</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Booking Modifications Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Media de Asistentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendees.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Por reserva</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modificaciones</CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookingModifications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.bookingModifications / stats.totalBookings) * 100).toFixed(1)}% de las reservas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancelaciones</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookingCancellations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.bookingCancellations / stats.totalBookings) * 100).toFixed(1)}% de las reservas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}