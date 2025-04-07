// src/components/admin/BookingsManagement.tsx
"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  PlusCircle, 
  Calendar, 
  Search, 
  X, 
  FilterIcon,
  Edit,
  Trash2,
  CheckCircle2,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BookingFormModal from "@/components/BookingFormModal";
import BookingConfirmationDialog from "@/components/BookingConfirmationDialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { IBooking } from "@/models/Booking";

registerLocale("es", es);

interface BookingsManagementProps {
  isITAdmin: boolean;
}

export default function BookingsManagement({ isITAdmin }: BookingsManagementProps) {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");
  
  // Booking modals state
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<IBooking | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deletingBooking, setDeletingBooking] = useState<IBooking | null>(null);
  
  // Fetch all bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      
      try {
        const res = await fetch("/api/bookings");
        
        if (!res.ok) {
          throw new Error("Error al obtener reservas");
        }
        
        const data = await res.json();
        
        // Sort bookings by date (most recent first)
        const sortedData = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setBookings(sortedData);
        applyFilters(
          sortedData,
          searchQuery,
          dateFilter,
          statusFilter,
          selectedDate,
          mealTypeFilter
        );
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, []);
  
  // Apply filters
  const applyFilters = (
    bookingsList: IBooking[],
    query: string,
    date: string,
    status: string,
    specificDate: Date | null,
    mealType: string
  ) => {
    let filtered = [...bookingsList];
    
    // Filter by search query (apartment number)
    if (query) {
      const apartmentNumber = parseInt(query);
      if (!isNaN(apartmentNumber)) {
        filtered = filtered.filter(
          (booking) => booking.apartmentNumber === apartmentNumber
        );
      }
    }
    
    // Filter by date
    if (date === "today") {
      filtered = filtered.filter((booking) => 
        isToday(new Date(booking.date))
      );
    } else if (date === "future") {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return isToday(bookingDate) || bookingDate > new Date();
      });
    } else if (date === "past") {
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return !isToday(bookingDate) && bookingDate < new Date();
      });
    } else if (date === "specific" && specificDate) {
      const year = specificDate.getFullYear();
      const month = specificDate.getMonth();
      const day = specificDate.getDate();
      
      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return (
          bookingDate.getFullYear() === year &&
          bookingDate.getMonth() === month &&
          bookingDate.getDate() === day
        );
      });
    }
    
    // Filter by status
    if (status !== "all") {
      filtered = filtered.filter((booking) => booking.status === status);
    }
    
    // Filter by meal type
    if (mealType !== "all") {
      filtered = filtered.filter((booking) => booking.mealType === mealType);
    }
    
    setFilteredBookings(filtered);
  };
  
  // Handle search and filter
  useEffect(() => {
    applyFilters(
      bookings,
      searchQuery,
      dateFilter,
      statusFilter,
      selectedDate,
      mealTypeFilter
    );
  }, [bookings, searchQuery, dateFilter, statusFilter, selectedDate, mealTypeFilter]);
  
  // Reset filter
  const resetFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setStatusFilter("all");
    setSelectedDate(null);
    setMealTypeFilter("all");
  };
  
  // Handle create booking
  const handleCreateBooking = async (data: Partial<IBooking>) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "pending",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear la reserva");
      }
      
      const newBooking = await res.json();
      
      // Add the new booking to the list
      setBookings((prev) => [newBooking, ...prev]);
      
      // Close form
      setShowForm(false);
      
      toast.success("Reserva Creada", {
        description: `Apt #${data.apartmentNumber} ha reservado las mesas ${data.tables?.join(
          ", "
        )} para ${
          data.mealType === "lunch" ? "comida" : "cena"
        } el ${format(data.date as Date, "d MMM, yyyy", { locale: es })}`,
      });
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };
  
  // Handle update booking
  const handleUpdateBooking = async (data: Partial<IBooking>) => {
    if (!editingBooking?._id) return;
    
    try {
      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar la reserva");
      }
      
      const updatedBooking = await res.json();
      
      // Update booking in the list
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === editingBooking._id ? updatedBooking : booking
        )
      );
      
      // Close form
      setEditingBooking(null);
      
      toast.success("Reserva Actualizada", {
        description: `Actualizada reserva para Apt #${data.apartmentNumber}`,
      });
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };
  
  // Handle delete booking
  const handleDeleteBooking = (booking: IBooking) => {
    setDeletingBooking(booking);
    setShowDeleteDialog(true);
  };
  
  // Confirm delete booking
  const confirmDeleteBooking = async () => {
    if (!deletingBooking?._id) return;
    
    try {
      const res = await fetch(`/api/bookings/${deletingBooking._id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("Error al eliminar la reserva");
      }
      
      // Remove booking from the list
      setBookings((prev) =>
        prev.filter((booking) => booking._id !== deletingBooking._id)
      );
      
      // Close dialog
      setShowDeleteDialog(false);
      setDeletingBooking(null);
      
      toast.error("Reserva Eliminada", {
        description: "La reserva ha sido eliminada correctamente",
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      toast.error(err.message);
    }
  };
  
  // Handle booking confirmation
  const handleConfirmBooking = async (
    id: string,
    data: { finalAttendees: number; notes: string }
  ) => {
    try {
      const res = await fetch(`/api/bookings/${id}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al confirmar la reserva");
      }
      
      const updatedBooking = await res.json();
      
      // Update booking in the list
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === id ? updatedBooking : booking
        )
      );
      
      // Close dialog
      setConfirmingBooking(null);
      
      toast.success("Reserva Confirmada", {
        description: `Reserva confirmada con ${data.finalAttendees} asistentes finales`,
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      toast.error(err.message);
      throw err;
    }
  };
  
  // Format date for display
  const formatDate = (date: string | Date) => {
    return format(new Date(date), "d MMM, yyyy", { locale: es });
  };
  
  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex items-center gap-2 w-full sm:w-auto">
          <Input
            placeholder="Filtrar por nº de apartamento"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-60"
            type="number"
            min="1"
            max="48"
          />
          
          {dateFilter === "specific" && (
            <div className="relative">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => setSelectedDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="Seleccionar fecha"
                className="w-full sm:w-40 p-2 border rounded-md"
                customInput={
                  <Input
                    className="w-full sm:w-40"
                  />
                }
              />
            </div>
          )}
          
          {(searchQuery || dateFilter !== "all" || statusFilter !== "all" || mealTypeFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Fecha" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="future">Futuras</SelectItem>
              <SelectItem value="past">Pasadas</SelectItem>
              <SelectItem value="specific">Específica</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lunch">Comida</SelectItem>
              <SelectItem value="dinner">Cena</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            // Check if booking is confirmed, pending, or cancelled
            const isConfirmed = booking.status === 'confirmed';
            const isPending = booking.status === 'pending';
            const isCancelled = booking.status === 'cancelled';
            const isPastBooking = isPast(new Date(booking.date)) && !isToday(new Date(booking.date));
            
            return (
              <Card 
                key={booking._id as string}
                className={`${isPastBooking && !isConfirmed && !isCancelled ? 'border-amber-300' : ''} ${isConfirmed ? 'border-green-300' : ''} ${isCancelled ? 'border-red-300 opacity-75' : ''}`}
              >
                <CardContent className="p-4">
                  {/* Mobile layout */}
                  <div className="block md:hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Apto. #{booking.apartmentNumber}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(booking.date)}</p>
                      </div>
                      <Badge 
                        variant={booking.mealType === 'lunch' ? 'outline' : 'default'}
                        className={booking.mealType === 'lunch' 
                          ? "capitalize bg-orange-100 text-orange-800 border-orange-200" 
                          : "capitalize bg-blue-100 text-blue-800 border-blue-200"
                        }
                      >
                        {booking.mealType === 'lunch' ? 'Comida' : 'Cena'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Estado:</span>
                        {isConfirmed && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Confirmada
                          </Badge>
                        )}
                        {isPending && !isPastBooking && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Pendiente
                          </Badge>
                        )}
                        {isPending && isPastBooking && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            Por confirmar
                          </Badge>
                        )}
                        {isCancelled && (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            Cancelada
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Personas:</span>
                        <span className="text-sm">
                          {isConfirmed && booking.finalAttendees !== undefined ? (
                            <>
                              <span className="line-through text-muted-foreground mr-1">{booking.numberOfPeople}</span>
                              {booking.finalAttendees}
                            </>
                          ) : (
                            booking.numberOfPeople
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Mesas:</span>
                        <span className="text-sm">{booking.tables.join(', ')}</span>
                      </div>
                      
                      {(booking.prepararFuego || booking.reservaHorno || booking.reservaBrasa) && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Servicios:</span>
                          <div className="flex gap-1 flex-wrap">
                            {booking.prepararFuego && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Fuego
                              </Badge>
                            )}
                            {booking.reservaHorno && (
                              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                Horno
                              </Badge>
                            )}
                            {booking.reservaBrasa && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                Brasa
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-3 border-t">
                      {isPending && isPastBooking && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setConfirmingBooking(booking)} 
                          className="cursor-pointer flex-1 border-amber-500 text-amber-700 hover:bg-amber-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingBooking(booking)} 
                        className="cursor-pointer flex-1"
                        disabled={isPastBooking && isConfirmed && !isITAdmin}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteBooking(booking)}
                        className="cursor-pointer flex-1"
                        disabled={isPastBooking && isConfirmed && !isITAdmin}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    <div className="md:col-span-1">
                      <span className="text-muted-foreground text-sm block">Apartamento</span>
                      <p className="font-semibold text-lg">#{booking.apartmentNumber}</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground text-sm block">Fecha</span>
                      <p className="font-medium">{formatDate(booking.date)}</p>
                    </div>
                    
                    <div className="md:col-span-1">
                      <span className="text-muted-foreground text-sm block">Servicio</span>
                      <Badge 
                        variant={booking.mealType === 'lunch' ? 'outline' : 'default'}
                        className={booking.mealType === 'lunch' 
                          ? "capitalize bg-orange-100 text-orange-800 border-orange-200" 
                          : "capitalize bg-blue-100 text-blue-800 border-blue-200"
                        }
                      >
                        {booking.mealType === 'lunch' ? 'Comida' : 'Cena'}
                      </Badge>
                    </div>
                    
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground text-sm block">Estado</span>
                      {isConfirmed && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          Confirmada
                        </Badge>
                      )}
                      {isPending && !isPastBooking && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          Pendiente
                        </Badge>
                      )}
                      {isPending && isPastBooking && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          Por confirmar
                        </Badge>
                      )}
                      {isCancelled && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          Cancelada
                        </Badge>
                      )}
                    </div>
                    
                    <div className="md:col-span-3">
                      <span className="text-muted-foreground text-sm block">Detalles</span>
                      <p className="text-sm">
                        <span className="font-medium">
                          {isConfirmed && booking.finalAttendees !== undefined ? (
                            <>
                              <span className="line-through text-muted-foreground mr-1">{booking.numberOfPeople}</span>
                              {booking.finalAttendees}
                            </>
                          ) : (
                            booking.numberOfPeople
                          )}
                        </span> personas, 
                        Mesas {booking.tables.join(', ')}
                      </p>
                      {(booking.prepararFuego || booking.reservaHorno || booking.reservaBrasa) && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {booking.prepararFuego && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              Fuego
                            </Badge>
                          )}
                          {booking.reservaHorno && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                              Horno
                            </Badge>
                          )}
                          {booking.reservaBrasa && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Brasa
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-3 flex justify-end gap-2">
                      {isPending && isPastBooking && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setConfirmingBooking(booking)} 
                          className="cursor-pointer border-amber-500 text-amber-700 hover:bg-amber-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingBooking(booking)} 
                        className="cursor-pointer"
                        disabled={isPastBooking && isConfirmed && !isITAdmin}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteBooking(booking)}
                        className="cursor-pointer"
                        disabled={isPastBooking && isConfirmed && !isITAdmin}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-muted-foreground">No se encontraron reservas que coincidan con los criterios de búsqueda.</p>
        </div>
      )}
      
      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateBooking}
        initialData={{ date: new Date(), mealType: "lunch" }}
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
      
      {/* Booking Confirmation Modal */}
      {confirmingBooking && (
        <BookingConfirmationDialog
          isOpen={!!confirmingBooking}
          onClose={() => setConfirmingBooking(null)}
          booking={confirmingBooking}
          onConfirm={handleConfirmBooking}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {deletingBooking && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDeleteBooking}
          apartmentNumber={deletingBooking.apartmentNumber}
          date={new Date(deletingBooking.date)}
          mealType={deletingBooking.mealType}
        />
      )}
    </div>
  );
}