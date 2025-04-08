// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User'; // Import User model
import { authenticate } from '@/lib/auth-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Regular users can only access their own apartment's bookings
    if (
      currentUser.role === 'user' && 
      booking.apartmentNumber !== currentUser.apartmentNumber
    ) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
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
    // Authenticate user
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Prevent regular admins (read-only) from updating bookings
    if (currentUser.role === 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to update bookings" },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const body = await req.json();
    const bookingId = params.id;
    
    // Get the original booking for activity log and permissions check
    const originalBooking = await Booking.findById(bookingId);
    
    if (!originalBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Permission check:
    // - Regular users can only update their own apartment's bookings
    // - Managers can view but not edit bookings
    // - Admins and IT admins can edit any booking
    if (
      (currentUser.role === 'user' && originalBooking.apartmentNumber !== currentUser.apartmentNumber) ||
      currentUser.role === 'manager'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to update this booking' },
        { status: 403 }
      );
    }
    
    // Regular users cannot modify confirmed bookings
    if (
      currentUser.role === 'user' && 
      originalBooking.status === 'confirmed'
    ) {
      return NextResponse.json(
        { error: 'Confirmed bookings cannot be modified by regular users' },
        { status: 403 }
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
    
    // Regular users cannot change apartment number
    if (currentUser.role === 'user') {
      body.apartmentNumber = currentUser.apartmentNumber;
    }
    
    // Always ensure userId is set to the authenticated user's ID
    // for better tracking who made the latest change
    const updateData = {
      ...body,
      userId: currentUser.id
    };
    
    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Get username for better activity logging
    const user = await User.findById(currentUser.id).select('name');
    
    // Prepare additional details for activity log
    let additionalDetails = '';
    
    if (body.prepararFuego) {
      additionalDetails += ' with fire preparation';
    }
    if (body.reservaHorno && body.reservaBrasa) {
      additionalDetails += additionalDetails ? ' and' : ' with';
      additionalDetails += ' oven and grill reservation';
    } else if (body.reservaHorno) {
      additionalDetails += additionalDetails ? ' and' : ' with';
      additionalDetails += ' oven reservation';
    } else if (body.reservaBrasa) {
      additionalDetails += additionalDetails ? ' and' : ' with';
      additionalDetails += ' grill reservation';
    }
    
    // Get the user's role to include in the activity log
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : 'Conserje'})` : '';
    
    // Log activity
    await ActivityLog.create({
      action: 'update',
      apartmentNumber: body.apartmentNumber,
      userId: currentUser.id,
      details: `${user ? user.name : 'Usuario'}${userRole} ha modificado la reserva de Apto #${body.apartmentNumber} para ${body.mealType === 'lunch' ? 'comida' : 'cena'} el ${new Date(body.date).toLocaleDateString('es-ES')}, mesas ${body.tables.join(', ')}${additionalDetails}`,
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
    // Authenticate user
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Prevent regular admins (read-only) from deleting bookings
    if (currentUser.role === 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to delete bookings" },
        { status: 403 }
      );
    }
    
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
    
    // Permission check:
    // - Regular users can only delete their own apartment's bookings
    // - Managers can view but not delete bookings
    // - Admins and IT admins can delete any booking
    if (
      (currentUser.role === 'user' && booking.apartmentNumber !== currentUser.apartmentNumber) ||
      currentUser.role === 'manager'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this booking' },
        { status: 403 }
      );
    }
    
    // Regular users cannot delete confirmed bookings
    if (
      currentUser.role === 'user' && 
      booking.status === 'confirmed'
    ) {
      return NextResponse.json(
        { error: 'Confirmed bookings cannot be deleted by regular users' },
        { status: 403 }
      );
    }
    
    // Get username for better activity logging
    const user = await User.findById(currentUser.id).select('name');
    
    // Prepare additional details for activity log
    let additionalDetails = '';
    if (booking.prepararFuego) {
      additionalDetails += ' con preparación de fuego';
    }
    if (booking.reservaHorno && booking.reservaBrasa) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de horno y brasa';
    } else if (booking.reservaHorno) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de horno';
    } else if (booking.reservaBrasa) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de brasa';
    }
    
    // Get the user's role to include in the activity log
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : 'Conserje'})` : '';
    
    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);
    
    // Log activity
    await ActivityLog.create({
      action: 'delete',
      apartmentNumber: booking.apartmentNumber,
      userId: currentUser.id,
      details: `${user ? user.name : 'Usuario'}${userRole} ha cancelado la reserva de Apto #${booking.apartmentNumber} para ${booking.mealType === 'lunch' ? 'comida' : 'cena'} el ${new Date(booking.date).toLocaleDateString('es-ES')}, mesas ${booking.tables.join(', ')}${additionalDetails}`,
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