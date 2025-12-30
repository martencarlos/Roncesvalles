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
import { Badge } from "@/components/ui/badge";
import { Session } from "next-auth";

interface BookingCardProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: (booking: IBooking) => void;
  onConfirm: () => void;
  // New prop for editing notes
  onEditNote?: (booking: IBooking) => void;
  isPast?: boolean;
  session: Session | null;
}

const BookingCard: React.FC<BookingCardProps> = ({
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
  const isITAdmin = userRole === "it_admin";
  const isConserje = userRole === "conserje";

  // Conserje and IT Admin can manage internal notes
  const canManageNotes = isITAdmin || isConserje;

  const canEdit =
    isITAdmin || (isOwner && (!isConfirmed || !isPast) && userRole === "user");
  const canDelete =
    isITAdmin || (isOwner && (!isConfirmed || !isPast) && userRole === "user");
  const canConfirm =
    isITAdmin || (isOwner && isPending && isPast && userRole === "user");

  // Read-only for regular admins (who are NOT conserjes or IT admins)
  const isReadOnly = userRole === "admin";

  return (
    <Card
      className={`overflow-hidden group ${
        isPast && !isConfirmed && !isCancelled ? "border-amber-300" : ""
      } ${isConfirmed ? "border-green-300" : ""} ${
        isCancelled ? "border-red-300 opacity-75" : ""
      }`}
    >
      <CardHeader className="pb-2 px-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base sm:text-lg">
            Apto. #{booking.apartmentNumber}
          </h3>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Comida:</span>
          <Badge
            variant={booking.mealType === "lunch" ? "secondary" : "default"}
            className="capitalize"
          >
            {booking.mealType === "lunch" ? "Comida" : "Cena"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Personas:</span>
          </div>
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
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium">Servicios:</span>
            </div>
            <div className="text-sm flex gap-1 flex-wrap justify-end">
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

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Estado:</span>
          </div>
          <div>
            {isConfirmed && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Confirmado
              </Badge>
            )}
            {isPending && !isPast && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Pendiente
              </Badge>
            )}
            {isPending && isPast && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                Por confirmar
              </Badge>
            )}
            {isCancelled && (
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                Cancelado
              </Badge>
            )}
          </div>
        </div>

        {booking.noCleaningService && (
          <div className="mt-2 pt-2 border-t text-sm">
            <div className="flex items-start text-amber-700 gap-1">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="text-xs">Sin servicio de limpieza.</p>
            </div>
          </div>
        )}

        {/* User Notes */}
        {isConfirmed && booking.notes && (
          <div className="mt-2 pt-2 border-t text-sm">
            <div className="font-medium mb-1 text-xs">Notas usuario:</div>
            <p className="text-muted-foreground text-xs italic">
              {booking.notes}
            </p>
          </div>
        )}

        {/* Internal Notes Display (Only for Conserje/IT Admin) */}
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
      </CardContent>

      <CardFooter className="pt-2 flex justify-end gap-2 px-4 pb-4">
        {/* Conserje/IT Admin Button for Notes */}
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

        {/* Standard Action Buttons */}
        {!isReadOnly && (
          <div className="flex gap-2">
            {canConfirm && (
              <Button
                variant="outline"
                size="sm"
                onClick={onConfirm}
                className="cursor-pointer h-7 text-xs px-2 border-amber-500 text-amber-700 hover:bg-amber-50"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
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
                <Edit className="h-3 w-3 mr-1" />
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
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default BookingCard;
