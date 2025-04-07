// src/components/admin/ExportDataPanel.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileSpreadsheetIcon, FileIcon, Users, CalendarDays } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BookingDetail {
  date: string;
  mealType: string;
  attendees: number;
  amount: number;
  tables: number[];
  services: string[];
}

interface ApartmentData {
  apartmentNumber: number;
  totalBookings: number;
  totalAttendees: number;
  totalAmount: number;
  bookingDetails: BookingDetail[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  apartmentNumber?: number;
  createdAt: string;
}

export default function ExportDataPanel() {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [includeDetails, setIncludeDetails] = useState<boolean>(true);
  const [exportTab, setExportTab] = useState<string>("bookings");
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [userExportFormat, setUserExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [userError, setUserError] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  
  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const handleExport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch data from our API
      const response = await fetch(`/api/export?year=${year}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al exportar los datos');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setError('No hay reservas confirmadas en el año seleccionado.');
        setIsLoading(false);
        return;
      }
      
      // Generate file based on format
      if (format === 'excel') {
        generateExcel(data, year);
      } else {
        generatePDF(data, year);
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al exportar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateExcel = (data: ApartmentData[], year: string) => {
    // Create CSV content with detailed breakdown
    let csvContent = "Apartamento,Total Reservas,Total Asistentes,Importe Total (€)\n";
    
    // First add the summary rows
    data.forEach(apartment => {
      csvContent += `${apartment.apartmentNumber},${apartment.totalBookings},${apartment.totalAttendees},${apartment.totalAmount.toFixed(2)}\n`;
    });
    
    // Add grand total row
    const totalBookings = data.reduce((sum, apt) => sum + apt.totalBookings, 0);
    const totalAttendees = data.reduce((sum, apt) => sum + apt.totalAttendees, 0);
    const totalAmount = data.reduce((sum, apt) => sum + apt.totalAmount, 0);
    
    csvContent += `\nTOTAL,${totalBookings},${totalAttendees},${totalAmount.toFixed(2)}\n\n`;
    
    // If detailed view is requested, add a breakdown of each booking
    if (includeDetails) {
      csvContent += "\nDETALLE DE RESERVAS\n";
      csvContent += "Apartamento,Fecha,Servicio,Asistentes,Mesas,Servicios,Importe (€)\n";
      
      data.forEach(apartment => {
        apartment.bookingDetails.forEach(booking => {
          csvContent += `${apartment.apartmentNumber},${booking.date},${booking.mealType},${booking.attendees},"${booking.tables.join(', ')}","${booking.services.join(', ')}",${booking.amount.toFixed(2)}\n`;
        });
      });
    }
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reservas_${year}${includeDetails ? '_Detallado' : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const generatePDF = (data: ApartmentData[], year: string) => {
    // Create a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Por favor, permite las ventanas emergentes para generar PDF.');
      return;
    }
    
    // Calculate totals
    const totalBookings = data.reduce((sum, apt) => sum + apt.totalBookings, 0);
    const totalAttendees = data.reduce((sum, apt) => sum + apt.totalAttendees, 0);
    const totalAmount = data.reduce((sum, apt) => sum + apt.totalAmount, 0);
    
    // Write HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe de Reservas ${year}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { text-align: center; }
          h2 { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f2f2f2; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <h1>Informe de Reservas Confirmadas ${year}</h1>
        <p>Fecha de generación: ${new Date().toLocaleDateString()}</p>
        
        <h2>Resumen por Apartamento</h2>
        <table>
          <thead>
            <tr>
              <th>Apartamento</th>
              <th>Total Reservas</th>
              <th>Total Asistentes</th>
              <th>Importe Total (€)</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(apt => `
              <tr>
                <td>${apt.apartmentNumber}</td>
                <td>${apt.totalBookings}</td>
                <td>${apt.totalAttendees}</td>
                <td>${apt.totalAmount.toFixed(2)} €</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td>${totalBookings}</td>
              <td>${totalAttendees}</td>
              <td>${totalAmount.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
        
        ${includeDetails ? `
          <div class="page-break"></div>
          <h2>Detalle de Reservas</h2>
          ${data.map(apt => `
            <h3>Apartamento ${apt.apartmentNumber}</h3>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Servicio</th>
                  <th>Asistentes</th>
                  <th>Mesas</th>
                  <th>Servicios</th>
                  <th>Importe (€)</th>
                </tr>
              </thead>
              <tbody>
                ${apt.bookingDetails.map(booking => `
                  <tr>
                    <td>${booking.date}</td>
                    <td>${booking.mealType}</td>
                    <td>${booking.attendees}</td>
                    <td>${booking.tables.join(', ')}</td>
                    <td>${booking.services.join(', ')}</td>
                    <td>${booking.amount.toFixed(2)} €</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="5">TOTAL</td>
                  <td>${apt.totalAmount.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
          `).join('')}
        ` : ''}
        
        <script>
          // Auto print and close the window after printing
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // User export functionality
  const handleUserExport = async () => {
    setIsLoadingUsers(true);
    setUserError('');

    try {
      // Fetch users from the API
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener los usuarios');
      }
      
      let users = await response.json();
      
      // Apply role filter if needed
      if (userRoleFilter !== 'all') {
        users = users.filter((user: User) => user.role === userRoleFilter);
      }
      
      if (users.length === 0) {
        setUserError('No hay usuarios que coincidan con los criterios de filtrado.');
        setIsLoadingUsers(false);
        return;
      }
      
      // Generate user export
      if (userExportFormat === 'excel') {
        generateUserExcel(users);
      } else {
        generateUserPDF(users);
      }
      
    } catch (err: any) {
      setUserError(err.message || 'Error al exportar los datos de usuarios');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const generateUserExcel = (users: User[]) => {
    // Create CSV content for users
    let csvContent = "ID,Nombre,Email,Rol,Apartamento,Fecha de Registro\n";
    
    // Add user rows
    users.forEach(user => {
      const apartmentNumber = user.apartmentNumber || 'N/A';
      const createdDate = new Date(user.createdAt).toLocaleDateString();
      
      csvContent += `${user._id},"${user.name}",${user.email},${translateRole(user.role)},${apartmentNumber},${createdDate}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateUserPDF = (users: User[]) => {
    // Create a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setUserError('Por favor, permite las ventanas emergentes para generar PDF.');
      return;
    }
    
    // Count total by role
    const roleCounts = users.reduce((acc: {[key: string]: number}, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    // Create HTML for role summary
    let roleSummaryHTML = `
      <table class="summary-table">
        <thead>
          <tr>
            <th>Rol</th>
            <th>Cantidad</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    for (const [role, count] of Object.entries(roleCounts)) {
      roleSummaryHTML += `
        <tr>
          <td>${translateRole(role)}</td>
          <td>${count}</td>
        </tr>
      `;
    }
    
    roleSummaryHTML += `
        <tr class="total-row">
          <td>TOTAL</td>
          <td>${users.length}</td>
        </tr>
      </tbody>
    </table>`;
    
    // Write HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe de Usuarios</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { text-align: center; }
          h2 { margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f2f2f2; }
          .page-break { page-break-before: always; }
          .summary-table { width: 50%; margin: 20px auto; }
        </style>
      </head>
      <body>
        <h1>Informe de Usuarios del Sistema</h1>
        <p>Fecha de generación: ${new Date().toLocaleDateString()}</p>
        
        <h2>Resumen por Rol</h2>
        ${roleSummaryHTML}
        
        <h2>Listado de Usuarios</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Apartamento</th>
              <th>Fecha de Registro</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(user => `
              <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${translateRole(user.role)}</td>
                <td>${user.apartmentNumber || 'N/A'}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <script>
          // Auto print and close the window after printing
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Helper to translate role names to Spanish
  const translateRole = (role: string): string => {
    switch (role) {
      case 'user':
        return 'Usuario';
      case 'admin':
        return 'Administrador (Lectura)';
      case 'it_admin':
        return 'Administrador IT';
      case 'manager':
        return 'Conserje';
      default:
        return role;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={exportTab} onValueChange={setExportTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Datos de Reservas</CardTitle>
              <CardDescription>
                Exporte datos de las reservas confirmadas para facturación y gestión administrativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Año</Label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'excel' | 'pdf')} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="excel" id="excel" />
                        <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer">
                          <FileSpreadsheetIcon className="w-4 h-4 text-green-600" />
                          <span>Excel/CSV</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer">
                          <FileIcon className="w-4 h-4 text-red-600" />
                          <span>PDF</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="includeDetails"
                      checked={includeDetails}
                      onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                    />
                    <Label htmlFor="includeDetails" className="cursor-pointer">
                      Incluir desglose detallado de reservas
                    </Label>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <h3 className="font-medium mb-2">Datos incluidos:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Resumen de reservas por apartamento</li>
                      <li>Total de reservas, asistentes e importes</li>
                      {includeDetails && (
                        <li>Detalle de cada reserva (fecha, servicio, mesas, etc.)</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={handleExport} disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                      Exportando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Reservas
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Datos de Usuarios</CardTitle>
              <CardDescription>
                Exporte información sobre los usuarios registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {userError && (
                <Alert variant="destructive">
                  <AlertDescription>{userError}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="userRoleFilter">Filtrar por Rol</Label>
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrar por rol" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="user">Solo usuarios (residentes)</SelectItem>
                        <SelectItem value="admin">Solo administradores</SelectItem>
                        <SelectItem value="manager">Solo conserjes</SelectItem>
                        <SelectItem value="it_admin">Solo administradores IT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <RadioGroup 
                      value={userExportFormat} 
                      onValueChange={(v) => setUserExportFormat(v as 'excel' | 'pdf')}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="excel" id="userExcel" />
                        <Label htmlFor="userExcel" className="flex items-center space-x-2 cursor-pointer">
                          <FileSpreadsheetIcon className="w-4 h-4 text-green-600" />
                          <span>Excel/CSV</span>
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="userPdf" />
                        <Label htmlFor="userPdf" className="flex items-center space-x-2 cursor-pointer">
                          <FileIcon className="w-4 h-4 text-red-600" />
                          <span>PDF</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-md text-sm">
                    <h3 className="font-medium mb-2">Datos incluidos:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Resumen de usuarios por tipo</li>
                      <li>Información de usuarios (nombre, email, rol)</li>
                      <li>Número de apartamento (para usuarios residentes)</li>
                      <li>Fecha de registro en el sistema</li>
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Nota: Los datos sensibles como contraseñas no se incluyen en los exportes.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button onClick={handleUserExport} disabled={isLoadingUsers}>
                  {isLoadingUsers ? (
                    <span className="flex items-center">
                      <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                      Exportando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar Usuarios
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}