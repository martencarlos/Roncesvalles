// src/components/BookingForm.tsx
import React, { useState, useEffect } from 'react';
import { IBooking, MealType } from '@/models/Booking';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import {es} from 'date-fns/locale/es';
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon, LockIcon } from 'lucide-react';

// Registrar el locale español para el datepicker
registerLocale('es', es);

interface BookingFormProps {
  onSubmit: (data: Partial<IBooking>) => Promise<void>;
  initialData?: Partial<IBooking>;
  onCancel: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  onSubmit, 
  initialData, 
  onCancel 
}) => {
  const [apartmentNumber, setApartmentNumber] = useState<number>(
    initialData?.apartmentNumber || 1
  );
  const [date, setDate] = useState<Date>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  const [mealType, setMealType] = useState<MealType>(
    initialData?.mealType || 'lunch'
  );
  const [numberOfPeople, setNumberOfPeople] = useState<number>(
    initialData?.numberOfPeople || 1
  );
  const [selectedTables, setSelectedTables] = useState<number[]>(
    initialData?.tables || []
  );
  const [bookedTables, setBookedTables] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reservaHorno, setReservaHorno] = useState<boolean>(
    initialData?.reservaHorno || false
  );
  const [reservaBrasa, setReservaBrasa] = useState<boolean>(
    initialData?.reservaBrasa || false
  );
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Get booked tables for selected date and meal type
  useEffect(() => {
    const fetchBookedTables = async () => {
      if (!date || !mealType) return;
      
      setLoading(true);
      
      try {
        // Format date to ISO string
        const dateString = date.toISOString().split('T')[0];
        
        // Fetch bookings for selected date and meal type
        const res = await fetch(`/api/bookings?date=${dateString}&mealType=${mealType}`);
        
        if (!res.ok) {
          throw new Error('Error al obtener reservas');
        }
        
        const bookings: IBooking[] = await res.json();
        
        // Filter out the current booking being edited if applicable
        const filteredBookings = initialData?._id 
          ? bookings.filter(booking => booking._id !== initialData._id)
          : bookings;
        
        // Get all booked tables
        const tables = filteredBookings.flatMap(booking => booking.tables);
        
        setBookedTables(tables);
      } catch (err) {
        console.error('Error fetching booked tables:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookedTables();
  }, [date, mealType, initialData?._id]);

  // Toggle for table selection
  const toggleTable = (tableNumber: number) => {
    // Don't allow toggling of booked tables
    if (bookedTables.includes(tableNumber)) return;
    
    setSelectedTables(prev => {
      if (prev.includes(tableNumber)) {
        return prev.filter(t => t !== tableNumber);
      } else {
        return [...prev, tableNumber];
      }
    });
  };

  // Check if a table is selected
  const isSelected = (tableNumber: number) => selectedTables.includes(tableNumber);
  
  // Check if a table is booked by someone else
  const isBooked = (tableNumber: number) => bookedTables.includes(tableNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedTables.length === 0) {
      setError('Por favor, seleccione al menos una mesa');
      toast.error("Error de Validación", {
        description: "Por favor, seleccione al menos una mesa"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        apartmentNumber,
        date,
        mealType,
        numberOfPeople,
        tables: selectedTables,
        reservaHorno,
        reservaBrasa,
      });
    } catch (error: any) {
      setError(error.message || 'Error al enviar la reserva');
      toast.error("Error", {
        description: error.message || 'Error al enviar la reserva'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get table style classes based on status
  const getTableClasses = (tableNumber: number) => {
    if (isBooked(tableNumber)) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed relative';
    }
    
    if (isSelected(tableNumber)) {
      return 'bg-primary text-primary-foreground cursor-pointer';
    }
    
    return 'bg-orange-300 hover:bg-orange-400 cursor-pointer';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="apartmentNumber">Número de Apartamento</Label>
        <Input
          id="apartmentNumber"
          type="number"
          min="1"
          max="48"
          required
          value={apartmentNumber}
          onChange={(e) => setApartmentNumber(parseInt(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <div className="relative flex items-center w-full sm:w-auto">
          <div className="absolute left-3 pointer-events-none text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <DatePicker
            selected={date}
            onChange={(date: Date) => setDate(date)}
            minDate={new Date()}
            dateFormat="d MMMM, yyyy"
            locale="es"
            className="w-full p-2 border rounded-md pl-10"
            wrapperClassName="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mealType">Tipo de Comida</Label>
        <RadioGroup 
          value={mealType} 
          onValueChange={(value) => setMealType(value as MealType)} 
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lunch" id="lunch" />
            <Label htmlFor="lunch">Comida</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dinner" id="dinner" />
            <Label htmlFor="dinner">Cena</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfPeople">Número de Personas</Label>
        <Input
          id="numberOfPeople"
          type="number"
          min="1"
          required
          value={numberOfPeople}
          onChange={(e) => setNumberOfPeople(parseInt(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label>Seleccionar Mesas</Label>
        <Card className="w-full">
          <CardContent className="p-2 sm:p-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Leyenda para mesas */}
                <div className="flex justify-end mb-2 gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-300 rounded-sm"></div>
                    <span>Disponible</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-primary rounded-sm"></div>
                    <span>Seleccionada</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                    <span>Reservada</span>
                  </div>
                </div>
                
                {/* Disposición de mesa en forma de U - Optimizado para móvil */}
                <div className="relative w-full aspect-video bg-gray-100 rounded-md mb-4">
                  {/* Mesas del lado izquierdo (1 y 2) */}
                  <div className="absolute flex flex-col items-start justify-end h-full left-0 py-2 sm:py-4">
                    <div 
                      className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center text-sm sm:text-base ${getTableClasses(2)}`}
                      onClick={() => toggleTable(2)}
                    >
                      <span className="font-bold">2</span>
                      {isBooked(2) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}
                    </div>
                    <div 
                      className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center text-sm sm:text-base ${getTableClasses(1)}`}
                      onClick={() => toggleTable(1)}
                    >
                      <span className="font-bold">1</span>
                      {isBooked(1) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}
                    </div>
                  </div>
                  
                  {/* Mesas centrales superiores (3 y 4) */}
                  <div className="absolute flex justify-center space-x-2 sm:space-x-4 w-full top-2 sm:top-4">
                    <div 
                      className={`w-16 h-12 sm:w-24 sm:h-16 rounded-md flex items-center justify-center text-sm sm:text-base ${getTableClasses(3)}`}
                      onClick={() => toggleTable(3)}
                    >
                      <span className="font-bold">3</span>
                      {isBooked(3) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}
                    </div>
                    <div 
                      className={`w-16 h-12 sm:w-24 sm:h-16 rounded-md flex items-center justify-center text-sm sm:text-base ${getTableClasses(4)}`}
                      onClick={() => toggleTable(4)}
                    >
                      <span className="font-bold">4</span>
                      {isBooked(4) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}
                    </div>
                  </div>
                  
                  {/* Mesas del lado derecho (5 y 6) */}
                  <div className="absolute flex flex-col items-end justify-end h-full right-0 py-2 sm:py-4">
                    <div 
                      className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center text-sm sm:text-base ${getTableClasses(5)}`}
                      onClick={() => toggleTable(5)}
                    >
                      <span className="font-bold">5</span>
                      {isBooked(5) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}
                    </div>
                    <div 
                      className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center text-sm sm:text-base ${getTableClasses(6)}`}
                      onClick={() => toggleTable(6)}
                    >
                      <span className="font-bold">6</span>
                      {isBooked(6) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}
                    </div>
                  </div>
                </div>
                
                {/* Mostrar mesas seleccionadas */}
                <div className="mb-2">
                  <p className="font-medium text-sm sm:text-base">Mesas seleccionadas: {selectedTables.length > 0 ? selectedTables.sort((a, b) => a - b).join(', ') : 'Ninguna'}</p>
                </div>
                
                {/* Botón para limpiar selección */}
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setSelectedTables([])}
                  className="w-full"
                  size="sm"
                >
                  Limpiar Selección
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label>Opciones Adicionales</Label>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="reservaHorno" 
              checked={reservaHorno} 
              onCheckedChange={() => setReservaHorno(!reservaHorno)} 
            />
            <Label htmlFor="reservaHorno" className="font-normal cursor-pointer">
              Reserva de horno
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="reservaBrasa" 
              checked={reservaBrasa} 
              onCheckedChange={() => setReservaBrasa(!reservaBrasa)} 
            />
            <Label htmlFor="reservaBrasa" className="font-normal cursor-pointer">
              Reserva de brasa
            </Label>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} className="w-full sm:w-auto">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Guardando...' : initialData?._id ? 'Actualizar Reserva' : 'Crear Reserva'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;