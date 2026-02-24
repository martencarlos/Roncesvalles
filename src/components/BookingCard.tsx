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
  isPast = false,
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

  return (
    <Card
      className={`overflow-hidden group ${
        isCompleted ? "border-green-300" : ""
      } ${isCancelled ? "border-red-300 opacity-75" : ""}`}
    >
      <CardHeader className="pb-2 px-4">
        {isRegularUser ? (
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
              </h3>
              <div className="text-xs text-muted-foreground mt-0.5">
                Apto. #{getApartmentLabel(booking.apartmentNumber)}
              </div>
            </div>
            <Badge
              className={`text-sm px-3 py-1 ${
                booking.mealType === "lunch"
                  ? "bg-orange-100 text-orange-800 border-orange-300"
                  : "bg-indigo-100 text-indigo-800 border-indigo-300"
              }`}
              variant="outline"
            >
              {booking.mealType === "lunch" ? "Comida" : "Cena"}
            </Badge>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base sm:text-lg">
              Apto. #{getApartmentLabel(booking.apartmentNumber)}
            </h3>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {format(new Date(booking.date), "d MMM, yyyy", { locale: es })}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-2 px-4 space-y-2">
        {!isRegularUser && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">Comida:</span>
            <Badge
              variant={booking.mealType === "lunch" ? "secondary" : "default"}
              className="capitalize"
            >
              {booking.mealType === "lunch" ? "Comida" : "Cena"}
            </Badge>
          </div>
        )}

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
            {isCompleted && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                Completado
              </Badge>
            )}
            {isPending && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200"
              >
                Reservado
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
              <p className="text-xs">Sin servicio de conserjería.</p>
            </div>
          </div>
        )}

        {!booking.noCleaningService && isConserje && (
          <div className="mt-2 pt-2 border-t text-sm">
            <div className="flex items-start text-green-700 gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="text-xs">Con servicio de conserjería.</p>
            </div>
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
      </CardContent>

      <CardFooter className="pt-2 flex justify-end gap-2 px-4 pb-4">
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
      </CardFooter>
    </Card>
  );
};

export default BookingCard;
