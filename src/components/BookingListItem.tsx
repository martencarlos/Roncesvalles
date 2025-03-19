// src/components/BookingListItem.tsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IBooking } from '@/models/Booking';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Table, CheckCircle2, UtensilsCrossed, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BookingListItemProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  isPast?: boolean;
}

const BookingListItem: React.FC<BookingListItemProps> = ({ 
  booking, 
  onEdit, 
  onDelete,
  onConfirm,
  isPast = false
}) => {
  // Check if booking is confirmed, pending, or cancelled
  const isConfirmed = booking.status === 'confirmed';
  const isPending = booking.status === 'pending';
  const isCancelled = booking.status === 'cancelled';

  return (
    <div className={`p-3 sm:p-4 rounded-md border ${isPast && !isConfirmed && !isCancelled ? 'border-amber-300' : ''} ${isConfirmed ? 'border-green-300' : ''} ${isCancelled ? 'border-red-300 opacity-75' : ''}`}>
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Header with apartment number and status */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold">Apto. #{booking.apartmentNumber}</h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(booking.date), 'd MMM, yyyy', { locale: es })}
            </div>
          </div>
          <div>
            {isConfirmed && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Confirmado
              </Badge>
            )}
            {isPending && !isPast && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Pendiente
              </Badge>
            )}
            {isPending && isPast && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Por confirmar
              </Badge>
            )}
            {isCancelled && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Cancelado
              </Badge>
            )}
          </div>
        </div>

        {/* Booking details */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{booking.mealType === 'lunch' ? 'Comida' : 'Cena'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {isConfirmed && booking.finalAttendees !== undefined ? (
                <>
                  <span className="line-through text-muted-foreground mr-1">{booking.numberOfPeople}</span>
                  {booking.finalAttendees}
                </>
              ) : (
                booking.numberOfPeople
              )}
            </span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <Table className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Mesas: {booking.tables.map(t => `#${t}`).join(', ')}</span>
          </div>
        </div>

        {/* Services */}
        {(booking.reservaHorno || booking.reservaBrasa) && (
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span>Servicios:</span>
            <div className="flex gap-1">
              {booking.reservaHorno && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Horno
                </Badge>
              )}
              {booking.reservaBrasa && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  Brasa
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {isConfirmed && booking.notes && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Notas:</span> {booking.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-1">
          {isPending && isPast && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onConfirm} 
              className="h-8 text-xs px-2 border-amber-500 text-amber-700 hover:bg-amber-50 flex-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Confirmar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit} 
            className="h-8 text-xs px-2 flex-1"
            disabled={isPast && isConfirmed}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDelete} 
            className="h-8 text-xs px-2 flex-1"
            disabled={isPast && isConfirmed}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-8">
          {/* Apartment and status */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">Apto. #{booking.apartmentNumber}</h3>
              {/* Status indicator */}
              <div>
                {isConfirmed && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Confirmado
                  </Badge>
                )}
                {isPending && !isPast && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Pendiente
                  </Badge>
                )}
                {isPending && isPast && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Por confirmar
                  </Badge>
                )}
                {isCancelled && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Cancelado
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {booking.mealType === 'lunch' ? 'Comida' : 'Cena'} · {format(new Date(booking.date), 'd MMM, yyyy', { locale: es })}
            </div>
          </div>

          {/* People and tables */}
          <div className="flex flex-row gap-6">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">
                {isConfirmed && booking.finalAttendees !== undefined ? (
                  <>
                    <span className="line-through text-muted-foreground mr-1">{booking.numberOfPeople}</span>
                    {booking.finalAttendees}
                  </>
                ) : (
                  booking.numberOfPeople
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Table className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">Mesas: {booking.tables.map(t => `#${t}`).join(', ')}</span>
            </div>
          </div>

          {/* Services */}
          {(booking.reservaHorno || booking.reservaBrasa) && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Servicios:</span>
              <div className="flex gap-1">
                {booking.reservaHorno && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Horno
                  </Badge>
                )}
                {booking.reservaBrasa && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Brasa
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {isConfirmed && booking.notes && (
            <div className="text-xs text-muted-foreground sm:max-w-[250px] truncate">
              <span className="font-medium mr-1">Notas:</span>
              {booking.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {isPending && isPast && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onConfirm} 
              className="h-7 text-xs px-2 border-amber-500 text-amber-700 hover:bg-amber-50"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Confirmar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit} 
            className="h-7 text-xs px-2"
            disabled={isPast && isConfirmed}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDelete} 
            className="h-7 text-xs px-2"
            disabled={isPast && isConfirmed}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingListItem;