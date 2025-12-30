// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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
    // Get session directly
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("No valid session found in booking ID GET route");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    
    const currentUser = session.user;
    
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
    // Get session directly
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("No valid session found in booking ID PUT route");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    
    const currentUser = session.user;
    console.log("Current user from session:", currentUser.email, "ID:", currentUser.id);

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
    
    // Get the original booking
    const originalBooking = await Booking.findById(bookingId);
    
    if (!originalBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Permission check
    if (
      (currentUser.role === 'user' && originalBooking.apartmentNumber !== currentUser.apartmentNumber) 
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to update this booking' },
        { status: 403 }
      );
    }
    
    // Confirmed booking check
    if (
      currentUser.role === 'user' && 
      originalBooking.status === 'confirmed'
    ) {
      return NextResponse.json(
        { error: 'Confirmed bookings cannot be modified by regular users' },
        { status: 403 }
      );
    }
    
    // Determine Effective Date (New date or keep original)
    const effectiveDate = body.date ? new Date(body.date) : new Date(originalBooking.date);
    
    // Check for conflicts if date or mealType changes, or tables change
    // Simplified conflict check reusing the logic:
    if (body.date || body.mealType || body.tables) {
        const checkDate = new Date(effectiveDate);
        const startOfDay = new Date(checkDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(checkDate);
        endOfDay.setHours(23, 59, 59, 999);
        const checkMealType = body.mealType || originalBooking.mealType;
        
        const existingBookings = await Booking.find({
          _id: { $ne: bookingId },
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          },
          mealType: checkMealType
        });
        
        const bookedTables = existingBookings.flatMap(booking => booking.tables);
        const requestedTables = body.tables || originalBooking.tables;
        
        const conflictingTables = requestedTables.filter((table: any) => 
          bookedTables.includes(table)
        );
        
        if (conflictingTables.length > 0) {
          return NextResponse.json(
            { 
              error: 'Booking conflict', 
              message: `Tables ${conflictingTables.join(', ')} are already booked for ${checkMealType} on this date.` 
            },
            { status: 409 }
          );
        }
    }
    
    // Regular users cannot change apartment number
    if (currentUser.role === 'user') {
      body.apartmentNumber = currentUser.apartmentNumber;
    }
    
    // --- CONCIERGE REST DAYS & CLEANING LOGIC ---
    let noCleaningService = originalBooking.noCleaningService;
    let prepararFuego = body.prepararFuego !== undefined ? Boolean(body.prepararFuego) : originalBooking.prepararFuego;

    // Analyze effective date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(effectiveDate);
    compareDate.setHours(0, 0, 0, 0);
    
    // 1. Concierge Rest Days (Tuesday=2, Wednesday=3)
    const dayOfWeek = compareDate.getDay();
    const isConciergeRestDay = dayOfWeek === 2 || dayOfWeek === 3;
    
    // 2. Notice period
    const daysDifference = Math.floor((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isShortNotice = daysDifference <= 4;

    // If date changed, recalculate cleaning status entirely
    if (body.date) {
        noCleaningService = isShortNotice || isConciergeRestDay;
    } else {
        // If date didn't change, we still enforce rest day rules on existing date
        if (isConciergeRestDay) {
            noCleaningService = true;
        }
    }

    // Force prepare fire to false if it's a rest day
    if (isConciergeRestDay) {
        prepararFuego = false;
    }
    // --------------------------------------------
    
    // Create a clean update object
    const updateData = {
      apartmentNumber: body.apartmentNumber,
      date: effectiveDate,
      mealType: body.mealType,
      numberOfPeople: body.numberOfPeople || originalBooking.numberOfPeople,
      tables: body.tables || originalBooking.tables,
      prepararFuego: prepararFuego, // Use calculated value
      reservaHorno: body.reservaHorno !== undefined ? Boolean(body.reservaHorno) : originalBooking.reservaHorno,
      status: body.status || originalBooking.status,
      userId: currentUser.id,
      noCleaningService: noCleaningService // Use calculated value
    };
    
    console.log("Update data:", JSON.stringify(updateData));
    
    // Update booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Activity logging
    const user = await User.findById(currentUser.id).select('name');
    
    let additionalDetails = '';
    
    if (prepararFuego) {
      additionalDetails += ' with fire preparation';
    }
    if (updateData.reservaHorno) {
      additionalDetails += additionalDetails ? ' and' : ' with';
      additionalDetails += ' oven reservation';
    } 
    
    // Add cleaning service detail if it changed or is active
    if (noCleaningService !== originalBooking.noCleaningService || (noCleaningService && body.date)) {
      additionalDetails += additionalDetails ? ' and' : ' with';
      additionalDetails += noCleaningService 
        ? ' notice of no cleaning service' 
        : ' cleaning service available';
    }
    
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : ''})` : '';
    
    await ActivityLog.create({
      action: 'update',
      apartmentNumber: updateData.apartmentNumber,
      userId: currentUser.id,
      details: `${user ? user.name : 'Usuario'}${userRole} ha modificado la reserva de Apto #${updateData.apartmentNumber} para ${updateData.mealType === 'lunch' ? 'comida' : 'cena'} el ${new Date(updateData.date).toLocaleDateString('es-ES')}, mesas ${updateData.tables.join(', ')}${additionalDetails}`,
    });
    
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error(`PUT /api/bookings/${params.id} error:`, error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', JSON.stringify(error.errors));
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
    // Get session directly
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("No valid session found in booking ID DELETE route");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    
    const currentUser = session.user;

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
    
    // Permission check
    if (
      (currentUser.role === 'user' && booking.apartmentNumber !== currentUser.apartmentNumber) 
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
    if (booking.reservaHorno) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de horno';
    }
    
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : ''})` : '';
    
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