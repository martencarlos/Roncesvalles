// src/components/BookingCard.tsx
import React from 'react';
import { format } from 'date-fns';
import { IBooking } from '@/models/Booking';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookingCardProps {
  booking: IBooking;
  onEdit: () => void;
  onDelete: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Apt #{booking.apartmentNumber}</h3>
          <div className="text-sm text-muted-foreground">
            {format(new Date(booking.date), 'MMM d, yyyy')}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium text-sm">Meal:</span>
            <Badge variant={booking.mealType === 'lunch' ? 'secondary' : 'default'}>
              {booking.mealType === 'lunch' ? 'Lunch' : 'Dinner'}
            </Badge>
          </div>
          <p className="text-sm flex justify-between">
            <span className="font-medium">People:</span>
            <span>{booking.numberOfPeople}</span>
          </p>
          <p className="text-sm flex justify-between">
            <span className="font-medium">Tables:</span>
            <span>{booking.tables.map(t => `#${t}`).join(', ')}</span>
          </p>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BookingCard;