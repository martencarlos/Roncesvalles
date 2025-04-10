import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserStats } from "@/components/admin/AdminDashboard";
import {
  Users,
  UserPlus,
  MonitorSmartphone,
  LaptopIcon,
  SmartphoneIcon,
  TabletIcon,
  LogIn,
  Globe
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
// Import table components from your UI components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Enhanced UserStats interface with login tracking
interface UserLogin {
  id: string;
  userId: string;
  userName: string;
  apartmentNumber?: number;
  timestamp: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  location: string; // This now contains OS info
  ipAddress: string;
}

// Update the UserStats interface to include login data
interface EnhancedUserStats extends UserStats {
  loginActivity: {
    totalLogins: number;
    loginsByUser: {
      userId: string;
      name: string;
      apartmentNumber?: number;
      count: number;
    }[];
    recentLogins: UserLogin[];
    loginsByMonth: { month: string; count: number }[];
    loginsByDevice: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
  };
}

interface UserStatisticsProps {
  stats: EnhancedUserStats;
}

export default function UserStatistics({ stats }: UserStatisticsProps) {
  const [loginSearchQuery, setLoginSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Prepare data for device usage chart
  const deviceData = [
    {
      name: "Desktop",
      value: stats.sessionsByDevice.desktop,
      color: "#3b82f6",
    }, // blue
    { name: "Mobile", value: stats.sessionsByDevice.mobile, color: "#10b981" }, // green
    { name: "Tablet", value: stats.sessionsByDevice.tablet, color: "#f59e0b" }, // amber
  ];

  // Prepare data for geographic distribution
  const locationData = stats.geographicDistribution;

  // Prepare data for new users trend
  const monthNames = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const currentMonth = new Date().getMonth(); // Get current month (0-11)

  // Map the trend data to months ending with current month
  const trendData = stats.newUsersTrend.map((count, index) => {
    // Calculate which month this index corresponds to
    // We want to go back 11 months from current month, then add our index
    const monthIndex = (currentMonth - 11 + index + 12) % 12;
    return {
      month: monthNames[monthIndex],
      count,
    };
  });

  // Prepare role data for detailed view
  const roleData = [
    {
      name: "Usuarios Regulares",
      value: stats.usersByRole.user,
      color: "#3b82f6",
    }, // blue
    {
      name: "Administradores",
      value: stats.usersByRole.admin,
      color: "#8b5cf6",
    }, // purple
    {
      name: "Administradores IT",
      value: stats.usersByRole.it_admin,
      color: "#ef4444",
    }, // red
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "d MMM, yyyy - HH:mm", { locale: es });
  };

  // Filter login data based on search query
  const filteredLogins = stats.loginActivity.recentLogins.filter((login) => {
    if (!loginSearchQuery) return true;

    const searchLower = loginSearchQuery.toLowerCase();
    return (
      login.userName.toLowerCase().includes(searchLower) ||
      (login.apartmentNumber?.toString() || "").includes(searchLower) ||
      login.location.toLowerCase().includes(searchLower) || // This now searches OS info
      login.deviceType.toLowerCase().includes(searchLower) ||
      login.browser.toLowerCase().includes(searchLower)
    );
  });

  // Paginate filtered login data
  const paginatedLogins = filteredLogins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Total pages for pagination
  const totalPages = Math.ceil(filteredLogins.length / itemsPerPage);

  // Get device icon based on type
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "desktop":
        return <LaptopIcon className="h-4 w-4 text-blue-500" />;
      case "mobile":
        return <SmartphoneIcon className="h-4 w-4 text-green-500" />;
      case "tablet":
        return <TabletIcon className="h-4 w-4 text-amber-500" />;
      default:
        return <MonitorSmartphone className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* User Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Usuarios
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registrados en el sistema
            </p>
          </CardContent>
        </Card>

        {/* New Users Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos Usuarios
            </CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        {/* Total Logins Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inicios Sesión
            </CardTitle>
            <LogIn className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.loginActivity.totalLogins}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Inicios sesión registrados
            </p>
          </CardContent>
        </Card>

        {/* Device Usage Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Uso por Dispositivos
            </CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <LaptopIcon className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-sm">
                  {stats.sessionsByDevice.desktop}%
                </span>
              </div>
              <div className="flex items-center">
                <SmartphoneIcon className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm">
                  {stats.sessionsByDevice.mobile}%
                </span>
              </div>
              <div className="flex items-center">
                <TabletIcon className="h-4 w-4 mr-1 text-amber-500" />
                <span className="text-sm">
                  {stats.sessionsByDevice.tablet}%
                </span>
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
                  <XAxis
                    dataKey="month"
                    interval={0}
                    angle={0}
                    tick={{ fontSize: 12 }}
                  />
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

        {/* Login Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Inicios de Sesión</CardTitle>
            <CardDescription>Últimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.loginActivity.loginsByMonth}>
                <XAxis
                    dataKey="month"
                    interval={0}
                    angle={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Inicios de Sesión"
                    stroke="#8b5cf6"
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} usuarios`, "Cantidad"]}
                  />
                </PieChart>
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
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Porcentaje"]} />
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
          <CardDescription>
            Usuarios con mayor número de acciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.mostActiveUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.apartmentNumber
                      ? `Apartamento #${user.apartmentNumber}`
                      : "Administrador"}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                  <span className="font-semibold">{user.actions}</span>
                  <span className="text-xs text-muted-foreground">
                    acciones
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login Activity by User */}
      <Card>
        <CardHeader>
          <CardTitle>Inicios de Sesión por Usuario</CardTitle>
          <CardDescription>
            Usuarios con mayor número de inicios de sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.loginActivity.loginsByUser.slice(0, 6).map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {user.apartmentNumber
                      ? `Apartamento #${user.apartmentNumber}`
                      : "Administrador"}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
                  <LogIn className="h-3 w-3 mr-1" />
                  <span className="font-semibold">{user.count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Login History */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Historial de Inicios de Sesión</CardTitle>
              <CardDescription>
                Registro detallado de accesos al sistema
              </CardDescription>
            </div>

            <div className="w-full md:w-64">
              <Input
                placeholder="Buscar por usuario, dispositivo..."
                value={loginSearchQuery}
                onChange={(e) => {
                  setLoginSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Navegador
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Sistema Op.
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogins.length > 0 ? (
                  paginatedLogins.map((login) => (
                    <TableRow key={login.id}>
                      <TableCell>
                        <div className="font-medium">{login.userName}</div>
                        {login.apartmentNumber && (
                          <div className="text-xs text-muted-foreground">
                            Apto #{login.apartmentNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(login.timestamp)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getDeviceIcon(login.deviceType)}
                          <span className="capitalize">{login.deviceType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {login.browser}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          {login.location}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron registros
                      {loginSearchQuery && " que coincidan con la búsqueda"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {filteredLogins.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando{" "}
                {Math.min(
                  filteredLogins.length,
                  (currentPage - 1) * itemsPerPage + 1
                )}{" "}
                a {Math.min(currentPage * itemsPerPage, filteredLogins.length)}{" "}
                de {filteredLogins.length} registros
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage <= 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}