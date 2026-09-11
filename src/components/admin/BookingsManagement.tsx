// src/components/admin/BookingsManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  Calendar,
  X,
  Edit,
  Trash2,
  StickyNote,
  Users,
  Table as TableIcon,
  Flame,
  Utensils,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BookingFormModal from "@/components/BookingFormModal";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { IBooking } from "@/models/Booking";
import { IBlockedDate } from "@/models/BlockedDate";
import { getApartmentLabel } from "@/lib/utils";

registerLocale("es", es);

interface BookingsManagementProps {
  userRole: string;
}

export default function BookingsManagement({
  userRole,
}: BookingsManagementProps) {
  const isITAdmin = userRole === "it_admin";
  const isConserje = userRole === "conserje";
  const canManageInternalNotes = isITAdmin || isConserje;

  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [blocks, setBlocks] = useState<IBlockedDate[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<IBlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mealTypeFilter, setMealTypeFilter] = useState<string>("all");

  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [deletingBooking, setDeletingBooking] = useState<IBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Internal Notes Modal State
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteBooking, setNoteBooking] = useState<IBooking | null>(null);
  const [internalNoteText, setInternalNoteText] = useState("");
  const [cleaningHoursText, setCleaningHoursText] = useState("");

  // Fetch bookings and blocks
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const [bookingsRes, blocksRes] = await Promise.all([
          fetch("/api/bookings"),
          fetch("/api/blocked-dates"),
        ]);
        if (!bookingsRes.ok) throw new Error("Error al obtener reservas");
        const data = await bookingsRes.json();
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

        if (blocksRes.ok) {
          const blocksData: IBlockedDate[] = await blocksRes.json();
          setBlocks(blocksData);
          applyBlockFilters(blocksData, dateFilter, statusFilter, selectedDate, mealTypeFilter);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Filter Logic
  const applyFilters = (
    list: IBooking[],
    query: string,
    date: string,
    status: string,
    specificDate: Date | null,
    meal: string
  ) => {
    let filtered = [...list];
    if (query) {
      const apt = parseInt(query);
      if (!isNaN(apt))
        filtered = filtered.filter((b) => b.apartmentNumber === apt);
    }
    if (date === "today")
      filtered = filtered.filter((b) => isToday(new Date(b.date)));
    else if (date === "future")
      filtered = filtered.filter(
        (b) => isToday(new Date(b.date)) || new Date(b.date) > new Date()
      );
    else if (date === "past")
      filtered = filtered.filter(
        (b) => !isToday(new Date(b.date)) && new Date(b.date) < new Date()
      );
    else if (date === "specific" && specificDate) {
      filtered = filtered.filter((b) => {
        const d = new Date(b.date);
        return (
          d.getDate() === specificDate.getDate() &&
          d.getMonth() === specificDate.getMonth() &&
          d.getFullYear() === specificDate.getFullYear()
        );
      });
    }
    if (status !== "all")
      filtered = filtered.filter((b) => b.status === status);
    if (meal !== "all") filtered = filtered.filter((b) => b.mealType === meal);
    setFilteredBookings(filtered);
  };

  // Filter logic for blocks — blocks don't have status or apartment search,
  // but they do respect date and mealType filters
  const applyBlockFilters = (
    list: IBlockedDate[],
    date: string,
    status: string,
    specificDate: Date | null,
    meal: string
  ) => {
    // Blocks are never "completed" or "cancelled" — hide them when status filter is set
    if (status !== "all") {
      setFilteredBlocks([]);
      return;
    }
    let filtered = [...list];
    if (date === "today")
      filtered = filtered.filter((b) => isToday(new Date(b.date)));
    else if (date === "future")
      filtered = filtered.filter(
        (b) => isToday(new Date(b.date)) || new Date(b.date) > new Date()
      );
    else if (date === "past")
      filtered = filtered.filter(
        (b) => !isToday(new Date(b.date)) && new Date(b.date) < new Date()
      );
    else if (date === "specific" && specificDate) {
      filtered = filtered.filter((b) => {
        const d = new Date(b.date);
        return (
          d.getDate() === specificDate.getDate() &&
          d.getMonth() === specificDate.getMonth() &&
          d.getFullYear() === specificDate.getFullYear()
        );
      });
    }
    // mealType filter: block "both" matches any meal filter
    if (meal !== "all") {
      filtered = filtered.filter(
        (b) => b.mealType === meal || b.mealType === "both"
      );
    }
    setFilteredBlocks(filtered);
  };

  useEffect(() => {
    applyFilters(
      bookings,
      searchQuery,
      dateFilter,
      statusFilter,
      selectedDate,
      mealTypeFilter
    );
    applyBlockFilters(blocks, dateFilter, statusFilter, selectedDate, mealTypeFilter);
  }, [
    bookings,
    blocks,
    searchQuery,
    dateFilter,
    statusFilter,
    selectedDate,
    mealTypeFilter,
  ]);

  const resetFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setStatusFilter("all");
    setSelectedDate(null);
    setMealTypeFilter("all");
  };

  // CRUD Handlers
  const handleCreateBooking = async (data: Partial<IBooking>) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, status: "pending" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear la reserva");
      }

      const newBooking = await res.json();
      setBookings((prev) => [newBooking, ...prev]);
      setShowForm(false);
      toast.success("Reserva Creada", {
        description: `Apt #${
          data.apartmentNumber
        } ha reservado las mesas ${data.tables?.join(", ")}`,
      });
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleUpdateBooking = async (data: Partial<IBooking>) => {
    if (!editingBooking?._id) return;
    try {
      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar la reserva");
      }

      const updatedBooking = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b._id === editingBooking._id ? updatedBooking : b))
      );
      setEditingBooking(null);
      toast.success("Reserva Actualizada");
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleDeleteBooking = (booking: IBooking) => {
    setDeletingBooking(booking);
    setShowDeleteDialog(true);
  };

  const confirmDeleteBooking = async () => {
    if (!deletingBooking?._id) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${deletingBooking._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar la reserva");
      setBookings((prev) => prev.filter((b) => b._id !== deletingBooking._id));
      toast.error("Reserva Eliminada");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setDeletingBooking(null);
    }
  };

  // Internal Notes Handlers
  const openNoteDialog = (booking: IBooking) => {
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

      const updatedBooking = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b._id === updatedBooking._id ? updatedBooking : b))
      );
      toast.success("Nota interna actualizada");
      setShowNoteDialog(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date) =>
    format(new Date(date), "d MMM, yyyy", { locale: es });

  // Merge filtered bookings and blocks into a single chronologically-sorted list
  const MEAL_LABELS: Record<string, string> = {
    lunch: "Comida",
    dinner: "Cena",
    both: "Comida y Cena",
  };
  const MEAL_TONES: Record<string, "warning" | "info" | "neutral"> = {
    lunch: "warning",
    dinner: "info",
    both: "neutral",
  };

  type MergedItem =
    | { kind: "booking"; item: IBooking }
    | { kind: "block"; item: IBlockedDate };

  const mergedList: MergedItem[] = [
    ...filteredBookings.map((b): MergedItem => ({ kind: "booking", item: b })),
    ...filteredBlocks.map((b): MergedItem => ({ kind: "block", item: b })),
  ].sort(
    (a, b) =>
      new Date(b.item.date).getTime() - new Date(a.item.date).getTime()
  );

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="relative flex items-center gap-2 w-full xl:w-auto">
          <Input
            placeholder="Nº apto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-32"
            type="number"
            min="1"
            max="48"
          />

          {dateFilter === "specific" && (
            <div className="relative">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => date && setSelectedDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="Fecha"
                className="w-full sm:w-36 p-2 border rounded-md"
                customInput={<Input className="w-full sm:w-36" readOnly />}
              />
            </div>
          )}

          {(searchQuery ||
            dateFilter !== "all" ||
            statusFilter !== "all" ||
            mealTypeFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" /> Limpiar
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
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
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="lunch">Comida</SelectItem>
              <SelectItem value="dinner">Cena</SelectItem>
            </SelectContent>
          </Select>

          {isITAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto"
            >
              <PlusCircle />
              Nueva
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : mergedList.length > 0 ? (
        <div className="space-y-3">
          {mergedList.map((entry) => {
            if (entry.kind === "block") {
              const block = entry.item;
              return (
              <Card
                key={`block-${block._id}`}
                className="py-0 border-destructive/20 bg-destructive/5"
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-12 gap-y-2 gap-x-4 items-center">
                      {/* Date & label */}
                      <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                          <StatusBadge tone="danger">Bloqueo</StatusBadge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(block.date)}</span>
                        </div>
                      </div>

                      {/* Meal type & fire */}
                      <div className="col-span-1 sm:col-span-4 lg:col-span-3 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
                        <StatusBadge tone={MEAL_TONES[block.mealType]}>
                          {MEAL_LABELS[block.mealType]}
                        </StatusBadge>
                        {block.prepararFuego && (
                          <StatusBadge tone="danger" className="gap-1">
                            <Flame className="h-3 w-3" /> Fuego
                          </StatusBadge>
                        )}
                      </div>

                      {/* Reason */}
                      <div className="col-span-1 sm:col-span-4 lg:col-span-6 text-sm">
                        <StatusBadge tone="neutral">{block.reason}</StatusBadge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            }

            const booking = entry.item;
            const isCompleted = booking.status === "completed";
            const isCancelled = booking.status === "cancelled";

            // Status Badge Logic
            let statusBadge = null;
            if (isCompleted) {
              statusBadge = <StatusBadge tone="success">Completada</StatusBadge>;
            } else if (isCancelled) {
              statusBadge = <StatusBadge tone="danger">Cancelada</StatusBadge>;
            } else {
              statusBadge = <StatusBadge tone="info">Pendiente</StatusBadge>;
            }

            return (
              <Card
                key={booking._id as string}
                className={`py-0 transition-colors hover:bg-accent/40 ${
                  isCompleted ? "border-success/30" : ""
                } ${isCancelled ? "border-destructive/20 opacity-75" : ""}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
                    {/* INFO GRID */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-12 gap-y-2 gap-x-4 items-center">
                      {/* 1. Apartment & Date */}
                      <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-foreground">
                            #{getApartmentLabel(booking.apartmentNumber)}
                          </span>
                          <span className="text-border hidden sm:inline">
                            |
                          </span>
                          {statusBadge}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                      </div>

                      {/* 2. Meal Type & Services */}
                      <div className="col-span-1 sm:col-span-4 lg:col-span-3 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2">
                        <StatusBadge tone={MEAL_TONES[booking.mealType]}>
                          {booking.mealType === "lunch" ? "Comida" : "Cena"}
                        </StatusBadge>

                        {(booking.prepararFuego || booking.reservaHorno) && (
                          <div className="flex gap-1.5 flex-wrap">
                            {booking.prepararFuego && (
                              <StatusBadge tone="danger" className="gap-1">
                                <Flame className="h-3 w-3" /> Fuego
                              </StatusBadge>
                            )}
                            {booking.reservaHorno && (
                              <StatusBadge tone="warning" className="gap-1">
                                <Utensils className="h-3 w-3" /> Horno
                              </StatusBadge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. Details (Tables & People) */}
                      <div className="col-span-1 sm:col-span-4 lg:col-span-6 flex flex-col sm:flex-row gap-y-1 gap-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2" title="Mesas">
                          <TableIcon className="h-4 w-4" />
                          <span className="font-medium text-foreground">
                            Mesas: {booking.tables.join(", ")}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          title="Asistentes"
                        >
                          <Users className="h-4 w-4" />
                          <span>
                            <span className="font-medium text-foreground">
                              {booking.numberOfPeople}
                            </span>{" "}
                            pers.
                          </span>
                        </div>

                        {booking.noCleaningService && (
                          <div className="flex flex-col sm:ml-auto gap-1">
                            <div
                              className="flex items-center gap-1.5 text-warning-foreground"
                              title="Sin servicio de conserjería"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">
                                Sin conserje
                              </span>
                            </div>
                            {typeof booking.cleaningHours === "number" &&
                              booking.cleaningHours > 0 && (
                                <span className="text-[11px] text-muted-foreground">
                                  Limpieza acordada: {booking.cleaningHours} h
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS ROW */}
                    <div className="flex flex-wrap lg:flex-nowrap gap-2 justify-end items-center mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
                      {/* Notes Button */}
                      {canManageInternalNotes && (
                        <Button
                          variant={booking.internalNotes ? "default" : "ghost"}
                          size="sm"
                          onClick={() => openNoteDialog(booking)}
                          className={`h-8 px-2.5 text-xs ${
                            booking.internalNotes
                              ? "bg-warning/15 text-warning-foreground border border-warning/30 hover:bg-warning/20 shadow-none"
                              : "text-muted-foreground hover:bg-accent"
                          }`}
                          title="Notas internas"
                        >
                          <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                          {booking.internalNotes ? "Nota" : "Nota"}
                        </Button>
                      )}

                      {/* Admin Actions */}
                      {isITAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBooking(booking)}
                            className="h-8 w-8 p-0 lg:w-auto lg:px-3 text-xs"
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5 lg:mr-1.5" />
                            <span className="hidden lg:inline">Editar</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking)}
                            className="h-8 w-8 p-0 lg:w-auto lg:px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5 lg:mr-1.5" />
                            <span className="hidden lg:inline">Eliminar</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes Display Section */}
                  {booking.internalNotes && canManageInternalNotes && (
                    <div className="mt-3 pt-3 border-t border-dashed border-border flex flex-col gap-2">
                      <div className="text-xs bg-warning/10 p-2 rounded border border-warning/20 flex items-start gap-2">
                        <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-warning-foreground" />
                        <span className="text-warning-foreground whitespace-pre-wrap">
                          {booking.internalNotes}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="No se encontraron reservas"
          description="Intente ajustar los filtros de búsqueda."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          }
        />
      )}

      {/* Modals */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-warning-foreground" />
              Notas Internas (Conserjería)
            </DialogTitle>
            <DialogDescription>
              Estas notas solo son visibles para conserjes y administradores IT.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="Escriba aquí anotaciones..."
              rows={5}
              className="bg-warning/10 border-warning/30"
            />
            {noteBooking?.noCleaningService && (
              <div className="space-y-2">
                <Label htmlFor="cleaningHours">Horas de limpieza</Label>
                <Input
                  id="cleaningHours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={cleaningHoursText}
                  onChange={(e) => setCleaningHoursText(e.target.value)}
                  placeholder="Ej. 2.5"
                />
                <p className="text-xs text-muted-foreground">
                  Si hubo acuerdo con el usuario, introduzca aquí las horas
                  trabajadas para que la exportación aplique la tarifa correcta.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveInternalNote}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando..." : "Guardar Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isITAdmin && (
        <BookingFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateBooking}
          initialData={{ date: new Date(), mealType: "lunch" }}
          isEditing={false}
        />
      )}

      {editingBooking && (
        <BookingFormModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleUpdateBooking}
          initialData={editingBooking}
          isEditing={true}
        />
      )}

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
    </div>
  );
}
