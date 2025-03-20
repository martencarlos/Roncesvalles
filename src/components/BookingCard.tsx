// src/components/BookingCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IBooking } from '@/models/Booking';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Table, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingCardProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: (booking: IBooking) => void;
  onConfirm: () => void;
  isPast?: boolean;
}

const BookingCard: React.FC<BookingCardProps> = ({ 
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
    <Card className={`overflow-hidden group ${isPast && !isConfirmed && !isCancelled ? 'border-amber-300' : ''} ${isConfirmed ? 'border-green-300' : ''} ${isCancelled ? 'border-red-300 opacity-75' : ''}`}>
      <CardHeader className="pb-2 px-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-base sm:text-lg">Apto. #{booking.apartmentNumber}</h3>
          <div className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(booking.date), 'd MMM, yyyy', { locale: es })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Comida:</span>
          <Badge variant={booking.mealType === 'lunch' ? 'secondary' : 'default'} className="capitalize">
            {booking.mealType === 'lunch' ? 'Comida' : 'Cena'}
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
                <span className="line-through text-muted-foreground mr-1">{booking.numberOfPeople}</span>
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
          <span className="text-sm">{booking.tables.map(t => `#${t}`).join(', ')}</span>
        </div>
        
        {(booking.prepararFuego || booking.reservaHorno || booking.reservaBrasa) && (
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium">Servicios:</span>
            </div>
            <div className="text-sm flex gap-1 flex-wrap justify-end">
              {booking.prepararFuego && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Fuego
                </Badge>
              )}
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
        
        {/* Status indicator */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium">Estado:</span>
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
        
        {/* Notes section (only for confirmed bookings) */}
        {isConfirmed && booking.notes && (
          <div className="mt-2 pt-2 border-t text-sm">
            <div className="font-medium mb-1">Notas:</div>
            <p className="text-muted-foreground text-xs">{booking.notes}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2 px-4">
        {/* Show buttons always on mobile, but only on hover for desktop */}
        <div className="sm:hidden flex gap-2 w-full">
          {isPending && isPast && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onConfirm} 
              className="cursor-pointer h-7 text-xs px-2 border-amber-500 text-amber-700 hover:bg-amber-50 flex-1"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Confirmar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit} 
            className="cursor-pointer h-7 text-xs px-2 flex-1"
            disabled={isPast && isConfirmed}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(booking)}
            className="cursor-pointer h-7 text-xs px-2 flex-1"
            disabled={isPast && isConfirmed}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
        
        {/* Desktop view - buttons only appear on hover */}
        <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPending && isPast && (
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
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit} 
            className="cursor-pointer h-7 text-xs px-2"
            disabled={isPast && isConfirmed}
          >
            <Edit className="h-3 w-3 mr-1" />
            Editar
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(booking)}
            className="cursor-pointer h-7 text-xs px-2"
            disabled={isPast && isConfirmed}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BookingCard;