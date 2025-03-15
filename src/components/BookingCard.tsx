// src/components/BookingCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IBooking } from '@/models/Booking';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Table } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingCardProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onEdit, onDelete }) => {
  return (
    <Card className="overflow-hidden">
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
          <span className="text-sm">{booking.numberOfPeople}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Table className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">Mesas:</span>
          </div>
          <span className="text-sm">{booking.tables.map(t => `#${t}`).join(', ')}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2 px-4">
        <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-xs px-2">
          <Edit className="h-3 w-3 mr-1" />
          Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete} className="h-7 text-xs px-2">
          <Trash2 className="h-3 w-3 mr-1" />
          Eliminar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingCard;