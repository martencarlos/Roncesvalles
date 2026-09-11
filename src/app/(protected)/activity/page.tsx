// src/app/activity/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ActivityIcon, Filter, BookOpen, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
  
  const isAdmin = session?.user?.role === 'it_admin' || session?.user?.role === 'admin' ;
  
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
    <PageContainer>
      <PageHeader
        title="Registro de Actividad"
        description="Toda la actividad relacionada con las reservas y gestión de usuarios"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Volver a Reservas
            </Link>
          </Button>
        }
      />
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filter controls - only visible to admins */}
      {isAdmin && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-muted-foreground" />
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
      
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            Actividad Reciente
          </h2>
          {isFilterApplied && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Filtros aplicados
            </Badge>
          )}
        </div>

        {loading && currentPage === 1 ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="hidden h-4 w-24 sm:block" />
              </div>
            ))}
          </div>
        ) : activityLogs.length > 0 ? (
          <>
            <div className="divide-y divide-border">
              {activityLogs.map((log) => (
                <ActivityLogItem key={log._id as string} log={log} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="border-t border-border p-4">
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
          <div className="p-4">
            <EmptyState
              icon={ActivityIcon}
              title="No hay actividad registrada"
              description={`No se ha registrado actividad todavía${isFilterApplied ? ' con los filtros seleccionados' : ''}.`}
              action={
                isFilterApplied ? (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
              className="border-0 bg-transparent"
            />
          </div>
        )}
      </div>
      
      {/* Help card at the bottom */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            Información de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
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
    </PageContainer>
  );
}