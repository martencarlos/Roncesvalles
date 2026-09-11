// src/components/BookingListItem.tsx
import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { IBooking } from "@/models/Booking";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Users,
  Table,
  CheckCircle2,
  UtensilsCrossed,
  CalendarDays,
  AlertTriangle,
  StickyNote,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Session } from "next-auth";
import { getApartmentLabel } from "@/lib/utils";

interface BookingListItemProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: (booking: IBooking) => void;
  onEditNote?: (booking: IBooking) => void;
  isPast?: boolean;
  session: Session | null;
}

const BookingListItem: React.FC<BookingListItemProps> = ({
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
  const isRegularUser = userRole === "user";

  const canEdit =
    isITAdmin || (isOwner && !isCompleted && userRole === "user");
  const canDelete =
    isITAdmin || (isOwner && !isCompleted && userRole === "user");

  const renderStatus = () => (
    <>
      {isCompleted && <StatusBadge tone="success">Completado</StatusBadge>}
      {isPending && <StatusBadge tone="info">Reservado</StatusBadge>}
      {isCancelled && <StatusBadge tone="danger">Cancelado</StatusBadge>}
    </>
  );

  return (
    <div
      className={`group rounded-lg border bg-card p-3 sm:p-4 ${
        isCompleted ? "border-success/40" : ""
      } ${isCancelled ? "border-destructive/40 opacity-75" : ""}`}
    >
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isRegularUser ? (
              <>
                <h3 className="flex items-center gap-1.5 font-bold">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
                </h3>
                <div className="mt-1 text-xs text-muted-foreground">
                  Apto. #{getApartmentLabel(booking.apartmentNumber)}
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold">
                  Apto. #{getApartmentLabel(booking.apartmentNumber)}
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
                </div>
              </>
            )}
          </div>
          <div>{renderStatus()}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
            <StatusBadge
              tone={booking.mealType === "lunch" ? "warning" : "info"}
            >
              {booking.mealType === "lunch" ? "Comida" : "Cena"}
            </StatusBadge>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{booking.numberOfPeople}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <Table className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Mesas: {booking.tables.map((t) => `#${t}`).join(", ")}</span>
          </div>
        </div>

        {(booking.prepararFuego || booking.reservaHorno) && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Servicios:</span>
            <div className="flex flex-wrap gap-1">
              {booking.prepararFuego && (
                <StatusBadge tone="warning">Fuego</StatusBadge>
              )}
              {booking.reservaHorno && (
                <StatusBadge tone="info">Horno</StatusBadge>
              )}
            </div>
          </div>
        )}

        {booking.noCleaningService && (
          <div className="flex items-start gap-1 text-sm text-warning-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs">Sin servicio de conserjería</p>
              {typeof booking.cleaningHours === "number" &&
                booking.cleaningHours > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Limpieza acordada: {booking.cleaningHours} h
                  </p>
                )}
            </div>
          </div>
        )}

        {!booking.noCleaningService && isConserje && (
          <div className="flex items-start gap-1 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="text-xs">Con servicio de conserjería</p>
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

        <div className="mt-1 flex flex-wrap justify-end gap-2">
          {canManageNotes && onEditNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditNote(booking)}
              className="h-8 flex-1 cursor-pointer px-2 text-xs"
            >
              <StickyNote className="h-3.5 w-3.5 mr-1.5" />
              {booking.internalNotes ? "Editar Nota" : "Añadir Nota"}
            </Button>
          )}

          <div className="flex flex-1 justify-end gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="h-8 flex-1 cursor-pointer px-2 text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(booking)}
                className="h-8 flex-1 cursor-pointer px-2 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden gap-2 sm:flex sm:flex-col">
        <div className="flex justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex min-w-[120px] flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">
                  {isRegularUser
                    ? format(new Date(booking.date), "d MMM, yyyy", {
                        locale: es,
                      })
                    : `Apto. #${getApartmentLabel(booking.apartmentNumber)}`}
                </h3>
                <div>{renderStatus()}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {isRegularUser
                  ? `Apto. #${getApartmentLabel(booking.apartmentNumber)}`
                  : `${booking.mealType === "lunch" ? "Comida" : "Cena"} · ${format(
                      new Date(booking.date),
                      "d MMM, yyyy",
                      { locale: es }
                    )}`}
              </div>
            </div>

            <div className="flex flex-row items-center gap-6">
              {isRegularUser && (
                <StatusBadge
                  tone={booking.mealType === "lunch" ? "warning" : "info"}
                >
                  {booking.mealType === "lunch" ? "Comida" : "Cena"}
                </StatusBadge>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{booking.numberOfPeople}</span>
              </div>
              <div className="flex items-center gap-1">
                <Table className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">
                  Mesas: {booking.tables.map((t) => `#${t}`).join(", ")}
                </span>
              </div>
            </div>

            {(booking.prepararFuego || booking.reservaHorno) && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {booking.prepararFuego && (
                    <StatusBadge tone="warning">Fuego</StatusBadge>
                  )}
                  {booking.reservaHorno && (
                    <StatusBadge tone="info">Horno</StatusBadge>
                  )}
                </div>
              </div>
            )}

            {booking.noCleaningService && (
              <div className="flex items-center gap-1 text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs">
                  Sin conserjería
                  {typeof booking.cleaningHours === "number" &&
                  booking.cleaningHours > 0
                    ? ` · ${booking.cleaningHours} h`
                    : ""}
                </span>
              </div>
            )}

            {!booking.noCleaningService && isConserje && (
              <div className="flex items-center gap-1 text-success">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-xs">Con conserjería</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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
          </div>
        </div>

        {canManageNotes && booking.internalNotes && (
          <div className="mt-1 flex flex-col gap-1 border-t border-dashed pt-2 text-sm">
            <div className="flex items-start gap-1 rounded border border-warning/20 bg-warning/10 p-1 text-xs text-warning-foreground">
              <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="whitespace-pre-wrap">
                {booking.internalNotes}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingListItem;
