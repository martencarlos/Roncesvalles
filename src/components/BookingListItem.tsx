// src/components/BookingListItem.tsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IBooking } from '@/models/Booking';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Table, CheckCircle2, UtensilsCrossed, CalendarDays, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Session } from 'next-auth';

interface BookingListItemProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: (booking: IBooking) => void;
  onConfirm: () => void;
  isPast?: boolean;
  session: Session | null;
}

const BookingListItem: React.FC<BookingListItemProps> = ({ 
  booking, 
  onEdit, 
  onDelete,
  onConfirm,
  isPast = false,
  session
}) => {
  // Check if booking is confirmed, pending, or cancelled
  const isConfirmed = booking.status === 'confirmed';
  const isPending = booking.status === 'pending';
  const isCancelled = booking.status === 'cancelled';
  
  // Check user permissions
  const userRole = session?.user?.role || 'user';
  const isOwner = session?.user?.apartmentNumber === booking.apartmentNumber;
  const isAdmin = userRole === 'admin'; // Read-only admin
  const isITAdmin = userRole === 'it_admin';
  const isManager = userRole === 'manager';
  
  // Determine if user can edit/delete/confirm this booking
  const canEdit = isITAdmin || (isOwner && (!isConfirmed || !isPast) && userRole === 'user');
  const canDelete = isITAdmin || (isOwner && (!isConfirmed || !isPast) && userRole === 'user');
  const canConfirm = isITAdmin || (isOwner && isPending && isPast && userRole === 'user');
  
  // Read-only view for managers and regular admins
  const isReadOnly = isManager || isAdmin;

  return (
    <div className={`p-3 sm:p-4 rounded-md border group ${isPast && !isConfirmed && !isCancelled ? 'border-amber-300' : ''} ${isConfirmed ? 'border-green-300' : ''} ${isCancelled ? 'border-red-300 opacity-75' : ''}`}>
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
        {(booking.prepararFuego || booking.reservaHorno || booking.reservaBrasa) && (
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span>Servicios:</span>
            <div className="flex gap-1 flex-wrap">
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

        {/* No Cleaning Service Warning */}
        {booking.noCleaningService && (
          <div className="flex items-start gap-1 text-sm text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p className="text-xs">Sin servicio de limpieza</p>
          </div>
        )}

        {/* Notes */}
        {isConfirmed && booking.notes && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Notas:</span> {booking.notes}
          </div>
        )}

        {/* Mobile Action buttons - always visible (if not read-only) */}
        {!isReadOnly && (
          <div className="flex gap-2 justify-end mt-1">
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
        )}
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
          {(booking.prepararFuego || booking.reservaHorno || booking.reservaBrasa) && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Servicios:</span>
              <div className="flex gap-1">
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

          {/* Cleaning Service Warning */}
          {booking.noCleaningService && (
            <div className="flex items-center gap-1 text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-xs">Sin servicio de limpieza</span>
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

        {/* Desktop Action buttons - only visible on hover (if not read-only) */}
        {!isReadOnly && (
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
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
        )}
      </div>
    </div>
  );
};

export default BookingListItem;