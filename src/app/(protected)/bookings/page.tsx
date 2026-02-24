// src/app/(protected)/bookings/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookingsDateSkeleton,
  BookingsListSkeleton,
} from "@/components/BookingCardSkeleton";
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
  StickyNote,
  Save,
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
import { useSessionReady } from "@/components/auth/auth-components";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Registrar el idioma español para el datepicker
registerLocale("es", es);

// Create a skeleton for the available tables
const TablesSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-7 w-16 bg-gray-200 animate-pulse rounded-full"
        />
      ))}
    </div>
  );
};

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
  const sessionReady = useSessionReady(status);
  const router = useRouter();

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // State for Internal Notes (Conserje/IT Admin)
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteBooking, setNoteBooking] = useState<IBooking | null>(null);
  const [internalNoteText, setInternalNoteText] = useState("");

  const [loadingTables, setLoadingTables] = useState(true);
  const [availableTablesLunch, setAvailableTablesLunch] = useState<number[]>(
    []
  );
  const [availableTablesDinner, setAvailableTablesDinner] = useState<number[]>(
    []
  );

  // Add view mode state
  const [viewMode, setViewMode] = useState<ViewMode>(undefined);

  // Add state for bookings by date and meal type
  const [bookingsByDate, setBookingsByDate] = useState<{
    [key: string]: { lunch: boolean; dinner: boolean };
  }>({});

  const fetchBookings = async () => {
    setLoading(true);
    setError("");

    try {
      // Get all the user's bookings for display in their list
      const res = await fetch("/api/bookings");

      if (!res.ok) {
        if (res.status === 401) {
          // Authentication error - handle session expiration
          toast.error("Sesión expirada", {
            description:
              "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
          });

          // Use a timeout to allow the toast to be seen
          setTimeout(() => {
            router.push("/auth/signin?callbackUrl=/bookings");
          }, 2000);
          return;
        }

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

      // Now fetch ALL bookings for calendar indicators (not just the user's bookings)
      const calendarRes = await fetch("/api/bookings?forCalendar=true");

      if (calendarRes.ok) {
        const allBookings = await calendarRes.json();

        // Process all bookings to show in calendar
        allBookings.forEach((booking: IBooking) => {
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
      }

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

      // Now fetch ALL bookings for the selected date to check availability
      updateAvailableTables(selectedDate);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Separate function to update available tables based on selected date
  const updateAvailableTables = async (date: Date) => {
    try {
      // Set loading state to true when we start loading tables
      setLoadingTables(true);

      const selectedDateString = date.toISOString().split("T")[0];

      // Make two separate requests for lunch and dinner availability
      const lunchRes = await fetch(
        `/api/bookings?date=${selectedDateString}&mealType=lunch&availabilityCheck=true`
      );
      const dinnerRes = await fetch(
        `/api/bookings?date=${selectedDateString}&mealType=dinner&availabilityCheck=true`
      );

      if (lunchRes.ok && dinnerRes.ok) {
        const lunchBookings = await lunchRes.json();
        const dinnerBookings = await dinnerRes.json();

        // Get all tables booked for lunch and dinner
        const lunchBookedTables = new Set(
          lunchBookings.flatMap((booking: IBooking) => booking.tables)
        );
        const dinnerBookedTables = new Set(
          dinnerBookings.flatMap((booking: IBooking) => booking.tables)
        );

        // Calculate available tables by excluding booked tables
        const availableLunch = [1, 2, 3, 4, 5, 6].filter(
          (table) => !lunchBookedTables.has(table)
        );

        const availableDinner = [1, 2, 3, 4, 5, 6].filter(
          (table) => !dinnerBookedTables.has(table)
        );

        // Update state with available tables
        setAvailableTablesLunch(availableLunch);
        setAvailableTablesDinner(availableDinner);
      }
    } catch (err) {
      console.error("Error fetching available tables:", err);
    } finally {
      // Set loading to false when done, regardless of success or failure
      setLoadingTables(false);
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
      if (session?.user?.role === "user") {
        setDateFilter("future");
      }
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
    // Admins and Conserjes can see all bookings
    let userBookings = allBookings;
    if (session?.user.role === "user") {
      userBookings = allBookings.filter(
        (booking) => booking.apartmentNumber === session.user.apartmentNumber
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

  // When you need to check for booked tables and update the available tables:
  useEffect(() => {
    updateAvailableTables(selectedDate);
  }, [selectedDate]); // This will run whenever the selected date changes

  const handleCreateBooking = async (data: Partial<IBooking>) => {
    // Prevent admin (read-only) from creating bookings
    if (session?.user?.role === "admin") {
      toast.error("Acceso Denegado", {
        description: "No tiene permisos para crear reservas.",
      });
      return;
    }

    try {
      // Ensure userId is included explicitly
      const bookingData = {
        ...data,
        status: "pending", // Ensure new bookings are created with pending status
        userId: session?.user?.id, // Add user ID from session
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        // Handle authentication errors
        if (res.status === 401) {
          toast.error("Sesión expirada", {
            description:
              "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
          });

          setTimeout(() => {
            router.push("/auth/signin?callbackUrl=/bookings");
          }, 2000);
          return;
        }

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
      console.error("Create booking error:", err);
      toast.error("Error", {
        description: err.message || "Error al crear la reserva",
      });
      throw err;
    }
  };

  const handleUpdateBooking = async (data: Partial<IBooking>) => {
    if (!editingBooking?._id) return;

    // Prevent admin (read-only) from updating bookings
    if (session?.user?.role === "admin") {
      toast.error("Acceso Denegado", {
        description: "No tiene permisos para actualizar reservas.",
      });
      return;
    }

    try {
      // Ensure userId is included explicitly
      const bookingData = {
        ...data,
        userId: session?.user?.id, // Make sure userId is included in updates
      };

      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        // Handle authentication errors
        if (res.status === 401) {
          toast.error("Sesión expirada", {
            description:
              "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
          });

          setTimeout(() => {
            router.push("/auth/signin?callbackUrl=/bookings");
          }, 2000);
          return;
        }

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
      console.error("Update booking error:", err);
      toast.error("Error", {
        description: err.message || "Error al actualizar la reserva",
      });
      throw err;
    }
  };

  const handleDeleteBooking = async (booking: IBooking) => {
    setDeletingBooking(booking);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBooking = async () => {
    if (!deletingBooking?._id) return;

    // Prevent admin (read-only) from deleting bookings
    if (session?.user.role === "admin") {
      toast.error("Acceso Denegado", {
        description: "No tiene permisos para eliminar reservas.",
      });
      setShowDeleteDialog(false);
      setDeletingBooking(null);
      return;
    }

    setIsSubmitting(true);

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
      setIsSubmitting(false);
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

  // --- NEW HANDLERS: Internal Notes (For Conserje/IT Admin) ---
  const handleOpenNoteDialog = (booking: IBooking) => {
    setNoteBooking(booking);
    setInternalNoteText(booking.internalNotes || "");
    setShowNoteDialog(true);
  };

  const handleSaveInternalNote = async () => {
    if (!noteBooking?._id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${noteBooking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalNotes: internalNoteText,
          // Sending original data to pass potential strict validation in backend if user is IT Admin
          apartmentNumber: noteBooking.apartmentNumber,
          date: noteBooking.date,
          mealType: noteBooking.mealType,
          tables: noteBooking.tables,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar la nota");

      // Refresh local state
      await fetchBookings();
      toast.success("Nota interna actualizada");
      setShowNoteDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
  if (!sessionReady) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin?callbackUrl=/bookings");
    return null;
  }

  return (
    <div className="max-w-6xl mb-32 mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6 sm:mb-8">
        {/* Top header with title, user guide, and user menu */}
        <div className="flex justify-between items-center gap-2 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            <Link href="/">Sociedad Roncesvalles</Link>
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-2 sm:h-9 sm:px-3"
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

        <br />

        {/* New Booking Section - Clearly marked and separated */}
        <div className="mb-6 p-4 border rounded-lg bg-slate-50 shadow-sm">
          {/* Title and action buttons in a column on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
              Disponibilidad
            </h2>

            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
              {session?.user?.role === "user" && (
                <Button
                  onClick={handleNewBooking}
                  size="sm"
                  className="cursor-pointer bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 px-4 w-full sm:w-auto"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nueva Reserva</span>
                  <span className="sm:hidden">Reservar</span>
                </Button>
              )}

              {session?.user?.role === "user" && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="cursor-pointer w-full sm:w-auto"
                >
                  <Link href="/activity">
                    <History className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Ver Actividad</span>
                    <span className="sm:hidden">Actividad</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Date picker */}
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
                  onFocus={(e) => e.target.blur()}
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

            {/* Display pending confirmations button if needed */}
            {pendingConfirmations > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateFilterChange("pending-confirmation")}
                className="cursor-pointer text-amber-700 border-amber-500 w-full sm:w-auto"
              >
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                <span>
                  {pendingConfirmations} reservas pendientes por confirmar
                </span>
              </Button>
            )}
          </div>

          {/* Activity and Export buttons for admin/conserje/it_admin */}
          {(session?.user?.role === "admin" ||
            session?.user?.role === "it_admin" ||
            session?.user?.role === "conserje") && (
            <div className="flex gap-2 mb-4">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="cursor-pointer flex-1 sm:flex-none"
              >
                <Link href="/activity">
                  <History className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ver Actividad</span>
                  <span className="sm:hidden">Actividad</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                className="cursor-pointer flex-1 sm:flex-none"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          )}

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
                  {loadingTables ? (
                    <TablesSkeleton />
                  ) : availableTablesLunch.length > 0 ? (
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
                      Todas las mesas están reservadas para comida en esta
                      fecha.
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
                  {loadingTables ? (
                    <TablesSkeleton />
                  ) : availableTablesDinner.length > 0 ? (
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
        </div>
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
          apartmentNumber:
            session?.user?.role === "user"
              ? session.user.apartmentNumber
              : undefined,
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

      {/* Delete Confirmation Dialog */}
      {deletingBooking && (
        <DeleteConfirmationDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDeleteBooking}
          apartmentNumber={deletingBooking.apartmentNumber}
          date={new Date(deletingBooking.date)}
          mealType={deletingBooking.mealType}
          isDeleting={isSubmitting}
        />
      )}

      {/* Internal Notes Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" />
              Notas Internas (Conserjería)
            </DialogTitle>
            <DialogDescription>
              Estas notas solo son visibles para conserjes y administradores.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="Escriba aquí anotaciones..."
              rows={5}
              className="bg-amber-50 border-amber-200 focus-visible:ring-amber-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInternalNote}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Guardar Nota
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <br />
      {/* List view title with filter info */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">
              {dateFilter === "today" && "Reservas de Hoy"}
              {dateFilter === "future" && "Próximas Reservas"}
              {dateFilter === "past" && "Reservas Pasadas"}
              {dateFilter === "pending-confirmation" &&
                "Pendientes de Confirmación"}
              {dateFilter === "specific" &&
                `Reservas del ${formatDateEs(selectedDate, "d MMMM, yyyy")}`}
              {dateFilter === "all" && "Todas las Reservas"}
            </h2>

            {/* VIEW TOGGLE BUTTON */}
            <Button
              onClick={toggleViewMode}
              variant="outline"
              size="sm"
              className="cursor-pointer hidden sm:inline-flex"
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

        {/* DATE FILTER BUTTONS */}
        <div className="flex gap-2 flex-wrap">
          {session?.user?.role !== "user" && (
            <Button
              variant={dateFilter === "today" ? "default" : "outline"}
              onClick={() => handleDateFilterChange("today")}
              className="cursor-pointer"
              size="sm"
            >
              Hoy
            </Button>
          )}
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
        <div>
          {viewMode === "list" ? (
            <BookingsListSkeleton />
          ) : (
            <BookingsDateSkeleton />
          )}
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

            // Pre-sorted list for consistent rendering order
            const sortedBookingsForDate = bookingsForDate.sort((a, b) => {
              if (a.mealType !== b.mealType) {
                return a.mealType === "lunch" ? -1 : 1;
              }
              return a.apartmentNumber - b.apartmentNumber;
            });

            const isRegularUser = session?.user?.role === "user";

            return (
              <div key={dateKey}>
                {!isRegularUser && (
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
                )}

                {/* Mobile View: Always List View */}
                <div className="sm:hidden flex flex-col gap-3">
                  {sortedBookingsForDate.map((booking) => (
                    <BookingListItem
                      key={booking._id as string}
                      booking={booking}
                      onEdit={() => setEditingBooking(booking)}
                      onDelete={() => handleDeleteBooking(booking)}
                      onConfirm={() => setConfirmingBooking(booking)}
                      onEditNote={handleOpenNoteDialog}
                      isPast={isBookingPast}
                      session={session}
                    />
                  ))}
                </div>

                {/* Desktop View: Toggled via viewMode state */}
                <div className="hidden sm:block">
                  {viewMode === "card" ? (
                    // Card View
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {sortedBookingsForDate.map((booking) => (
                        <BookingCard
                          key={booking._id as string}
                          booking={booking}
                          onEdit={() => setEditingBooking(booking)}
                          onDelete={() => handleDeleteBooking(booking)}
                          onConfirm={() => setConfirmingBooking(booking)}
                          onEditNote={handleOpenNoteDialog}
                          isPast={isBookingPast}
                          session={session}
                        />
                      ))}
                    </div>
                  ) : (
                    // List View
                    <div className="flex flex-col gap-3">
                      {sortedBookingsForDate.map((booking) => (
                        <BookingListItem
                          key={booking._id as string}
                          booking={booking}
                          onEdit={() => setEditingBooking(booking)}
                          onDelete={() => handleDeleteBooking(booking)}
                          onConfirm={() => setConfirmingBooking(booking)}
                          onEditNote={handleOpenNoteDialog}
                          isPast={isBookingPast}
                          session={session}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
    </div>
  );
}