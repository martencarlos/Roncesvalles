// src/components/admin/dashboard/UserStatistics.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserStats } from "@/components/admin/AdminDashboard";
import {
  Users,
  UserPlus,
  KeyIcon,
  MapPin,
  MonitorSmartphone,
  LaptopIcon,
  SmartphoneIcon,
  TabletIcon
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface UserStatisticsProps {
  stats: UserStats;
}

export default function UserStatistics({ stats }: UserStatisticsProps) {
  // Prepare data for device usage chart
  const deviceData = [
    { name: "Desktop", value: stats.sessionsByDevice.desktop, color: "#3b82f6" }, // blue
    { name: "Mobile", value: stats.sessionsByDevice.mobile, color: "#10b981" },   // green
    { name: "Tablet", value: stats.sessionsByDevice.tablet, color: "#f59e0b" }    // amber
  ];

  // Prepare data for geographic distribution
  const locationData = stats.geographicDistribution;

  // Prepare data for new users trend
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const trendData = stats.newUsersTrend.map((count, index) => ({
    month: monthNames[index],
    count
  }));

  // Prepare role data for detailed view
  const roleData = [
    { name: "Usuarios Regulares", value: stats.usersByRole.user, color: "#3b82f6" },  // blue
    { name: "Administradores", value: stats.usersByRole.admin, color: "#8b5cf6" },    // purple
    { name: "Administradores IT", value: stats.usersByRole.it_admin, color: "#ef4444" }, // red
    { name: "Conserjes", value: stats.usersByRole.manager, color: "#10b981" }         // green
  ];

  return (
    <div className="space-y-6">
      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en el sistema</p>
          </CardContent>
        </Card>

        {/* New Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Usuarios</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        {/* Password Resets Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Restablecimientos</CardTitle>
            <KeyIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passwordResets}</div>
            <p className="text-xs text-muted-foreground mt-1">Solicitudes de contraseña</p>
          </CardContent>
        </Card>

        {/* Device Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Uso por Dispositivos</CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LaptopIcon className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-sm">{stats.sessionsByDevice.desktop}%</span>
              </div>
              <div className="flex items-center">
                <SmartphoneIcon className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm">{stats.sessionsByDevice.mobile}%</span>
              </div>
              <div className="flex items-center">
                <TabletIcon className="h-4 w-4 mr-1 text-amber-500" />
                <span className="text-sm">{stats.sessionsByDevice.tablet}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* New Users Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Nuevos Usuarios</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Nuevos Usuarios" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* User Types Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Roles</CardTitle>
            <CardDescription>Porcentaje de usuarios por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
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

        {/* Geographic Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución Geográfica</CardTitle>
            <CardDescription>Ubicación de los usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData}>
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Usuarios" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Device Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Uso por Tipo de Dispositivo</CardTitle>
            <CardDescription>Sesiones por plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Active Users */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Más Activos</CardTitle>
          <CardDescription>Usuarios con mayor número de acciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.mostActiveUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.apartmentNumber ? `Apartamento #${user.apartmentNumber}` : 'Administrador'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                  <span className="font-semibold">{user.actions}</span>
                  <span className="text-xs text-muted-foreground">acciones</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}