// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(booking);
  } catch (error) {
    console.error(`GET /api/bookings/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const body = await req.json();
    const bookingId = params.id;
    
    // Get the original booking for activity log
    const originalBooking = await Booking.findById(bookingId);
    
    if (!originalBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check for conflicting tables on the same date and meal type (excluding this booking)
    const bookingDate = new Date(body.date);
    const startOfDay = new Date(bookingDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(bookingDate.setHours(23, 59, 59, 999));
    
    const existingBookings = await Booking.find({
      _id: { $ne: bookingId },
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
    
    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      body,
      { new: true, runValidators: true }
    );
    
    // Prepare additional details for activity log
    let additionalDetails = '';
    if (body.reservaHorno && body.reservaBrasa) {
      additionalDetails = ' with oven and grill reservation';
    } else if (body.reservaHorno) {
      additionalDetails = ' with oven reservation';
    } else if (body.reservaBrasa) {
      additionalDetails = ' with grill reservation';
    }
    
    // Log activity
    await ActivityLog.create({
      action: 'update',
      apartmentNumber: body.apartmentNumber,
      details: `Apt #${body.apartmentNumber} modified booking for ${body.mealType} on ${new Date(body.date).toLocaleDateString()}, tables ${body.tables.join(', ')}${additionalDetails}`,
    });
    
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error(`PUT /api/bookings/${params.id} error:`, error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation Error', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const bookingId = params.id;
    
    // Get the booking details before deletion for activity log
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Prepare additional details for activity log
    let additionalDetails = '';
    if (booking.reservaHorno && booking.reservaBrasa) {
      additionalDetails = ' with oven and grill reservation';
    } else if (booking.reservaHorno) {
      additionalDetails = ' with oven reservation';
    } else if (booking.reservaBrasa) {
      additionalDetails = ' with grill reservation';
    }
    
    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);
    
    // Log activity
    await ActivityLog.create({
      action: 'delete',
      apartmentNumber: booking.apartmentNumber,
      details: `Apt #${booking.apartmentNumber} cancelled booking for ${booking.mealType} on ${new Date(booking.date).toLocaleDateString()}, tables ${booking.tables.join(', ')}${additionalDetails}`,
    });
    
    return NextResponse.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error(`DELETE /api/bookings/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}