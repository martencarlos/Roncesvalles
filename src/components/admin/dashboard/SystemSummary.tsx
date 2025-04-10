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
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from "recharts";

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
    { name: "Admins", value: userStats.usersByRole.admin, color: "#8b5cf6" },
    { name: "IT", value: userStats.usersByRole.it_admin, color: "#ef4444" },
  ];

  // Prepare data for Booking status pie chart
  const bookingStatusData = [
    { name: "Confirmadas", value: bookingStats.totalConfirmed, color: "#10b981" },
    { name: "Pendientes", value: bookingStats.totalPending, color: "#f59e0b" },
    { name: "Canceladas", value: bookingStats.totalCancelled, color: "#ef4444" },
  ];

  // Custom label renderer for pie charts
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="#000000" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="10"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* System Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {/* Total Users Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center">
              <UserPlus className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-green-500" />
              {userStats.newUsersThisMonth} nuevos
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Reservas</CardTitle>
            <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{bookingStats.totalBookings}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center">
              {bookingGrowth >= 0 ? (
                <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-green-500" />
              ) : (
                <ArrowDownRight className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-red-500" />
              )}
              {Math.abs(bookingGrowth).toFixed(1)}% vs mes ant.
            </p>
          </CardContent>
        </Card>

        {/* Confirmed Bookings Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{bookingStats.totalConfirmed}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center">
              <CalendarCheck className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-blue-500" />
              {((bookingStats.totalConfirmed / bookingStats.totalBookings) * 100).toFixed(0)}% del total
            </p>
          </CardContent>
        </Card>

        {/* Average Attendees Card */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Asistentes</CardTitle>
            <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-2 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{bookingStats.averageAttendees.toFixed(1)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 flex items-center">
              <Clock className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-amber-500" />
              Media por reserva
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bookings Chart */}
      <Card className="shadow-sm">
        <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
          <CardTitle className="text-sm sm:text-base">Reservas Mensuales</CardTitle>
        </CardHeader>
        <CardContent className="p-1 sm:p-4">
          <div className="h-64 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={bookingStats.bookingsByMonth}
                margin={{ top: 5, right: 10, left: 0, bottom: 20 }}
              >
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                  labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="count" name="Reservas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* User Roles Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Distribución de Roles</CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomizedLabel}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} usuarios`, 'Cantidad']}
                    contentStyle={{ fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-sm sm:text-base">Estado de Reservas</CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                    label={renderCustomizedLabel}
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} reservas`, 'Cantidad']}
                    contentStyle={{ fontSize: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}