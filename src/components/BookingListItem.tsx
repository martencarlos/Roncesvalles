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
import { Badge } from "@/components/ui/badge";
import { Session } from "next-auth";
import { getApartmentLabel } from "@/lib/utils";

interface BookingListItemProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: (booking: IBooking) => void;
  onConfirm: () => void;
  onEditNote?: (booking: IBooking) => void;
  isPast?: boolean;
  session: Session | null;
}

const BookingListItem: React.FC<BookingListItemProps> = ({
  booking,
  onEdit,
  onDelete,
  onConfirm,
  onEditNote,
  isPast = false,
  session,
}) => {
  const isConfirmed = booking.status === "confirmed";
  const isPending = booking.status === "pending";
  const isCancelled = booking.status === "cancelled";

  const userRole = session?.user?.role || "user";
  const isOwner = session?.user?.apartmentNumber === booking.apartmentNumber;
  const isAdmin = userRole === "admin";
  const isITAdmin = userRole === "it_admin";
  const isConserje = userRole === "conserje";

  const canManageNotes = isITAdmin || isConserje;

  const canEdit =
    isITAdmin || (isOwner && (!isConfirmed || !isPast) && userRole === "user");
  const canDelete =
    isITAdmin || (isOwner && (!isConfirmed || !isPast) && userRole === "user");
  
  // Allow admins to confirm
  const canConfirm =
    isITAdmin || isAdmin || (isOwner && isPending && isPast && userRole === "user");

  return (
    <div
      className={`p-3 sm:p-4 rounded-md border group ${
        isPast && !isConfirmed && !isCancelled ? "border-amber-300" : ""
      } ${isConfirmed ? "border-green-300" : ""} ${
        isCancelled ? "border-red-300 opacity-75" : ""
      }`}
    >
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold">
              Apto. #{getApartmentLabel(booking.apartmentNumber)}
            </h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
            </div>
          </div>
          <div>
            {isConfirmed && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-700 border-green-200"
              >
                Confirmado
              </Badge>
            )}
            {isPending && !isPast && (
              <Badge
                variant="outline"
                className="bg-blue-100 text-blue-700 border-blue-200"
              >
                Pendiente
              </Badge>
            )}
            {isPending && isPast && (
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-700 border-amber-200"
              >
                Por confirmar
              </Badge>
            )}
            {isCancelled && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-700 border-red-200"
              >
                Cancelado
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{booking.mealType === "lunch" ? "Comida" : "Cena"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {isConfirmed && booking.finalAttendees !== undefined ? (
                <>
                  <span className="line-through text-muted-foreground mr-1">
                    {booking.numberOfPeople}
                  </span>
                  {booking.finalAttendees}
                </>
              ) : (
                booking.numberOfPeople
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Table className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Mesas: {booking.tables.map((t) => `#${t}`).join(", ")}</span>
          </div>
        </div>

        {(booking.prepararFuego || booking.reservaHorno) && (
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span>Servicios:</span>
            <div className="flex gap-1 flex-wrap">
              {booking.prepararFuego && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Fuego
                </Badge>
              )}
              {booking.reservaHorno && (
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200"
                >
                  Horno
                </Badge>
              )}
            </div>
          </div>
        )}

        {booking.noCleaningService && (
          <div className="flex items-start gap-1 text-sm text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p className="text-xs">Sin servicio de conserjería</p>
          </div>
        )}

        {!booking.noCleaningService && isConserje && (
          <div className="flex items-start gap-1 text-sm text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p className="text-xs">Con servicio de conserjería</p>
          </div>
        )}

        {isConfirmed && booking.notes && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Notas:</span> {booking.notes}
          </div>
        )}

        {canManageNotes && booking.internalNotes && (
          <div className="mt-2 pt-2 border-t text-sm bg-amber-50 p-2 rounded border border-amber-100">
            <div className="font-medium mb-1 text-xs text-amber-800 flex items-center gap-1">
              <StickyNote className="h-3 w-3" /> Nota Interna:
            </div>
            <p className="text-amber-900 text-xs whitespace-pre-wrap">
              {booking.internalNotes}
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end mt-1 flex-wrap">
          {canManageNotes && onEditNote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditNote(booking)}
              className={`cursor-pointer h-8 text-xs px-2 flex-1 ${
                booking.internalNotes
                  ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
                  : ""
              }`}
            >
              <StickyNote className="h-3.5 w-3.5 mr-1.5" />
              {booking.internalNotes ? "Editar Nota" : "Añadir Nota"}
            </Button>
          )}

          <div className="flex gap-2 flex-1 justify-end">
            {canConfirm && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConfirm}
                className="cursor-pointer h-8 text-xs px-2 border-amber-500 text-amber-700 hover:bg-amber-50 flex-1"
              >
                <CheckCircle2 className="cursor-pointer h-3.5 w-3.5 mr-1.5" />
                Confirmar
              </Button>
            )}

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="cursor-pointer h-8 text-xs px-2 flex-1"
              >
                <Edit className="cursor-pointer h-3.5 w-3.5 mr-1.5" />
                Editar
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(booking)}
                className="cursor-pointer h-8 text-xs px-2 flex-1"
              >
                <Trash2 className="cursor-pointer h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex sm:flex-col gap-2">
        <div className="flex sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-8">
            <div className="flex flex-col min-w-[120px]">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">
                  Apto. #{getApartmentLabel(booking.apartmentNumber)}
                </h3>
                <div>
                  {isConfirmed && (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-200"
                    >
                      Confirmado
                    </Badge>
                  )}
                  {isPending && !isPast && (
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-700 border-blue-200"
                    >
                      Pendiente
                    </Badge>
                  )}
                  {isPending && isPast && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 border-amber-200"
                    >
                      Por confirmar
                    </Badge>
                  )}
                  {isCancelled && (
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-700 border-red-200"
                    >
                      Cancelado
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-muted-foreground text-xs mt-1">
                {booking.mealType === "lunch" ? "Comida" : "Cena"} ·{" "}
                {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
              </div>
            </div>

            <div className="flex flex-row gap-6 items-center">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">
                  {isConfirmed && booking.finalAttendees !== undefined ? (
                    <>
                      <span className="line-through text-muted-foreground mr-1">
                        {booking.numberOfPeople}
                      </span>
                      {booking.finalAttendees}
                    </>
                  ) : (
                    booking.numberOfPeople
                  )}
                </span>
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
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Fuego
                    </Badge>
                  )}
                  {booking.reservaHorno && (
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      Horno
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {booking.noCleaningService && (
              <div className="flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-xs">Sin conserjería</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {canManageNotes && onEditNote && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditNote(booking)}
                className="cursor-pointer h-7 text-xs px-2 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
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
              {canConfirm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onConfirm}
                  className="cursor-pointer h-7 text-xs px-2 border-amber-500 text-amber-700 hover:bg-amber-50"
                >
                  <CheckCircle2 className="cursor-pointer h-3 w-3 mr-1" />
                  Confirmar
                </Button>
              )}

              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="cursor-pointer h-7 text-xs px-2"
                >
                  <Edit className="cursor-pointer h-3 w-3 mr-1" />
                  Editar
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(booking)}
                  className="cursor-pointer h-7 text-xs px-2"
                >
                  <Trash2 className="cursor-pointer h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>
        </div>

        {(booking.notes || (canManageNotes && booking.internalNotes)) && (
          <div className="flex flex-col gap-1 mt-1 text-sm border-t pt-2 border-dashed">
            {booking.notes && isConfirmed && (
              <div className="text-xs text-muted-foreground truncate">
                <span className="font-medium mr-1">Notas usuario:</span>
                {booking.notes}
              </div>
            )}
            {canManageNotes && booking.internalNotes && (
              <div className="text-xs text-amber-900 bg-amber-50 p-1 rounded flex items-start gap-1">
                <StickyNote className="h-3 w-3 mt-0.5 shrink-0 text-amber-700" />
                <span className="whitespace-pre-wrap">
                  {booking.internalNotes}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingListItem;