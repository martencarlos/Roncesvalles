// src/app/(protected)/bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  format,
  isToday,
  isFuture,
  isPast,
  startOfDay,
  endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  PlusCircle,
  History,
  AlertCircle,
  UtensilsCrossed,
  CalendarIcon,
  CheckCircle2,
  LayoutGrid,
  List,
  InfoIcon,
  BookOpen,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import BookingCard from "@/components/BookingCard";
import BookingListItem from "@/components/BookingListItem";
import BookingFormModal from "@/components/BookingFormModal";
import BookingConfirmationDialog from "@/components/BookingConfirmationDialog";
import ExportDialog from "@/components/ExportDialog";
import { IBooking, MealType } from "@/models/Booking";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { useSession } from "next-auth/react";
import UserMenu from "@/components/auth/UserMenu";

// Registrar el idioma español para el datepicker
registerLocale("es", es);

type DateFilter =
  | "all"
  | "today"
  | "future"
  | "past"
  | "pending-confirmation"
  | "specific";
type ViewMode = "card" | "list" | undefined;

export default function BookingsPage() {
  const { data: session, status } = useSession();
  
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<IBooking | null>(
    null
  );
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [datesWithBookings, setDatesWithBookings] = useState<Date[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<number>(0);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deletingBooking, setDeletingBooking] = useState<IBooking | null>(null);

  // Add view mode state
  const [viewMode, setViewMode] = useState<ViewMode>(undefined);

  // Add state for bookings by date and meal type
  const [bookingsByDate, setBookingsByDate] = useState<{
    [key: string]: { lunch: boolean; dinner: boolean };
  }>({});

  // Fetch all bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookings");

      if (!res.ok) {
        throw new Error("Error al obtener las reservas");
      }

      const data = await res.json();

      // Sort bookings by date (ascending)
      const sortedData = [...data].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setBookings(sortedData);
      applyFilters(sortedData, dateFilter, selectedDate);

      // Create a map of dates with booking info for lunch and dinner
      const bookingsByDateMap: {
        [key: string]: { lunch: boolean; dinner: boolean };
      } = {};

      sortedData.forEach((booking) => {
        const dateKey = format(new Date(booking.date), "yyyy-MM-dd");

        if (!bookingsByDateMap[dateKey]) {
          bookingsByDateMap[dateKey] = { lunch: false, dinner: false };
        }

        if (booking.mealType === "lunch") {
          bookingsByDateMap[dateKey].lunch = true;
        } else {
          bookingsByDateMap[dateKey].dinner = true;
        }
      });

      // Extract unique dates with bookings
      const uniqueDates = Object.keys(bookingsByDateMap).map(
        (dateStr) => new Date(dateStr)
      );

      setDatesWithBookings(uniqueDates);
      setBookingsByDate(bookingsByDateMap);

      // Count pending confirmations
      const pendingCount = sortedData.filter(
        (booking) =>
          booking.status === "pending" &&
          isPast(new Date(booking.date)) &&
          !isToday(new Date(booking.date))
      ).length;

      setPendingConfirmations(pendingCount);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if we're in the browser environment (not during SSR)
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("bookingViewMode");
      if (savedViewMode === "list" || savedViewMode === "card") {
        setViewMode(savedViewMode as ViewMode);
      } else {
        setViewMode("card");
      }
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBookings();
    }
  }, [status]);

  // Apply filters to bookings
  const applyFilters = (
    allBookings: IBooking[],
    filter: DateFilter,
    date: Date
  ) => {
    const today = startOfDay(new Date());
    let filtered: IBooking[] = [];

    // For regular users, only show their own apartment's bookings
    let userBookings = allBookings;
    if (session?.user.role === 'user') {
      userBookings = allBookings.filter(booking => 
        booking.apartmentNumber === session.user.apartmentNumber
      );
    }

    switch (filter) {
      case "today":
        filtered = userBookings.filter((booking) =>
          isToday(new Date(booking.date))
        );
        break;
      case "future":
        filtered = userBookings.filter(
          (booking) =>
            isFuture(new Date(booking.date)) || isToday(new Date(booking.date))
        );
        break;
      case "past":
        filtered = userBookings.filter(
          (booking) =>
            isPast(new Date(booking.date)) && !isToday(new Date(booking.date))
        );
        break;
      case "pending-confirmation":
        filtered = userBookings.filter(
          (booking) =>
            booking.status === "pending" &&
            isPast(new Date(booking.date)) &&
            !isToday(new Date(booking.date))
        );
        break;
      case "specific":
        const selectedDateStart = startOfDay(date);
        const selectedDateEnd = endOfDay(date);

        filtered = userBookings.filter((booking) => {
          const bookingDate = new Date(booking.date);
          return (
            bookingDate >= selectedDateStart && bookingDate <= selectedDateEnd
          );
        });
        break;
      case "all":
      default:
        filtered = userBookings;
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
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          status: "pending", // Ensure new bookings are created with pending status
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear la reserva");
      }

      // Close form and update bookings
      setShowForm(false);
      fetchBookings();
      toast.success("Reserva Creada", {
        description: `Apt #${
          data.apartmentNumber
        } ha reservado las mesas ${data.tables?.join(", ")} para ${
          data.mealType === "lunch" ? "comida" : "cena"
        } el ${format(data.date as Date, "d MMM, yyyy", { locale: es })}`,
      });
    } catch (err: any) {
      throw err;
    }
  };

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

  const handleDeleteBooking = async (booking: IBooking) => {
    setDeletingBooking(booking);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBooking = async () => {
    if (!deletingBooking?._id) return;

    try {
      const res = await fetch(`/api/bookings/${deletingBooking._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar la reserva");
      }

      // Update bookings
      fetchBookings();
      toast.error("Reserva Eliminada", {
        description: "La reserva ha sido eliminada correctamente",
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setShowDeleteDialog(false);
      setDeletingBooking(null);
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

      // Update bookings
      fetchBookings();
      toast.success("Reserva Confirmada", {
        description: `Reserva confirmada con ${data.finalAttendees} asistentes finales`,
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
      throw err;
    }
  };

  // Get all booked tables for selected date and meal type
  const getBookedTablesForDateAndMeal = (date: Date, mealType: MealType) => {
    const selectedDateStart = startOfDay(date);
    const selectedDateEnd = endOfDay(date);

    const bookingsForDate = bookings.filter((booking) => {
      const bookingDate = new Date(booking.date);
      return (
        bookingDate >= selectedDateStart &&
        bookingDate <= selectedDateEnd &&
        booking.mealType === mealType
      );
    });

    return new Set(bookingsForDate.flatMap((booking) => booking.tables));
  };

  const bookedTablesLunch = getBookedTablesForDateAndMeal(
    selectedDate,
    "lunch"
  );
  const availableTablesLunch = [1, 2, 3, 4, 5, 6].filter(
    (table) => !bookedTablesLunch.has(table)
  );

  const bookedTablesDinner = getBookedTablesForDateAndMeal(
    selectedDate,
    "dinner"
  );
  const availableTablesDinner = [1, 2, 3, 4, 5, 6].filter(
    (table) => !bookedTablesDinner.has(table)
  );

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);

    // If switching to 'specific' and not already on a specific date, set today
    if (filter === "specific") {
      setSelectedDate(new Date());
    }
  };

  // Group bookings by date for list view
  const groupedBookings: { [key: string]: IBooking[] } = {};

  filteredBookings.forEach((booking) => {
    const dateKey = format(new Date(booking.date), "yyyy-MM-dd");
    if (!groupedBookings[dateKey]) {
      groupedBookings[dateKey] = [];
    }
    groupedBookings[dateKey].push(booking);
  });

  // Sort date keys chronologically
  const sortedDateKeys = Object.keys(groupedBookings).sort();

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode = viewMode === "card" ? "list" : "card";
    setViewMode(newMode);
    // Save to localStorage
    localStorage.setItem("bookingViewMode", newMode);
  };

  const handleNewBooking = () => {
    setShowForm(true);
  };

  // Format date in Spanish
  const formatDateEs = (date: Date, formatStr: string) => {
    return format(date, formatStr, { locale: es });
  };

  // Custom day rendering for the date picker to highlight dates with bookings
  const renderDayContents = (day: number, date: Date | undefined) => {
    if (!date) return <span>{day}</span>;

    const dateKey = format(date, "yyyy-MM-dd");
    const bookingInfo = bookingsByDate[dateKey];

    return (
      <div className="relative">
        <span>{day}</span>
        {bookingInfo && (
          <>
            {bookingInfo.lunch && bookingInfo.dinner && (
              <div
                className="booking-indicator booking-dot-both"
                title="Reservas para comida y cena"
              />
            )}
            {bookingInfo.lunch && !bookingInfo.dinner && (
              <div
                className="booking-indicator booking-indicator-lunch booking-dot-lunch"
                title="Reservas para comida"
              />
            )}
            {!bookingInfo.lunch && bookingInfo.dinner && (
              <div
                className="booking-indicator booking-indicator-dinner booking-dot-dinner"
                title="Reservas para cena"
              />
            )}
          </>
        )}
      </div>
    );
  };

  // Handle loading state during authentication check
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <p>You must be signed in to view this page</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6 sm:mb-8">
        {/* Top header with title, user guide, and user menu */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <Link href="/">Sociedad Roncesvalles</Link>
          </h1>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              <Link href="/how-to-use">
                <BookOpen className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Guía de Uso</span>
                <span className="sm:hidden">Guía</span>
              </Link>
            </Button>
            <UserMenu />
          </div>
        </div>
        
        {/* Date picker and action buttons */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          {/* Date picker container */}
          <div className="custom-datepicker-container w-full">
            <div className="relative flex items-center w-full">
              <div className="absolute left-3 pointer-events-none text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => {
                  setSelectedDate(date);
                  setDateFilter("specific");
                }}
                dateFormat="d MMMM, yyyy"
                locale="es"
                className="w-full pl-10 p-2 border rounded-md"
                renderDayContents={renderDayContents}
                customInput={
                  <input
                    className="w-full pl-10 p-2 border rounded-md cursor-pointer"
                    readOnly
                  />
                }
              />
            </div>
  
            <div className="datepicker-legend">
              <div className="datepicker-legend-item">
                <div className="datepicker-legend-dot booking-dot-lunch"></div>
                <span>Comida</span>
              </div>
              <div className="datepicker-legend-item">
                <div className="datepicker-legend-dot booking-dot-dinner"></div>
                <span>Cena</span>
              </div>
              <div className="datepicker-legend-item">
                <div className="datepicker-legend-dot booking-dot-both"></div>
                <span>Ambas</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <InfoIcon className="h-3 w-3" />
                <span>Fechas con reservas</span>
              </div>
            </div>
          </div>
  
          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            {/* Primary booking actions */}
            <Button
              onClick={handleNewBooking}
              size="sm"
              className="cursor-pointer flex-grow sm:flex-grow-0"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nueva Reserva</span>
              <span className="sm:hidden">Reservar</span>
            </Button>
            
            {pendingConfirmations > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateFilterChange("pending-confirmation")}
                className="cursor-pointer flex-grow sm:flex-grow-0 text-amber-700 border-amber-500"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                <span className="hidden sm:inline">{pendingConfirmations} por confirmar</span>
                <span className="sm:hidden">{pendingConfirmations} confirmar</span>
              </Button>
            )}
            
            <Button
              asChild
              variant="outline"
              size="sm"
              className="cursor-pointer flex-grow sm:flex-grow-0"
            >
              <Link href="/activity">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ver Actividad</span>
                <span className="sm:hidden">Actividad</span>
              </Link>
            </Button>
            
            {/* Export button (only for admin or it_admin users) */}
            {(session?.user?.role === 'admin' || session?.user?.role === 'it_admin') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                className="cursor-pointer ml-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            )}
          </div>
        </div>
  
        {/* Tabs for meal type selection */}
        <Tabs
          defaultValue="lunch"
          onValueChange={(value) => setSelectedMealType(value as MealType)}
          className="w-full"
        >
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="lunch" className="flex-1">
              Comida
            </TabsTrigger>
            <TabsTrigger value="dinner" className="flex-1">
              Cena
            </TabsTrigger>
          </TabsList>
          <TabsContent value="lunch">
            <Card>
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm sm:text-md flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Mesas disponibles para comida el{" "}
                  {formatDateEs(selectedDate, "d MMM, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {availableTablesLunch.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTablesLunch.map((table) => (
                      <Badge
                        key={table}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Mesa #{table}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">
                    Todas las mesas están reservadas para comida en esta fecha.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dinner">
            <Card>
              <CardHeader className="pb-3 px-4">
                <CardTitle className="text-sm sm:text-md flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Mesas disponibles para cena el{" "}
                  {formatDateEs(selectedDate, "d MMM, yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                {availableTablesDinner.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTablesDinner.map((table) => (
                      <Badge
                        key={table}
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Mesa #{table}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500 text-sm">
                    Todas las mesas están reservadas para cena en esta fecha.
                  </p>
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
        initialData={{ 
          date: selectedDate, 
          mealType: selectedMealType, 
          apartmentNumber: session?.user?.role === 'user' ? session.user.apartmentNumber : undefined
        }}
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
  
      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
  
      <br />
      {/* List view title with filter info - MOVED VIEW TOGGLE AND DATE FILTER BUTTONS HERE */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">
              {dateFilter === "today" && "Reservas de Hoy"}
              {dateFilter === "future" && "Próximas Reservas"}
              {dateFilter === "past" && "Reservas Pasadas"}
              {dateFilter === "pending-confirmation" &&
                "Reservas Pendientes de Confirmación"}
              {dateFilter === "specific" &&
                `Reservas para ${formatDateEs(selectedDate, "d MMMM, yyyy")}`}
              {dateFilter === "all" && "Todas las Reservas"}
            </h2>
            
            {/* VIEW TOGGLE BUTTON */}
            <Button
              onClick={toggleViewMode}
              variant="outline"
              size="sm"
              className="cursor-pointer"
            >
              {viewMode === "card" ? (
                <>
                  <List className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Vista Lista</span>
                  <span className="sm:hidden">Lista</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Vista Tarjetas</span>
                  <span className="sm:hidden">Tarjetas</span>
                </>
              )}
            </Button>
          </div>
          
          {filteredBookings.length === 0 &&
            dateFilter !== "pending-confirmation" && (
              <Button
                variant="outline"
                onClick={() => setDateFilter("future")}
                size="sm"
                className="w-full sm:w-auto"
              >
                Ver Próximas Reservas
              </Button>
            )}
          {dateFilter === "pending-confirmation" &&
            filteredBookings.length === 0 && (
              <div className="flex items-center text-muted-foreground text-sm">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                No hay reservas pendientes de confirmación
              </div>
            )}
        </div>
        
        {/* DATE FILTER BUTTONS MOVED HERE */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={dateFilter === "today" ? "default" : "outline"}
            onClick={() => handleDateFilterChange("today")}
            className="cursor-pointer"
            size="sm"
          >
            Hoy
          </Button>
          <Button
            variant={dateFilter === "future" ? "default" : "outline"}
            onClick={() => handleDateFilterChange("future")}
            className="cursor-pointer"
            size="sm"
          >
            Próximas
          </Button>
          <Button
            variant={dateFilter === "past" ? "default" : "outline"}
            onClick={() => handleDateFilterChange("past")}
            className="cursor-pointer"
            size="sm"
          >
            Pasadas
          </Button>
        </div>
      </div>
      <Separator className="mb-4" />
  
      {/* Bookings display - Card or List view */}
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-6 sm:space-y-8">
          {sortedDateKeys.map((dateKey) => {
            const bookingsForDate = groupedBookings[dateKey];
            const bookingDate = new Date(dateKey);
            const isBookingToday = isToday(bookingDate);
            const isBookingFuture = isFuture(bookingDate);
            const isBookingPast = isPast(bookingDate) && !isToday(bookingDate);
  
            // Determine the appropriate status badge
            let statusBadge = null;
            if (isBookingToday) {
              statusBadge = (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Hoy
                </Badge>
              );
            } else if (isBookingFuture) {
              statusBadge = (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Próxima
                </Badge>
              );
            } else if (isBookingPast) {
              statusBadge = (
                <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                  Pasada
                </Badge>
              );
            }
  
            // Check if there are any pending confirmations for this date
            const pendingForDate = bookingsForDate.some(
              (booking) => booking.status === "pending" && isBookingPast
            );
  
            return (
              <div key={dateKey}>
                <div className="flex justify-between items-center mb-3 bg-gray-100 p-2 rounded">
                  <h3 className="text-base sm:text-lg font-medium flex items-center gap-2">
                    {formatDateEs(bookingDate, "EEEE, d MMMM, yyyy")}
                    {pendingForDate && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 ml-2"
                      >
                        Confirmaciones pendientes
                      </Badge>
                    )}
                  </h3>
                  {statusBadge}
                </div>
  
                {viewMode === "card" ? (
                  // Card View
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {bookingsForDate
                      .sort((a, b) => {
                        // First by meal type (lunch first, then dinner)
                        if (a.mealType !== b.mealType) {
                          return a.mealType === "lunch" ? -1 : 1;
                        }
                        // Then by apartment number
                        return a.apartmentNumber - b.apartmentNumber;
                      })
                      .map((booking) => (
                        <BookingCard
                          key={booking._id as string}
                          booking={booking}
                          onEdit={() => setEditingBooking(booking)}
                          onDelete={() => handleDeleteBooking(booking)}
                          onConfirm={() => setConfirmingBooking(booking)}
                          isPast={isBookingPast}
                          session={session}
                        />
                      ))}
                  </div>
                ) : (
                  // List View
                  <div className="flex flex-col gap-3">
                    {bookingsForDate
                      .sort((a, b) => {
                        // First by meal type (lunch first, then dinner)
                        if (a.mealType !== b.mealType) {
                          return a.mealType === "lunch" ? -1 : 1;
                        }
                        // Then by apartment number
                        return a.apartmentNumber - b.apartmentNumber;
                      })
                      .map((booking) => (
                        <BookingListItem
                          key={booking._id as string}
                          booking={booking}
                          onEdit={() => setEditingBooking(booking)}
                          onDelete={() => handleDeleteBooking(booking)}
                          onConfirm={() => setConfirmingBooking(booking)}
                          isPast={isBookingPast}
                          session={session}
                        />
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground py-6 sm:py-8 text-center">
          {dateFilter === "today" && "No hay reservas para hoy."}
          {dateFilter === "future" && "No hay próximas reservas."}
          {dateFilter === "past" && "No hay reservas pasadas."}
          {dateFilter === "pending-confirmation" &&
            "No hay reservas pendientes de confirmación."}
          {dateFilter === "specific" &&
            `No hay reservas para ${formatDateEs(
              selectedDate,
              "d MMMM, yyyy"
            )}.`}
          {dateFilter === "all" && "No hay reservas disponibles."}
        </p>
      )}
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