// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const mealTypeParam = url.searchParams.get('mealType');
    
    // Build query
    let query: any = {};
    
    if (dateParam) {
      const date = new Date(dateParam);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    if (mealTypeParam && (mealTypeParam === 'lunch' || mealTypeParam === 'dinner')) {
      query.mealType = mealTypeParam;
    }
    
    // Sort by date, meal type, then by apartment number
    const bookings = await Booking.find(query).sort({ date: 1, mealType: 1, apartmentNumber: 1 });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    
    // Check for conflicting tables on the same date and meal type
    const bookingDate = new Date(body.date);
    const startOfDay = new Date(bookingDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(bookingDate.setHours(23, 59, 59, 999));
    
    const existingBookings = await Booking.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      mealType: body.mealType
    });
    
    // Check for table conflicts
    const bookedTables = existingBookings.flatMap(booking => booking.tables);
    const requestedTables = body.tables;
    
    const conflictingTables = requestedTables.filter((table: any) => 
      bookedTables.includes(table)
    );
    
    if (conflictingTables.length > 0) {
      return NextResponse.json(
        { 
          error: 'Booking conflict', 
          message: `Tables ${conflictingTables.join(', ')} are already booked for ${body.mealType} on this date.` 
        },
        { status: 409 }
      );
    }
    
    // Create new booking
    const newBooking = await Booking.create(body);
    
    // Log activity
    await ActivityLog.create({
      action: 'create',
      apartmentNumber: body.apartmentNumber,
      details: `Apt #${body.apartmentNumber} booked tables ${body.tables.join(', ')} for ${body.mealType} on ${new Date(body.date).toLocaleDateString()}`,
    });
    
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/bookings error:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}