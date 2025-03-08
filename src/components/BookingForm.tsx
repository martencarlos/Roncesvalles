// src/components/BookingForm.tsx
import React, { useState } from 'react';
import { IBooking, MealType } from '@/models/Booking';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

  const availableTables = [1, 2, 3, 4, 5, 6];

  const handleTableToggle = (tableNum: number) => {
    setSelectedTables(prev => {
      if (prev.includes(tableNum)) {
        return prev.filter(t => t !== tableNum);
      } else {
        return [...prev, tableNum];
      }
    });
  };

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
        <div className="grid grid-cols-3 gap-2">
          {availableTables.map((tableNum) => (
            <Button
              key={tableNum}
              type="button"
              variant={selectedTables.includes(tableNum) ? "default" : "outline"}
              onClick={() => handleTableToggle(tableNum)}
              className="h-10"
            >
              Table {tableNum}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData?._id ? 'Update Booking' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;