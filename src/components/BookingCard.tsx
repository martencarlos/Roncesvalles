// src/components/BookingCard.tsx
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { IBooking } from "@/models/Booking";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Users,
  Table,
  CheckCircle2,
  AlertTriangle,
  StickyNote,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Session } from "next-auth";
import { getApartmentLabel } from "@/lib/utils";

interface BookingCardProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: (booking: IBooking) => void;
  onEditNote?: (booking: IBooking) => void;
  isPast?: boolean;
  session: Session | null;
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onEdit,
  onDelete,
  onEditNote,
  session,
}) => {
  const isCompleted = booking.status === "completed";
  const isPending = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";

  const userRole = session?.user?.role || "user";
  const isOwner = session?.user?.apartmentNumber === booking.apartmentNumber;
  const isITAdmin = userRole === "it_admin";
  const isConserje = userRole === "conserje";

  const canManageNotes = isITAdmin || isConserje;

  const canEdit =
    isITAdmin || (isOwner && !isCompleted && userRole === "user");
  const canDelete =
    isITAdmin || (isOwner && !isCompleted && userRole === "user");

  return (
    <Card
      className={`group overflow-hidden ${
        isCompleted ? "border-success/40" : ""
      } ${isCancelled ? "border-destructive/40 opacity-75" : ""}`}
    >
      <CardHeader className="pb-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold sm:text-lg">
              {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
            </h3>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Apto. #{getApartmentLabel(booking.apartmentNumber)}
            </div>
          </div>
          <StatusBadge
            tone={booking.mealType === "lunch" ? "warning" : "info"}
          >
            {booking.mealType === "lunch" ? "Comida" : "Cena"}
          </StatusBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Personas:</span>
          </div>
          <span className="text-sm">{booking.numberOfPeople}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Table className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Mesas:</span>
          </div>
          <span className="text-sm">
            {booking.tables.map((t) => `#${t}`).join(", ")}
          </span>
        </div>

        {(booking.prepararFuego || booking.reservaHorno) && (
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium">Servicios:</span>
            </div>
            <div className="flex flex-wrap justify-end gap-1 text-sm">
              {booking.prepararFuego && (
                <StatusBadge tone="warning">Fuego</StatusBadge>
              )}
              {booking.reservaHorno && (
                <StatusBadge tone="info">Horno</StatusBadge>
              )}
            </div>
          </div>
        )}

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Estado:</span>
          </div>
          <div>
            {isCompleted && <StatusBadge tone="success">Completado</StatusBadge>}
            {isPending && <StatusBadge tone="info">Reservado</StatusBadge>}
            {isCancelled && (
              <StatusBadge tone="danger">Cancelado</StatusBadge>
            )}
          </div>
        </div>

        {booking.noCleaningService && (
          <div className="mt-2 rounded-md border border-warning/20 bg-warning/10 p-2 text-sm">
            <div className="flex items-start gap-1 text-warning-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs">Sin servicio de conserjería.</p>
                {typeof booking.cleaningHours === "number" &&
                  booking.cleaningHours > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Limpieza acordada: {booking.cleaningHours} h
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}

        {!booking.noCleaningService && isConserje && (
          <div className="mt-2 border-t pt-2 text-sm">
            <div className="flex items-start gap-1 text-success">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p className="text-xs">Con servicio de conserjería.</p>
            </div>
          </div>
        )}

        {canManageNotes && booking.internalNotes && (
          <div className="mt-2 rounded-md border border-warning/20 bg-warning/10 p-2 text-sm">
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-warning-foreground">
              <StickyNote className="h-3 w-3" /> Nota Interna:
            </div>
            <p className="whitespace-pre-wrap text-xs text-warning-foreground">
              {booking.internalNotes}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2 px-4 pb-4 pt-2">
        {canManageNotes && onEditNote && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditNote(booking)}
            className="h-7 cursor-pointer px-2 text-xs text-warning-foreground hover:bg-warning/10"
            title={
              booking.internalNotes
                ? "Editar nota interna"
                : "Añadir nota interna"
            }
          >
            <StickyNote className="h-3 w-3 mr-1" />
            {booking.internalNotes ? "Editar Nota" : "Añadir Nota"}
          </Button>
        )}

        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-7 cursor-pointer px-2 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(booking)}
              className="h-7 cursor-pointer px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Eliminar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default BookingCard;
