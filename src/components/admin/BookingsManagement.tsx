// src/components/admin/BookingsManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PlusCircle,
  Calendar,
  X,
  Edit,
  Trash2,
  StickyNote,
  Save,
  Users,
  Table as TableIcon,
  Flame,
  Utensils,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, isPast, isToday } from "date-fns";
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

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/bookings");
        if (!res.ok) throw new Error("Error al obtener reservas");
        const data = await res.json();
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

  useEffect(() => {
    applyFilters(
      bookings,
      searchQuery,
      dateFilter,
      statusFilter,
      selectedDate,
      mealTypeFilter
    );
  }, [
    bookings,
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
          apartmentNumber: noteBooking.apartmentNumber,
          date: noteBooking.date,
          mealType: noteBooking.mealType,
          tables: noteBooking.tables,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar la nota");

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
                onChange={(date: Date) => setSelectedDate(date)}
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
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium shadow-md hover:shadow-lg active:scale-95 transition-all duration-150 w-full sm:w-auto"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nueva
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const isCompleted = booking.status === "completed";
            const isPending = booking.status === "pending";
            const isCancelled = booking.status === "cancelled";
            const isPastBooking =
              isPast(new Date(booking.date)) &&
              !isToday(new Date(booking.date));

            // Status Badge Logic
            let statusBadge = null;
            if (isCompleted) {
              statusBadge = (
                <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none hover:bg-green-100">
                  Completada
                </Badge>
              );
            } else if (isCancelled) {
              statusBadge = (
                <Badge className="bg-red-100 text-red-700 border-red-200 shadow-none hover:bg-red-100">
                  Cancelada
                </Badge>
              );
            } else {
              statusBadge = (
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 shadow-none hover:bg-blue-100">
                  Pendiente
                </Badge>
              );
            }

            return (
              <Card
                key={booking._id as string}
                className={`py-0 transition-colors hover:bg-gray-50/50 ${
                  isCompleted ? "border-green-300" : ""
                } ${isCancelled ? "border-red-300 opacity-75" : ""}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
                    {/* INFO GRID */}
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-12 gap-y-2 gap-x-4 items-center">
                      {/* 1. Apartment & Date */}
                      <div className="col-span-2 sm:col-span-4 lg:col-span-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-gray-900">
                            #{getApartmentLabel(booking.apartmentNumber)}
                          </span>
                          <span className="text-gray-300 hidden sm:inline">
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
                        <Badge
                          variant="outline"
                          className={
                            booking.mealType === "lunch"
                              ? "bg-orange-50 text-orange-700 border-orange-200 w-fit"
                              : "bg-blue-50 text-blue-700 border-blue-200 w-fit"
                          }
                        >
                          {booking.mealType === "lunch" ? "Comida" : "Cena"}
                        </Badge>

                        {(booking.prepararFuego || booking.reservaHorno) && (
                          <div className="flex gap-1.5 flex-wrap">
                            {booking.prepararFuego && (
                              <Badge
                                variant="outline"
                                className="bg-rose-50 text-rose-700 border-rose-200 px-1.5 py-0 h-5 text-[10px] gap-1"
                              >
                                <Flame className="h-3 w-3" /> Fuego
                              </Badge>
                            )}
                            {booking.reservaHorno && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 px-1.5 py-0 h-5 text-[10px] gap-1"
                              >
                                <Utensils className="h-3 w-3" /> Horno
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 3. Details (Tables & Pax) */}
                      <div className="col-span-1 sm:col-span-4 lg:col-span-6 flex flex-col sm:flex-row gap-y-1 gap-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2" title="Mesas">
                          <TableIcon className="h-4 w-4" />
                          <span className="font-medium text-gray-700">
                            Mesas: {booking.tables.join(", ")}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          title="Asistentes"
                        >
                          <Users className="h-4 w-4" />
                          <span>
                            <span className="font-medium text-gray-700">
                              {booking.numberOfPeople}
                            </span>{" "}
                            pax
                          </span>
                        </div>

                        {booking.noCleaningService && (
                          <div
                            className="flex items-center gap-1.5 text-amber-600 sm:ml-auto"
                            title="Sin servicio de conserjería"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">
                              Sin conserje
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ACTIONS ROW */}
                    <div className="flex flex-wrap lg:flex-nowrap gap-2 justify-end items-center mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                      {/* Notes Button */}
                      {canManageInternalNotes && (
                        <Button
                          variant={booking.internalNotes ? "default" : "ghost"}
                          size="sm"
                          onClick={() => openNoteDialog(booking)}
                          className={`h-8 px-2.5 text-xs ${
                            booking.internalNotes
                              ? "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 shadow-none"
                              : "text-muted-foreground hover:bg-gray-100"
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
                            className="h-8 w-8 p-0 lg:w-auto lg:px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex flex-col gap-2">
                      <div className="text-xs bg-amber-50/50 p-2 rounded border border-amber-100/50 flex items-start gap-2">
                        <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-600" />
                        <span className="text-amber-900 whitespace-pre-wrap">
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
        <div className="text-center p-12 bg-white rounded-lg border border-dashed border-gray-300">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">
            No se encontraron reservas
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Intente ajustar los filtros de búsqueda.
          </p>
          <Button variant="outline" onClick={resetFilters} className="mt-4">
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Modals */}
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