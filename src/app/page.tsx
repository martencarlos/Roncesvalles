// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, History, Filter, UtensilsCrossed, CalendarIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import BookingCard from '@/components/BookingCard';
import BookingFormModal from '@/components/BookingFormModal';
import { IBooking, MealType } from '@/models/Booking';
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Registrar el idioma español para el datepicker
registerLocale('es', es);

export default function Home() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtering, setFiltering] = useState<boolean>(false);
  
  // Función para obtener todas las reservas
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/bookings');
      
      if (!res.ok) {
        throw new Error('Error al obtener las reservas');
      }
      
      const data = await res.json();
      
      // Ordenar reservas por fecha (más recientes primero)
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setBookings(sortedData);
      setFilteredBookings(sortedData);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBookings();
  }, []);
  
  // Filtrar reservas por fecha y tipo de comida seleccionados cuando el filtrado está habilitado
  useEffect(() => {
    if (filtering && selectedDate) {
      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);
      
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);
      
      const filtered = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const dateMatches = bookingDate >= selectedDateStart && bookingDate <= selectedDateEnd;
        return filtering ? dateMatches : true;
      });
      
      setFilteredBookings(filtered);
    } else {
      setFilteredBookings(bookings);
    }
  }, [filtering, selectedDate, bookings]);
  
  const handleCreateBooking = async (data: Partial<IBooking>) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la reserva');
      }
      
      // Cerrar formulario y actualizar reservas
      setShowForm(false);
      fetchBookings();
      toast.success("Reserva Creada", {
        description: `Apt #${data.apartmentNumber} ha reservado las mesas ${data.tables?.join(', ')} para ${data.mealType === 'lunch' ? 'comida' : 'cena'} el ${format(data.date as Date, 'd MMM, yyyy', { locale: es })}`,
      });
    } catch (err: any) {
      throw err;
    }
  };
  
  const handleUpdateBooking = async (data: Partial<IBooking>) => {
    if (!editingBooking?._id) return;
    
    try {
      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar la reserva');
      }
      
      // Cerrar formulario y actualizar reservas
      setEditingBooking(null);
      fetchBookings();
      toast.success("Reserva Actualizada", {
        description: `Actualizada reserva para Apt #${data.apartmentNumber}`,
      });
    } catch (err: any) {
      throw err;
    }
  };
  
  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Error al eliminar la reserva');
      }
      
      // Actualizar reservas
      fetchBookings();
      toast.error("Reserva Eliminada", {
        description: "La reserva ha sido eliminada correctamente",
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
  };
  
  // Obtener todas las mesas reservadas para la fecha y tipo de comida seleccionados
  const getBookedTablesForDateAndMeal = (date: Date, mealType: MealType) => {
    const selectedDateStart = new Date(date);
    selectedDateStart.setHours(0, 0, 0, 0);
    
    const selectedDateEnd = new Date(date);
    selectedDateEnd.setHours(23, 59, 59, 999);
    
    const bookingsForDate = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= selectedDateStart && 
             bookingDate <= selectedDateEnd && 
             booking.mealType === mealType;
    });
    
    return new Set(bookingsForDate.flatMap(booking => booking.tables));
  };
  
  const bookedTablesLunch = getBookedTablesForDateAndMeal(selectedDate, 'lunch');
  const availableTablesLunch = [1, 2, 3, 4, 5, 6].filter(table => !bookedTablesLunch.has(table));
  
  const bookedTablesDinner = getBookedTablesForDateAndMeal(selectedDate, 'dinner');
  const availableTablesDinner = [1, 2, 3, 4, 5, 6].filter(table => !bookedTablesDinner.has(table));
  
  const toggleFiltering = () => {
    setFiltering(!filtering);
  };
  
  // Agrupar reservas por fecha para mejor organización
  const groupedBookings: {[key: string]: IBooking[]} = {};
  
  filteredBookings.forEach(booking => {
    const dateKey = format(new Date(booking.date), 'yyyy-MM-dd');
    if (!groupedBookings[dateKey]) {
      groupedBookings[dateKey] = [];
    }
    groupedBookings[dateKey].push(booking);
  });
  
  // Ordenar claves de fecha cronológicamente
  const sortedDateKeys = Object.keys(groupedBookings).sort();
  
  const handleNewBooking = () => {
    setShowForm(true);
  };
  
  // Formatear fecha en español
  const formatDateEs = (date: Date, formatStr: string) => {
    return format(date, formatStr, { locale: es });
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6 sm:mb-8">
        {/* Título y botón de registro de actividad */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Sociedad Roncesvalles</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/activity">
              <History className="h-4 w-4 mr-2" />
              Ver Registro de Actividad
            </Link>
          </Button>
        </div>
        
        {/* Selector de fecha y botón de filtro - mejor diseño móvil */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-auto">
              <div className="absolute left-3 pointer-events-none text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => setSelectedDate(date)}
                dateFormat="d MMMM, yyyy"
                locale="es"
                className="w-full pl-10 p-2 border rounded-md"
              />
            </div>
            <Button 
              variant={filtering ? "default" : "outline"} 
              onClick={toggleFiltering}
              className="flex items-center gap-2 w-full sm:w-auto"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              {filtering ? "Limpiar Filtro" : "Filtrar"}
            </Button>
          </div>
          
          <Button onClick={handleNewBooking} className="w-full sm:w-auto" size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
        
        <Tabs defaultValue="lunch" onValueChange={(value) => setSelectedMealType(value as MealType)} className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="lunch" className="flex-1">Comida</TabsTrigger>
            <TabsTrigger value="dinner" className="flex-1">Cena</TabsTrigger>
          </TabsList>
          <TabsContent value="lunch">
            <Card>
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm sm:text-md flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Mesas disponibles para comida el {formatDateEs(selectedDate, 'd MMM, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {availableTablesLunch.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTablesLunch.map(table => (
                      <Badge key={table} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Mesa #{table}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">Todas las mesas están reservadas para comida en esta fecha.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dinner">
            <Card>
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm sm:text-md flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Mesas disponibles para cena el {formatDateEs(selectedDate, 'd MMM, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {availableTablesDinner.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTablesDinner.map(table => (
                      <Badge key={table} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Mesa #{table}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">Todas las mesas están reservadas para cena en esta fecha.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </header>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Modal del Formulario de Reserva */}
      <BookingFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateBooking}
        initialData={{ date: selectedDate, mealType: selectedMealType }}
        isEditing={false}
      />
      
      {/* Modal de Edición de Reserva */}
      {editingBooking && (
        <BookingFormModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleUpdateBooking}
          initialData={editingBooking}
          isEditing={true}
        />
      )}
      
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-semibold">
            {filtering 
              ? `Reservas para ${formatDateEs(selectedDate, 'd MMMM, yyyy')}` 
              : "Todas las Reservas"}
          </h2>
          {filtering && filteredBookings.length === 0 && (
            <Button variant="outline" onClick={() => setFiltering(false)} size="sm" className="w-full sm:w-auto">
              Mostrar Todas las Reservas
            </Button>
          )}
        </div>
        <Separator className="mb-4" />
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {sortedDateKeys.map(dateKey => (
              <div key={dateKey}>
                <h3 className="text-base sm:text-lg font-medium mb-3 bg-gray-100 p-2 rounded">
                  {formatDateEs(new Date(dateKey), 'EEEE, d MMMM, yyyy')}
                </h3>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedBookings[dateKey]
                    .sort((a, b) => {
                      // Ordenar por tipo de comida primero (comida primero, luego cena)
                      if (a.mealType !== b.mealType) {
                        return a.mealType === 'lunch' ? -1 : 1;
                      }
                      // Luego por número de apartamento
                      return a.apartmentNumber - b.apartmentNumber;
                    })
                    .map(booking => (
                      <BookingCard
                        key={booking._id as string}
                        booking={booking}
                        onEdit={() => setEditingBooking(booking)}
                        onDelete={() => handleDeleteBooking(booking._id as string)}
                      />
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-6 sm:py-8 text-center">
            {filtering ? "No hay reservas para esta fecha." : "No hay reservas disponibles."}
          </p>
        )}
      </div>
    </div>
  );
}