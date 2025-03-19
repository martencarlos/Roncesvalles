// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, isToday, isFuture, isPast, startOfDay, endOfDay } from 'date-fns';
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

type DateFilter = 'all' | 'today' | 'future' | 'past' | 'specific';

export default function Home() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [datesWithBookings, setDatesWithBookings] = useState<Date[]>([]);
  
  // Fetch all bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/bookings');
      
      if (!res.ok) {
        throw new Error('Error al obtener las reservas');
      }
      
      const data = await res.json();
      
      // Sort bookings by date (ascending)
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setBookings(sortedData);
      applyFilters(sortedData, dateFilter, selectedDate);
      
      // Extract unique dates with bookings
      const uniqueDates = [...new Set(sortedData.map(booking => {
        const date = new Date(booking.date);
        return format(date, 'yyyy-MM-dd');
      }))].map(dateStr => new Date(dateStr));
      
      setDatesWithBookings(uniqueDates);
      
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
  
  // Apply filters to bookings
  const applyFilters = (allBookings: IBooking[], filter: DateFilter, date: Date) => {
    const today = startOfDay(new Date());
    
    let filtered: IBooking[] = [];
    
    switch (filter) {
      case 'today':
        filtered = allBookings.filter(booking => 
          isToday(new Date(booking.date))
        );
        break;
      case 'future':
        filtered = allBookings.filter(booking => 
          isFuture(new Date(booking.date)) || isToday(new Date(booking.date))
        );
        break;
      case 'past':
        filtered = allBookings.filter(booking => 
          isPast(new Date(booking.date)) && !isToday(new Date(booking.date))
        );
        break;
      case 'specific':
        const selectedDateStart = startOfDay(date);
        const selectedDateEnd = endOfDay(date);
        
        filtered = allBookings.filter(booking => {
          const bookingDate = new Date(booking.date);
          return bookingDate >= selectedDateStart && bookingDate <= selectedDateEnd;
        });
        break;
      case 'all':
      default:
        filtered = allBookings;
        break;
    }
    
    setFilteredBookings(filtered);
  };
  
  // Update filters when date filter or selected date changes
  useEffect(() => {
    applyFilters(bookings, dateFilter, selectedDate);
  }, [dateFilter, selectedDate, bookings]);
  
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
      
      // Close form and update bookings
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
      
      // Close form and update bookings
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
      
      // Update bookings
      fetchBookings();
      toast.error("Reserva Eliminada", {
        description: "La reserva ha sido eliminada correctamente",
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
  };
  
  // Get all booked tables for selected date and meal type
  const getBookedTablesForDateAndMeal = (date: Date, mealType: MealType) => {
    const selectedDateStart = startOfDay(date);
    const selectedDateEnd = endOfDay(date);
    
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
  
  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    
    // If switching to 'specific' and not already on a specific date, set today
    if (filter === 'specific') {
      setSelectedDate(new Date());
    }
  };
  
  // Group bookings by date for list view
  const groupedBookings: {[key: string]: IBooking[]} = {};
  
  filteredBookings.forEach(booking => {
    const dateKey = format(new Date(booking.date), 'yyyy-MM-dd');
    if (!groupedBookings[dateKey]) {
      groupedBookings[dateKey] = [];
    }
    groupedBookings[dateKey].push(booking);
  });
  
  // Sort date keys chronologically
  const sortedDateKeys = Object.keys(groupedBookings).sort();
  
  const handleNewBooking = () => {
    setShowForm(true);
  };
  
  // Format date in Spanish
  const formatDateEs = (date: Date, formatStr: string) => {
    return format(date, formatStr, { locale: es });
  };
  
  // Helper function to check if a date has bookings
  const hasBookingsOnDate = (date: Date) => {
    return datesWithBookings.some(bookingDate => 
      format(bookingDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };
  
  // Custom day rendering for the date picker to highlight dates with bookings
  const renderDayContents = (day: number, date: Date | undefined) => {
    if (!date) return <span>{day}</span>;
    
    // Check if this date has bookings
    const hasBookings = hasBookingsOnDate(date);
    
    return (
      <div className="relative">
        <span>{day}</span>
        {hasBookings && (
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
            style={{ bottom: '2px' }}
          />
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6 sm:mb-8">
        {/* Title and activity log button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Sociedad Roncesvalles</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/activity">
              <History className="h-4 w-4 mr-2" />
              Ver Registro de Actividad
            </Link>
          </Button>
        </div>
        
        {/* Date selector and filter - better mobile design */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-auto">
              <div className="absolute left-3 pointer-events-none text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => {
                  setSelectedDate(date);
                  setDateFilter('specific');
                }}
                dateFormat="d MMMM, yyyy"
                locale="es"
                className="w-full pl-10 p-2 border rounded-md"
                renderDayContents={renderDayContents}
                highlightDates={datesWithBookings}
                customInput={
                  <input 
                    className="w-full pl-10 p-2 border rounded-md cursor-pointer" 
                    readOnly 
                  />
                }
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={dateFilter === 'today' ? "default" : "outline"} 
                onClick={() => handleDateFilterChange('today')}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Hoy
              </Button>
              <Button 
                variant={dateFilter === 'future' ? "default" : "outline"} 
                onClick={() => handleDateFilterChange('future')}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Próximas
              </Button>
              <Button 
                variant={dateFilter === 'past' ? "default" : "outline"} 
                onClick={() => handleDateFilterChange('past')}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Pasadas
              </Button>
            </div>
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
      
      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateBooking}
        initialData={{ date: selectedDate, mealType: selectedMealType }}
        isEditing={false}
      />
      
      {/* Booking Edit Modal */}
      {editingBooking && (
        <BookingFormModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleUpdateBooking}
          initialData={editingBooking}
          isEditing={true}
        />
      )}
      
      {/* List view title with filter info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">
          {dateFilter === 'today' && 'Reservas de Hoy'}
          {dateFilter === 'future' && 'Próximas Reservas'}
          {dateFilter === 'past' && 'Reservas Pasadas'}
          {dateFilter === 'specific' && `Reservas para ${formatDateEs(selectedDate, 'd MMMM, yyyy')}`}
          {dateFilter === 'all' && 'Todas las Reservas'}
        </h2>
        {filteredBookings.length === 0 && (
          <Button variant="outline" onClick={() => setDateFilter('future')} size="sm" className="w-full sm:w-auto">
            Ver Próximas Reservas
          </Button>
        )}
      </div>
      <Separator className="mb-4" />
      
      {/* Bookings list view */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-6 sm:space-y-8">
          {sortedDateKeys.map(dateKey => {
            const bookingsForDate = groupedBookings[dateKey];
            const bookingDate = new Date(dateKey);
            const isBookingToday = isToday(bookingDate);
            const isBookingFuture = isFuture(bookingDate);
            const isBookingPast = isPast(bookingDate) && !isToday(bookingDate);
            
            // Determine the appropriate status badge
            let statusBadge = null;
            if (isBookingToday) {
              statusBadge = <Badge className="bg-blue-100 text-blue-800 border-blue-200">Hoy</Badge>;
            } else if (isBookingFuture) {
              statusBadge = <Badge className="bg-green-100 text-green-800 border-green-200">Próxima</Badge>;
            } else if (isBookingPast) {
              statusBadge = <Badge className="bg-gray-100 text-gray-800 border-gray-200">Pasada</Badge>;
            }
            
            return (
              <div key={dateKey}>
                <div className="flex justify-between items-center mb-3 bg-gray-100 p-2 rounded">
                  <h3 className="text-base sm:text-lg font-medium">
                    {formatDateEs(bookingDate, 'EEEE, d MMMM, yyyy')}
                  </h3>
                  {statusBadge}
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {bookingsForDate
                    .sort((a, b) => {
                      // First by meal type (lunch first, then dinner)
                      if (a.mealType !== b.mealType) {
                        return a.mealType === 'lunch' ? -1 : 1;
                      }
                      // Then by apartment number
                      return a.apartmentNumber - b.apartmentNumber;
                    })
                    .map(booking => (
                      <BookingCard
                        key={booking._id as string}
                        booking={booking}
                        onEdit={() => setEditingBooking(booking)}
                        onDelete={() => handleDeleteBooking(booking._id as string)}
                        isPast={isBookingPast}
                      />
                    ))
                  }
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground py-6 sm:py-8 text-center">
          {dateFilter === 'today' && 'No hay reservas para hoy.'}
          {dateFilter === 'future' && 'No hay próximas reservas.'}
          {dateFilter === 'past' && 'No hay reservas pasadas.'}
          {dateFilter === 'specific' && `No hay reservas para ${formatDateEs(selectedDate, 'd MMMM, yyyy')}.`}
          {dateFilter === 'all' && 'No hay reservas disponibles.'}
        </p>
      )}
    </div>
  );
}