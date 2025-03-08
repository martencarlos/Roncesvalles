// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, History, Filter, UtensilsCrossed } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import BookingCard from '@/components/BookingCard';
import BookingFormModal from '@/components/BookingFormModal';
import { IBooking, MealType } from '@/models/Booking';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Home() {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<IBooking[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<IBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtering, setFiltering] = useState<boolean>(false);
  
  // Function to fetch all bookings
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/bookings');
      
      if (!res.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await res.json();
      
      // Sort bookings by date (newest first)
      const sortedData = [...data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setBookings(sortedData);
      setFilteredBookings(sortedData);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBookings();
  }, []);
  
  // Filter bookings by selected date and meal type when filtering is enabled
  useEffect(() => {
    if (filtering && selectedDate) {
      const selectedDateStart = new Date(selectedDate);
      selectedDateStart.setHours(0, 0, 0, 0);
      
      const selectedDateEnd = new Date(selectedDate);
      selectedDateEnd.setHours(23, 59, 59, 999);
      
      const filtered = bookings.filter(booking => {
        const bookingDate = new Date(booking.date);
        const dateMatches = bookingDate >= selectedDateStart && bookingDate <= selectedDateEnd;
        return filtering ? dateMatches : true;
      });
      
      setFilteredBookings(filtered);
    } else {
      setFilteredBookings(bookings);
    }
  }, [filtering, selectedDate, bookings]);
  
  const handleCreateBooking = async (data: Partial<IBooking>) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }
      
      // Close form and refresh bookings
      setShowForm(false);
      fetchBookings();
      toast.success("Booking Created", {
        description: `Apt #${data.apartmentNumber} booked tables ${data.tables?.join(', ')} for ${data.mealType} on ${format(data.date as Date, 'MMM d, yyyy')}`,
      });
    } catch (err: any) {
      throw err;
    }
  };
  
  const handleUpdateBooking = async (data: Partial<IBooking>) => {
    if (!editingBooking?._id) return;
    
    try {
      const res = await fetch(`/api/bookings/${editingBooking._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update booking');
      }
      
      // Close form and refresh bookings
      setEditingBooking(null);
      fetchBookings();
      toast.success("Booking Updated", {
        description: `Updated booking for Apt #${data.apartmentNumber}`,
      });
    } catch (err: any) {
      throw err;
    }
  };
  
  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete booking');
      }
      
      // Refresh bookings
      fetchBookings();
      toast.error("Booking Deleted", {
        description: "The booking has been successfully deleted",
      });
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    }
  };
  
  // Get all booked tables for the selected date and meal type
  const getBookedTablesForDateAndMeal = (date: Date, mealType: MealType) => {
    const selectedDateStart = new Date(date);
    selectedDateStart.setHours(0, 0, 0, 0);
    
    const selectedDateEnd = new Date(date);
    selectedDateEnd.setHours(23, 59, 59, 999);
    
    const bookingsForDate = bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate >= selectedDateStart && 
             bookingDate <= selectedDateEnd && 
             booking.mealType === mealType;
    });
    
    return new Set(bookingsForDate.flatMap(booking => booking.tables));
  };
  
  const bookedTablesLunch = getBookedTablesForDateAndMeal(selectedDate, 'lunch');
  const availableTablesLunch = [1, 2, 3, 4, 5, 6].filter(table => !bookedTablesLunch.has(table));
  
  const bookedTablesDinner = getBookedTablesForDateAndMeal(selectedDate, 'dinner');
  const availableTablesDinner = [1, 2, 3, 4, 5, 6].filter(table => !bookedTablesDinner.has(table));
  
  const toggleFiltering = () => {
    setFiltering(!filtering);
  };
  
  // Group bookings by date for better organization
  const groupedBookings: {[key: string]: IBooking[]} = {};
  
  filteredBookings.forEach(booking => {
    const dateKey = format(new Date(booking.date), 'yyyy-MM-dd');
    if (!groupedBookings[dateKey]) {
      groupedBookings[dateKey] = [];
    }
    groupedBookings[dateKey].push(booking);
  });
  
  // Sort date keys chronologically
  const sortedDateKeys = Object.keys(groupedBookings).sort();
  
  const handleNewBooking = () => {
    setShowForm(true);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4 min-h-screen">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sociedad Roncesvalles</h1>
          <Button asChild variant="outline">
            <Link href="/activity">
              <History className="h-4 w-4 mr-2" />
              View Activity Log
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date) => setSelectedDate(date)}
                dateFormat="MMMM d, yyyy"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <Button 
              variant={filtering ? "default" : "outline"} 
              onClick={toggleFiltering}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {filtering ? "Clear Filter" : "Filter"}
            </Button>
            </div>
          
          <Button onClick={handleNewBooking}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
        
        <Tabs defaultValue="lunch" onValueChange={(value) => setSelectedMealType(value as MealType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="lunch">Lunch</TabsTrigger>
            <TabsTrigger value="dinner">Dinner</TabsTrigger>
          </TabsList>
          <TabsContent value="lunch">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Available Tables for Lunch on {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableTablesLunch.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTablesLunch.map(table => (
                      <Badge key={table} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Table #{table}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500">All tables are booked for lunch on this date.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dinner">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  Available Tables for Dinner on {format(selectedDate, 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableTablesDinner.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableTablesDinner.map(table => (
                      <Badge key={table} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Table #{table}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-red-500">All tables are booked for dinner on this date.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </header>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Booking Form Modal */}
      <BookingFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreateBooking}
        initialData={{ date: selectedDate, mealType: selectedMealType }}
        isEditing={false}
      />
      
      {/* Edit Booking Modal */}
      {editingBooking && (
        <BookingFormModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleUpdateBooking}
          initialData={editingBooking}
          isEditing={true}
        />
      )}
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {filtering 
              ? `Bookings for ${format(selectedDate, 'MMMM d, yyyy')}` 
              : "All Bookings"}
          </h2>
          {filtering && filteredBookings.length === 0 && (
            <Button variant="outline" onClick={() => setFiltering(false)}>
              Show All Bookings
            </Button>
          )}
        </div>
        <Separator className="mb-4" />
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-8">
            {sortedDateKeys.map(dateKey => (
              <div key={dateKey}>
                <h3 className="text-lg font-medium mb-3 bg-gray-100 p-2 rounded">
                  {format(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedBookings[dateKey]
                    .sort((a, b) => {
                      // Sort by meal type first (lunch first, then dinner)
                      if (a.mealType !== b.mealType) {
                        return a.mealType === 'lunch' ? -1 : 1;
                      }
                      // Then by apartment number
                      return a.apartmentNumber - b.apartmentNumber;
                    })
                    .map(booking => (
                      <BookingCard
                        key={booking._id as string}
                        booking={booking}
                        onEdit={() => setEditingBooking(booking)}
                        onDelete={() => handleDeleteBooking(booking._id as string)}
                      />
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            {filtering ? "No bookings for this date." : "No bookings available."}
          </p>
        )}
      </div>
    </div>
  );
}