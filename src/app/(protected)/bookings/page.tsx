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
import {
  Download,
  PlusCircle,
  History,
  CalendarIcon,
  LayoutGrid,
  List,
  InfoIcon,
  StickyNote,
  Save,
  ShieldAlert,
  Flame,
  Lock,
  CalendarX,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import BookingCard from "@/components/BookingCard";
import BookingListItem from "@/components/BookingListItem";
import BookingFormModal from "@/components/BookingFormModal";
import ExportDialog from "@/components/ExportDialog";
import Pagination from "@/components/Pagination";
import { IBooking, MealType } from "@/models/Booking";
import { IBlockedDate, BlockedMealType } from "@/models/BlockedDate";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PageContainer,
  PageHeader,
  SectionHeader,
} from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

// Registrar el idioma español para el datepicker
registerLocale("es", es);

const ALL_TABLES = [1, 2, 3, 4, 5, 6];

// Create a skeleton for the available tables
const TablesSkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {ALL_TABLES.map((i) => (
        <Skeleton key={i} className="h-[68px] rounded-lg" />
      ))}
    </div>
  );
};

type DateFilter =
  | "all"
  | "today"
  | "future"
  | "past"
  | "specific";
type ViewMode = "card" | "list" | undefined;

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<MealType>("lunch");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [, setDatesWithBookings] = useState<Date[]>([]);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deletingBooking, setDeletingBooking] = useState<IBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for Internal Notes (Conserje/IT Admin)
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteBooking, setNoteBooking] = useState<IBooking | null>(null);
  const [internalNoteText, setInternalNoteText] = useState("");
  const [cleaningHoursText, setCleaningHoursText] = useState("");

  const [loadingTables, setLoadingTables] = useState(true);
  const [availableTablesLunch, setAvailableTablesLunch] = useState<number[]>(
    []
  );
  const [availableTablesDinner, setAvailableTablesDinner] = useState<number[]>(
    []
  );
  const [blockedLunch, setBlockedLunch] = useState<IBlockedDate | null>(null);
  const [blockedDinner, setBlockedDinner] = useState<IBlockedDate | null>(null);

  // Blocks list for admin/conserje list view
  const [blocks, setBlocks] = useState<IBlockedDate[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<IBlockedDate[]>([]);

  // Add view mode state
  const [viewMode, setViewMode] = useState<ViewMode>(undefined);

  // Add state for bookings by date and meal type (including block indicators)
  const [bookingsByDate, setBookingsByDate] = useState<{
    [key: string]: { lunch: boolean; dinner: boolean; blockedLunch?: boolean; blockedDinner?: boolean };
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
        [key: string]: { lunch: boolean; dinner: boolean; blockedLunch?: boolean; blockedDinner?: boolean };
      } = {};

      // Fetch all bookings and blocked dates for calendar indicators in parallel
      const [calendarRes, blocksCalRes] = await Promise.all([
        fetch("/api/bookings?forCalendar=true"),
        fetch("/api/blocked-dates"),
      ]);

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

      // Add blocked date indicators to calendar map
      if (blocksCalRes.ok) {
        const allBlocks: IBlockedDate[] = await blocksCalRes.json();
        setBlocks(allBlocks);
        applyBlockFilters(allBlocks, dateFilter, selectedDate);
        allBlocks.forEach((block) => {
          const dateKey = format(new Date(block.date), "yyyy-MM-dd");
          if (!bookingsByDateMap[dateKey]) {
            bookingsByDateMap[dateKey] = { lunch: false, dinner: false };
          }
          if (block.mealType === "both") {
            bookingsByDateMap[dateKey].blockedLunch = true;
            bookingsByDateMap[dateKey].blockedDinner = true;
          } else if (block.mealType === "lunch") {
            bookingsByDateMap[dateKey].blockedLunch = true;
          } else {
            bookingsByDateMap[dateKey].blockedDinner = true;
          }
        });
      }

      // Extract unique dates with bookings
      const uniqueDates = Object.keys(bookingsByDateMap).map(
        (dateStr) => new Date(dateStr)
      );

      setDatesWithBookings(uniqueDates);
      setBookingsByDate(bookingsByDateMap);

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

      // Make two separate requests for lunch and dinner availability,
      // plus a request to check for blocked dates
      const [lunchRes, dinnerRes, blockRes] = await Promise.all([
        fetch(`/api/bookings?date=${selectedDateString}&mealType=lunch&availabilityCheck=true`),
        fetch(`/api/bookings?date=${selectedDateString}&mealType=dinner&availabilityCheck=true`),
        fetch(`/api/blocked-dates?date=${selectedDateString}`),
      ]);

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

      // Check for blocked dates
      if (blockRes.ok) {
        const blocks: IBlockedDate[] = await blockRes.json();
        const lunchBlock = blocks.find(
          (b) => b.mealType === "lunch" || b.mealType === "both"
        ) || null;
        const dinnerBlock = blocks.find(
          (b) => b.mealType === "dinner" || b.mealType === "both"
        ) || null;
        setBlockedLunch(lunchBlock);
        setBlockedDinner(dinnerBlock);
      } else {
        setBlockedLunch(null);
        setBlockedDinner(null);
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

  // Apply date filters to blocks (for admin/conserje list view)
  const applyBlockFilters = (
    allBlocks: IBlockedDate[],
    filter: DateFilter,
    date: Date
  ) => {
    let filtered: IBlockedDate[] = [];

    switch (filter) {
      case "today":
        filtered = allBlocks.filter((block) => isToday(new Date(block.date)));
        break;
      case "future":
        filtered = allBlocks.filter(
          (block) =>
            isFuture(new Date(block.date)) || isToday(new Date(block.date))
        );
        break;
      case "past":
        filtered = allBlocks.filter(
          (block) =>
            isPast(new Date(block.date)) && !isToday(new Date(block.date))
        );
        break;
      case "specific": {
        const selectedDateStart = startOfDay(date);
        const selectedDateEnd = endOfDay(date);
        filtered = allBlocks.filter((block) => {
          const blockDate = new Date(block.date);
          return blockDate >= selectedDateStart && blockDate <= selectedDateEnd;
        });
        break;
      }
      case "all":
      default:
        filtered = allBlocks;
        break;
    }

    setFilteredBlocks(filtered);
  };

  // Update filters when date filter or selected date changes
  useEffect(() => {
    applyFilters(bookings, dateFilter, selectedDate);
    applyBlockFilters(blocks, dateFilter, selectedDate);
    setCurrentPage(1);
  }, [dateFilter, selectedDate, bookings, blocks]);

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

  // --- NEW HANDLERS: Internal Notes (For Conserje/IT Admin) ---
  const handleOpenNoteDialog = (booking: IBooking) => {
    setNoteBooking(booking);
    setInternalNoteText(booking.internalNotes || "");
    setCleaningHoursText(
      typeof booking.cleaningHours === "number" ? String(booking.cleaningHours) : ""
    );
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
          cleaningHours: noteBooking.noCleaningService
            ? cleaningHoursText.trim() === ""
              ? null
              : Number(cleaningHoursText)
            : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar la nota");
      }

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

  // Merged list of bookings + blocks for admin/conserje list view
  const isAdminOrConserje =
    session?.user?.role === "admin" || session?.user?.role === "conserje";

  const isRegularUser = session?.user?.role === "user";
  const canExport =
    session?.user?.role === "admin" ||
    session?.user?.role === "it_admin" ||
    session?.user?.role === "conserje";

  type MergedItem =
    | { kind: "booking"; item: IBooking }
    | { kind: "block"; item: IBlockedDate };

  const MEAL_LABELS: Record<BlockedMealType, string> = {
    lunch: "Comida",
    dinner: "Cena",
    both: "Comida y Cena",
  };

  const MEAL_TONES: Record<BlockedMealType, StatusTone> = {
    lunch: "warning",
    dinner: "info",
    both: "neutral",
  };

  const mergedList: MergedItem[] = isAdminOrConserje
    ? [
        ...filteredBookings.map((b): MergedItem => ({ kind: "booking", item: b })),
        ...filteredBlocks.map((b): MergedItem => ({ kind: "block", item: b })),
      ].sort((a, b) => new Date(b.item.date).getTime() - new Date(a.item.date).getTime())
    : [];

  const totalPages = Math.max(1, Math.ceil(mergedList.length / itemsPerPage));
  const paginatedMergedList = mergedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
            {(bookingInfo.blockedLunch || bookingInfo.blockedDinner) && (
              <div
                className="booking-indicator booking-dot-blocked"
                style={{ bottom: "-6px" }}
                title={
                  bookingInfo.blockedLunch && bookingInfo.blockedDinner
                    ? "Fecha bloqueada (Comida y Cena)"
                    : bookingInfo.blockedLunch
                    ? "Comida bloqueada"
                    : "Cena bloqueada"
                }
              />
            )}
          </>
        )}
      </div>
    );
  };

  // AuthLoader in NextAuthProvider already blocks rendering until the session
  // has durably settled, so by the time this page renders, status is either
  // "authenticated" or genuinely "unauthenticated". No bounce handling needed here.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/bookings");
    }
  }, [status, router]);

  useEffect(() => {
    if (!isAdminOrConserje) return;
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, isAdminOrConserje]);

  if (status === "loading" || status === "unauthenticated") {
    return null;
  }

  const activeAvailableTables =
    selectedMealType === "lunch" ? availableTablesLunch : availableTablesDinner;
  const activeBlockedDate =
    selectedMealType === "lunch" ? blockedLunch : blockedDinner;

  const listTitle =
    dateFilter === "today"
      ? "Reservas de Hoy"
      : dateFilter === "future"
      ? "Próximas Reservas"
      : dateFilter === "past"
      ? "Reservas Pasadas"
      : dateFilter === "specific"
      ? `Reservas del ${formatDateEs(selectedDate, "d MMMM, yyyy")}`
      : "Todas las Reservas";

  const hasResults = isAdminOrConserje
    ? mergedList.length > 0
    : filteredBookings.length > 0;

  const emptyDescription = isAdminOrConserje
    ? {
        today: "No hay reservas ni bloqueos para hoy.",
        future: "No hay próximas reservas ni bloqueos.",
        past: "No hay reservas ni bloqueos pasados.",
        specific: `No hay reservas ni bloqueos para ${formatDateEs(
          selectedDate,
          "d MMMM, yyyy"
        )}.`,
        all: "No hay reservas ni bloqueos disponibles.",
      }[dateFilter]
    : {
        today: "No hay reservas para hoy.",
        future: "No hay próximas reservas.",
        past: "No hay reservas pasadas.",
        specific: `No hay reservas para ${formatDateEs(
          selectedDate,
          "d MMMM, yyyy"
        )}.`,
        all: "No hay reservas disponibles.",
      }[dateFilter];

  const emptyState = (
    <EmptyState
      icon={CalendarX}
      title="Sin resultados"
      description={emptyDescription}
      action={
        isRegularUser ? (
          <Button onClick={handleNewBooking}>
            <PlusCircle className="h-4 w-4" />
            Nueva Reserva
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setDateFilter("future")}>
            Ver Próximas Reservas
          </Button>
        )
      }
    />
  );

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader
          title="Sociedad Roncesvalles"
          description={`Hoy es ${format(new Date(), "EEEE, d 'de' MMMM", {
            locale: es,
          })}. Consulte la disponibilidad y gestione sus reservas.`}
          actions={
            <>
              {isRegularUser && (
                <Button
                  onClick={handleNewBooking}
                  disabled={!!activeBlockedDate}
                >
                  <PlusCircle className="h-4 w-4" />
                  Nueva Reserva
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/activity">
                  <History className="h-4 w-4" />
                  Actividad
                </Link>
              </Button>
              {canExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}
            </>
          }
        />

        <section className="space-y-4">
          <SectionHeader
            title={
              <span className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Disponibilidad
              </span>
            }
            description={
              loadingTables
                ? "Consultando disponibilidad…"
                : activeBlockedDate
                ? "Fecha no disponible"
                : `${activeAvailableTables.length} de ${ALL_TABLES.length} mesas disponibles`
            }
            actions={
              <Tabs
                value={selectedMealType}
                onValueChange={(value) =>
                  setSelectedMealType(value as MealType)
                }
              >
                <TabsList>
                  <TabsTrigger value="lunch">Comida</TabsTrigger>
                  <TabsTrigger value="dinner">Cena</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          />

          <div className="custom-datepicker-container">
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setSelectedDate(date);
                    setDateFilter("specific");
                  }
                }}
                dateFormat="d MMMM, yyyy"
                locale="es"
                renderDayContents={renderDayContents}
                onFocus={(e) => e.target.blur()}
                customInput={
                  <input
                    className="w-full cursor-pointer rounded-md border border-input bg-card py-2 pl-10 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
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
              <div className="datepicker-legend-item">
                <div className="datepicker-legend-dot booking-dot-blocked"></div>
                <span>Bloqueada</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <InfoIcon className="h-3 w-3" />
                <span>Fechas con reservas</span>
              </div>
            </div>
          </div>

          {loadingTables ? (
            <TablesSkeleton />
          ) : activeBlockedDate ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-destructive">
                  Fecha no disponible
                </p>
                <p className="text-sm text-muted-foreground">
                  Esta fecha está reservada para{" "}
                  <span className="font-semibold text-foreground">
                    {activeBlockedDate.reason}
                  </span>
                  . No es posible realizar reservas de{" "}
                  {selectedMealType === "lunch" ? "comida" : "cena"} en esta
                  fecha.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {ALL_TABLES.map((table) => {
                  const isAvailable = activeAvailableTables.includes(table);
                  return isAvailable ? (
                    <div
                      key={table}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="text-sm font-semibold text-primary">
                        Mesa {table}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Disponible
                      </span>
                    </div>
                  ) : (
                    <div
                      key={table}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-muted p-3 text-center text-muted-foreground"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span className="text-sm font-semibold">Mesa {table}</span>
                      <span className="text-[11px]">Reservada</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary" />
                  Disponible
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Reservada
                </span>
              </div>
            </div>
          )}
        </section>

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
              <StickyNote className="h-5 w-5 text-warning" />
              Notas Internas (Conserjería)
            </DialogTitle>
            <DialogDescription>
              Estas notas solo son visibles para conserjes y administradores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="Escriba aquí anotaciones..."
              rows={5}
            />
            {noteBooking?.noCleaningService && (
              <div className="space-y-2">
                <Label htmlFor="bookingCleaningHours">Horas de limpieza</Label>
                <Input
                  id="bookingCleaningHours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={cleaningHoursText}
                  onChange={(e) => setCleaningHoursText(e.target.value)}
                  placeholder="Ej. 2.5"
                />
                <p className="text-xs text-muted-foreground">
                  Si hubo acuerdo con el usuario, introduce aquí las horas
                  trabajadas para que la exportación calcule el importe correcto.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInternalNote} disabled={isSubmitting}>
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

        <section className="space-y-4">
          <SectionHeader
            title={listTitle}
            actions={
              <>
                <div className="flex flex-wrap gap-2">
                  {!isRegularUser && (
                    <Button
                      variant={dateFilter === "today" ? "default" : "outline"}
                      onClick={() => handleDateFilterChange("today")}
                      size="sm"
                    >
                      Hoy
                    </Button>
                  )}
                  <Button
                    variant={dateFilter === "future" ? "default" : "outline"}
                    onClick={() => handleDateFilterChange("future")}
                    size="sm"
                  >
                    Próximas
                  </Button>
                  <Button
                    variant={dateFilter === "past" ? "default" : "outline"}
                    onClick={() => handleDateFilterChange("past")}
                    size="sm"
                  >
                    Pasadas
                  </Button>
                </div>

                <Button
                  onClick={toggleViewMode}
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  {viewMode === "card" ? (
                    <>
                      <List className="h-4 w-4" />
                      Vista Lista
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="h-4 w-4" />
                      Vista Tarjetas
                    </>
                  )}
                </Button>
              </>
            }
          />

          {/* Bookings display - Card or List view */}
          {loading ? (
            viewMode === "list" ? (
              <BookingsListSkeleton />
            ) : (
              <BookingsDateSkeleton />
            )
          ) : isAdminOrConserje ? (
            /* Admin / Conserje: merged list of bookings + blocks */
            hasResults ? (
              <>
                <div className="space-y-3">
                  {paginatedMergedList.map((entry) => {
                    if (entry.kind === "block") {
                      const block = entry.item;
                      const blockDate = new Date(block.date);
                      const isBlockToday = isToday(blockDate);
                      const isBlockFuture = isFuture(blockDate);
                      const isBlockPast =
                        isPast(blockDate) && !isToday(blockDate);

                      return (
                        <div
                          key={`block-${block._id}`}
                          className="flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <StatusBadge tone="danger">Bloqueo</StatusBadge>
                              <span className="shrink-0 text-sm font-medium text-foreground">
                                {formatDateEs(blockDate, "EEEE, d MMM yyyy")}
                              </span>
                              <StatusBadge tone={MEAL_TONES[block.mealType]}>
                                {MEAL_LABELS[block.mealType]}
                              </StatusBadge>
                              <StatusBadge tone="neutral">
                                {block.reason}
                              </StatusBadge>
                              {block.prepararFuego && (
                                <StatusBadge tone="warning">
                                  <Flame className="h-3 w-3" />
                                  Fuego
                                </StatusBadge>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isBlockToday && (
                              <StatusBadge tone="info">Hoy</StatusBadge>
                            )}
                            {!isBlockToday && isBlockFuture && (
                              <StatusBadge tone="success">Próxima</StatusBadge>
                            )}
                            {isBlockPast && (
                              <StatusBadge tone="neutral">Pasada</StatusBadge>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Regular booking entry
                    const booking = entry.item;
                    const bookingDate = new Date(booking.date);
                    const isBookingPast =
                      isPast(bookingDate) && !isToday(bookingDate);

                    return (
                      <div key={`booking-${booking._id}`}>
                        {/* Mobile */}
                        <div className="sm:hidden">
                          <BookingListItem
                            booking={booking}
                            onEdit={() => setEditingBooking(booking)}
                            onDelete={() => handleDeleteBooking(booking)}
                            onEditNote={handleOpenNoteDialog}
                            isPast={isBookingPast}
                            session={session}
                          />
                        </div>
                        {/* Desktop */}
                        <div className="hidden sm:block">
                          {viewMode === "card" ? (
                            <BookingCard
                              booking={booking}
                              onEdit={() => setEditingBooking(booking)}
                              onDelete={() => handleDeleteBooking(booking)}
                              onEditNote={handleOpenNoteDialog}
                              isPast={isBookingPast}
                              session={session}
                            />
                          ) : (
                            <BookingListItem
                              booking={booking}
                              onEdit={() => setEditingBooking(booking)}
                              onDelete={() => handleDeleteBooking(booking)}
                              onEditNote={handleOpenNoteDialog}
                              isPast={isBookingPast}
                              session={session}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(value) => {
                      setItemsPerPage(value);
                      setCurrentPage(1);
                    }}
                  />
                )}
              </>
            ) : (
              emptyState
            )
          ) : filteredBookings.length > 0 ? (
            /* Regular user or other roles: original grouped by date view */
            <div className="space-y-6 sm:space-y-8">
              {sortedDateKeys.map((dateKey) => {
                const bookingsForDate = groupedBookings[dateKey];
                const bookingDate = new Date(dateKey);
                const isBookingToday = isToday(bookingDate);
                const isBookingFuture = isFuture(bookingDate);
                const isBookingPast =
                  isPast(bookingDate) && !isToday(bookingDate);

                // Pre-sorted list for consistent rendering order
                const sortedBookingsForDate = bookingsForDate.sort((a, b) => {
                  if (a.mealType !== b.mealType) {
                    return a.mealType === "lunch" ? -1 : 1;
                  }
                  return a.apartmentNumber - b.apartmentNumber;
                });

                return (
                  <div key={dateKey}>
                    {!isRegularUser && (
                      <div className="mb-3 flex items-center justify-between rounded-md bg-muted px-3 py-2">
                        <h3 className="text-base font-medium sm:text-lg">
                          {formatDateEs(bookingDate, "EEEE, d MMMM, yyyy")}
                        </h3>
                        {isBookingToday && (
                          <StatusBadge tone="info">Hoy</StatusBadge>
                        )}
                        {!isBookingToday && isBookingFuture && (
                          <StatusBadge tone="success">Próxima</StatusBadge>
                        )}
                        {isBookingPast && (
                          <StatusBadge tone="neutral">Pasada</StatusBadge>
                        )}
                      </div>
                    )}

                    {/* Mobile View: Always List View */}
                    <div className="flex flex-col gap-3 sm:hidden">
                      {sortedBookingsForDate.map((booking) => (
                        <BookingListItem
                          key={booking._id as string}
                          booking={booking}
                          onEdit={() => setEditingBooking(booking)}
                          onDelete={() => handleDeleteBooking(booking)}
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
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {sortedBookingsForDate.map((booking) => (
                            <BookingCard
                              key={booking._id as string}
                              booking={booking}
                              onEdit={() => setEditingBooking(booking)}
                              onDelete={() => handleDeleteBooking(booking)}
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
            emptyState
          )}
        </section>
      </div>
    </PageContainer>
  );
}
