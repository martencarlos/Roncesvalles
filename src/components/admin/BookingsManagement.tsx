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
  Search,
  X,
  Edit,
  Trash2,
  CheckCircle2,
  StickyNote,
  Save,
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
import BookingConfirmationDialog from "@/components/BookingConfirmationDialog";
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

registerLocale("es", es);

interface BookingsManagementProps {
  userRole: string;
}

export default function BookingsManagement({
  userRole,
}: BookingsManagementProps) {
  const isITAdmin = userRole === "it_admin";
  const isConserje = userRole === "conserje";
  // Conserje can edit notes, IT admin can do everything including notes
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
  const [confirmingBooking, setConfirmingBooking] = useState<IBooking | null>(
    null
  );
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

  const handleConfirmBooking = async (
    id: string,
    data: { finalAttendees: number; notes: string }
  ) => {
    try {
      const res = await fetch(`/api/bookings/${id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al confirmar la reserva");
      }
      const updatedBooking = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b._id === id ? updatedBooking : b))
      );
      setConfirmingBooking(null);
      toast.success("Reserva Confirmada");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
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
                customInput={<Input className="w-full sm:w-40" readOnly />}
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

          {isITAdmin && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium shadow-md hover:shadow-lg active:scale-95 transition-all duration-150"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === "confirmed";
            const isPending = booking.status === "pending";
            const isCancelled = booking.status === "cancelled";
            const isPastBooking =
              isPast(new Date(booking.date)) &&
              !isToday(new Date(booking.date));

            return (
              <Card
                key={booking._id as string}
                className={`py-0 ${
                  isPastBooking && !isConfirmed && !isCancelled
                    ? "border-amber-300"
                    : ""
                } ${isConfirmed ? "border-green-300" : ""} ${
                  isCancelled ? "border-red-300 opacity-75" : ""
                }`}
              >
                <CardContent className="p-4">
                  {/* Unified Responsive Layout: Mobile (flex-col) / Desktop (flex-row) */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Info Columns */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <h3 className="font-semibold text-lg">
                          Apto. #{booking.apartmentNumber}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(booking.date)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Badge
                          variant={
                            booking.mealType === "lunch" ? "outline" : "default"
                          }
                          className={
                            booking.mealType === "lunch"
                              ? "capitalize bg-orange-100 text-orange-800 border-orange-200"
                              : "capitalize bg-blue-100 text-blue-800 border-blue-200"
                          }
                        >
                          {booking.mealType === "lunch" ? "Comida" : "Cena"}
                        </Badge>
                      </div>
                      <div className="flex items-center">
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
                      <div className="col-span-2 md:col-span-1 text-sm">
                        <p>Mesas: {booking.tables.join(", ")}</p>
                        <p>{booking.numberOfPeople} pax</p>
                        {(booking.prepararFuego || booking.reservaHorno) && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {booking.prepararFuego && (
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
                              >
                                Fuego
                              </Badge>
                            )}
                            {booking.reservaHorno && (
                              <Badge
                                variant="outline"
                                className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                              >
                                Horno
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Column - Wrapped with flex-wrap for Mobile to prevent hiding */}
                    <div className="flex flex-wrap md:flex-col gap-2 justify-end content-start items-end md:min-w-[140px] pt-2 md:pt-0 border-t md:border-0">
                      {/* Internal Notes Button */}
                      {canManageInternalNotes && (
                        <Button
                          variant={
                            booking.internalNotes ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => openNoteDialog(booking)}
                          className={`flex-1 md:flex-none w-full ${
                            booking.internalNotes
                              ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                              : "text-muted-foreground"
                          }`}
                          title="Notas de conserjería"
                        >
                          <StickyNote className="h-4 w-4 mr-2" />
                          {booking.internalNotes ? "Ver Nota" : "Añadir Nota"}
                        </Button>
                      )}

                      {/* Existing Buttons */}
                      {isITAdmin && (
                        <>
                          {isPending && isPastBooking && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmingBooking(booking)}
                              className="flex-1 md:flex-none w-full border-amber-500 text-amber-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />{" "}
                              Confirmar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingBooking(booking)}
                            className="flex-1 md:flex-none w-full"
                          >
                            <Edit className="h-4 w-4 mr-2" /> Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking)}
                            className="flex-1 md:flex-none w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Display Notes Inline - Bottom of Card */}
                  {(booking.notes ||
                    (booking.internalNotes && canManageInternalNotes)) && (
                    <div className="mt-4 space-y-2 border-t pt-3">
                      {/* User Notes */}
                      {booking.notes && isConfirmed && (
                        <div className="text-sm bg-gray-50 p-2 rounded border border-gray-100">
                          <span className="font-semibold text-gray-700">
                            Nota del usuario:
                          </span>{" "}
                          <span className="italic text-gray-600">
                            {booking.notes}
                          </span>
                        </div>
                      )}
                      {/* Internal Notes */}
                      {booking.internalNotes && canManageInternalNotes && (
                        <div className="text-sm bg-amber-50 p-2 rounded border border-amber-200 flex items-start gap-2">
                          <StickyNote className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold text-amber-800">
                              Nota interna (Conserje):
                            </span>
                            <p className="text-amber-900 whitespace-pre-wrap">
                              {booking.internalNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-muted-foreground">No se encontraron reservas.</p>
        </div>
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
              Estas notas solo son visibles para conserjes y administradores. El
              usuario no las verá.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={internalNoteText}
              onChange={(e) => setInternalNoteText(e.target.value)}
              placeholder="Escriba aquí anotaciones sobre limpieza, incidencias, pagos, etc..."
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

      {/* Booking Form Modal */}
      {isITAdmin && (
        <BookingFormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreateBooking}
          initialData={{ date: new Date(), mealType: "lunch" }}
          isEditing={false}
        />
      )}

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
          isDeleting={isSubmitting}
        />
      )}
    </div>
  );
}
