// src/components/BookingForm.tsx
import React, { useState } from 'react';
import { IBooking, MealType } from '@/models/Booking';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Toggle table selection
  const toggleTable = (tableNumber: number) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedTables.length === 0) {
      setError('Please select at least one table');
      toast.error("Validation Error", {
        description: "Please select at least one table"
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
      });
    } catch (error: any) {
      setError(error.message || 'Failed to submit booking');
      toast.error("Error", {
        description: error.message || 'Failed to submit booking'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="apartmentNumber">Apartment Number</Label>
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
        <Label htmlFor="date">Date</Label>
        <div className="relative">
          <DatePicker
            selected={date}
            onChange={(date: Date) => setDate(date)}
            minDate={new Date()}
            dateFormat="MMMM d, yyyy"
            className="w-full p-2 border rounded-md"
            wrapperClassName="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mealType">Meal Type</Label>
        <RadioGroup 
          value={mealType} 
          onValueChange={(value) => setMealType(value as MealType)} 
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lunch" id="lunch" />
            <Label htmlFor="lunch">Lunch</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dinner" id="dinner" />
            <Label htmlFor="dinner">Dinner</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="numberOfPeople">Number of People</Label>
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
        <Label>Select Tables</Label>
        <Card className="w-full">
          <CardContent className="p-2 sm:p-4">
            {/* U-shaped table layout - Mobile optimized */}
            <div className="relative w-full aspect-video bg-gray-100 rounded-md mb-4">
              {/* Left side tables (1 and 2) */}
              <div className="absolute flex flex-col items-start justify-end h-full left-0 py-2 sm:py-4">
                <div 
                  className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center cursor-pointer text-sm sm:text-base ${isSelected(1) ? 'bg-primary text-primary-foreground' : 'bg-orange-300 hover:bg-orange-400'}`}
                  onClick={() => toggleTable(1)}
                >
                  <span className="font-bold">1</span>
                </div>
                <div 
                  className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center cursor-pointer text-sm sm:text-base ${isSelected(2) ? 'bg-primary text-primary-foreground' : 'bg-orange-300 hover:bg-orange-400'}`}
                  onClick={() => toggleTable(2)}
                >
                  <span className="font-bold">2</span>
                </div>
              </div>
              
              {/* Center top tables (3 and 4) */}
              <div className="absolute flex justify-center space-x-2 sm:space-x-4 w-full top-2 sm:top-4">
                <div 
                  className={`w-16 h-12 sm:w-24 sm:h-16 rounded-md flex items-center justify-center cursor-pointer text-sm sm:text-base ${isSelected(3) ? 'bg-primary text-primary-foreground' : 'bg-orange-300 hover:bg-orange-400'}`}
                  onClick={() => toggleTable(3)}
                >
                  <span className="font-bold">3</span>
                </div>
                <div 
                  className={`w-16 h-12 sm:w-24 sm:h-16 rounded-md flex items-center justify-center cursor-pointer text-sm sm:text-base ${isSelected(4) ? 'bg-primary text-primary-foreground' : 'bg-orange-300 hover:bg-orange-400'}`}
                  onClick={() => toggleTable(4)}
                >
                  <span className="font-bold">4</span>
                </div>
              </div>
              
              {/* Right side tables (5 and 6) */}
              <div className="absolute flex flex-col items-end justify-end h-full right-0 py-2 sm:py-4">
                <div 
                  className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center cursor-pointer text-sm sm:text-base ${isSelected(5) ? 'bg-primary text-primary-foreground' : 'bg-orange-300 hover:bg-orange-400'}`}
                  onClick={() => toggleTable(5)}
                >
                  <span className="font-bold">5</span>
                </div>
                <div 
                  className={`w-16 h-12 sm:w-24 sm:h-16 m-1 sm:m-2 rounded-md flex items-center justify-center cursor-pointer text-sm sm:text-base ${isSelected(6) ? 'bg-primary text-primary-foreground' : 'bg-orange-300 hover:bg-orange-400'}`}
                  onClick={() => toggleTable(6)}
                >
                  <span className="font-bold">6</span>
                </div>
              </div>
            </div>
            
            {/* Selected tables display */}
            <div className="mb-2">
              <p className="font-medium text-sm sm:text-base">Selected Tables: {selectedTables.length > 0 ? selectedTables.sort((a, b) => a - b).join(', ') : 'None'}</p>
            </div>
            
            {/* Clear selection button */}
            <Button 
              variant="outline" 
              type="button"
              onClick={() => setSelectedTables([])}
              className="w-full"
              size="sm"
            >
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? 'Saving...' : initialData?._id ? 'Update Booking' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;