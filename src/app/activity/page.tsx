// src/app/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ActivityIcon, ChevronLeft, ChevronRight, Filter, UserIcon, BookOpen, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ActivityLogItem from '@/components/ActivityLogItem';
import { IActivityLog } from '@/models/ActivityLog';
import Pagination from '@/components/Pagination';
import { useSession } from "next-auth/react";

export default function ActivityPage() {
  const { data: session } = useSession();
  const [activityLogs, setActivityLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter state
  const [actionType, setActionType] = useState('all');
  const [userOnly, setUserOnly] = useState(false);
  const [apartmentFilter, setApartmentFilter] = useState('');
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  
  const isAdmin = session?.user?.role === 'it_admin' || session?.user?.role === 'admin' || session?.user?.role === 'manager';
  
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        setLoading(true);
        
        // Build the query URL with pagination and filters
        let url = `/api/activity?page=${currentPage}&limit=${itemsPerPage}`;
        
        if (actionType !== 'all') {
          url += `&action=${actionType}`;
        }
        
        if (userOnly) {
          url += '&userOnly=true';
        }
        
        if (apartmentFilter && !isNaN(parseInt(apartmentFilter))) {
          url += `&apartment=${apartmentFilter}`;
        }
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('Error al obtener registros de actividad');
        }
        
        const data = await res.json();
        setActivityLogs(data.logs);
        setTotalPages(data.totalPages);
        
        // Check if any filters are applied
        setIsFilterApplied(actionType !== 'all' || userOnly || !!apartmentFilter);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchActivityLogs();
    }
  }, [currentPage, itemsPerPage, actionType, userOnly, apartmentFilter, session]);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };
  
  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };
  
  const handleResetFilters = () => {
    setActionType('all');
    setUserOnly(false);
    setApartmentFilter('');
    setCurrentPage(1);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Registro de Actividad</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Reservas
            </Link>
          </Button>
        </div>
      </header>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filter controls - only visible to admins */}
      {isAdmin && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtrar Actividad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="actionType" className="mb-2 block">Tipo de Actividad</Label>
                <Select
                  value={actionType}
                  onValueChange={setActionType}
                >
                  <SelectTrigger id="actionType">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las actividades</SelectItem>
                    <SelectItem value="booking">Reservas (todas)</SelectItem>
                    <SelectItem value="create">Creación de reservas</SelectItem>
                    <SelectItem value="update">Modificación de reservas</SelectItem>
                    <SelectItem value="delete">Cancelación de reservas</SelectItem>
                    <SelectItem value="confirm">Confirmación de reservas</SelectItem>
                    <SelectItem value="user">Usuarios (todas)</SelectItem>
                    <SelectItem value="user_create">Creación de usuarios</SelectItem>
                    <SelectItem value="user_update">Modificación de usuarios</SelectItem>
                    <SelectItem value="user_delete">Eliminación de usuarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="apartmentFilter" className="mb-2 block">Filtrar por Apartamento</Label>
                <Input
                  id="apartmentFilter"
                  type="number"
                  min="1"
                  max="48"
                  placeholder="Nº de Apartamento"
                  value={apartmentFilter}
                  onChange={(e) => setApartmentFilter(e.target.value)}
                />
              </div>
              
              {/* <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="userOnly"
                    checked={userOnly}
                    onCheckedChange={(checked) => setUserOnly(!!checked)}
                  />
                  <Label htmlFor="userOnly" className="cursor-pointer">
                    Solo mis actividades
                  </Label>
                </div>
              </div> */}
            </div>
            
            {isFilterApplied && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader className="px-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ActivityIcon className="h-5 w-5" />
            Actividad Reciente
            {isFilterApplied && (
              <Badge variant="outline" className="ml-2 text-xs">
                Filtros aplicados
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            Toda la actividad relacionada con las reservas y gestión de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4">
          {loading && currentPage === 1 ? (
            <div className="flex justify-center p-6 sm:p-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : activityLogs.length > 0 ? (
            <>
              <div className="space-y-1">
                {activityLogs.map((log) => (
                  <ActivityLogItem key={log._id as string} log={log} />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground py-6 sm:py-8 text-center">No se ha registrado actividad todavía{isFilterApplied ? ' con los filtros seleccionados' : ''}.</p>
          )}
        </CardContent>
      </Card>
      
      {/* Help card at the bottom */}
      <Card className="mt-6">
        <CardHeader className="px-4 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            Información de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 text-sm text-muted-foreground">
          <p>
            Este registro muestra todas las acciones realizadas en el sistema, incluyendo:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Creación, modificación y cancelación de reservas</li>
            <li>Confirmación de reservas pasadas</li>
            <li>Gestión de usuarios (creación, modificación, eliminación)</li>
          </ul>
          {isAdmin && (
            <p className="mt-3">
              Como administrador, puede filtrar la actividad por tipo, apartamento o ver solo sus propias acciones.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}