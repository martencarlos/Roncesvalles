export const dynamic = 'force-dynamic';
// src/app/api/bookings/[id]/confirm/route.ts - updated to use direct session
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User'; // Import User model

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session directly
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("No valid session found in booking confirm route");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    
    const currentUser = session.user;
    console.log("Current user from session:", currentUser.email, "ID:", currentUser.id);

    await connectDB();
    
    const body = await req.json();
    const bookingId = params.id;
    
    // Get the original booking
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Permission check:
    // - Regular users can only confirm their own apartment's bookings
    // - Admins and IT admins can confirm any booking
    if (
      (currentUser.role === 'user' && booking.apartmentNumber !== currentUser.apartmentNumber) 
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to confirm this booking' },
        { status: 403 }
      );
    }
    
    // Check if the booking is already confirmed
    if (booking.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Booking is already confirmed' },
        { status: 400 }
      );
    }
    
    // Check if the booking is cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot confirm a cancelled booking' },
        { status: 400 }
      );
    }
    
    // Create update data with userId explicitly set
    const updateData = {
      status: 'confirmed',
      finalAttendees: body.finalAttendees || booking.numberOfPeople,
      notes: body.notes,
      userId: currentUser.id // Always update with current user ID
    };
    
    console.log("Confirmation update data:", JSON.stringify(updateData));
    
    // Update the booking with confirmation details
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Get username for better activity logging
    const user = await User.findById(currentUser.id).select('name');
    
    // Additional details for activity log
    const serviceDetails = [];
    if (booking.prepararFuego) serviceDetails.push('preparación de fuego');
    if (booking.reservaHorno) serviceDetails.push('horno');
    
    const serviceText = serviceDetails.length > 0 
      ? ` con ${serviceDetails.join(' y ')}` 
      : '';
    
    // Get the user's role to include in the activity log
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : currentUser.role === 'admin' ? 'Admin' : ''})` : '';
    
    // Create activity log entry
    await ActivityLog.create({
      action: 'confirm',
      apartmentNumber: booking.apartmentNumber,
      userId: currentUser.id,
      details: `${user ? user.name : 'Usuario'}${userRole} ha confirmado la reserva de Apto. #${booking.apartmentNumber} para ${booking.mealType === 'lunch' ? 'comida' : 'cena'} del ${new Date(booking.date).toLocaleDateString('es-ES')}, mesas ${booking.tables.join(', ')}${serviceText} con ${body.finalAttendees || booking.numberOfPeople} asistentes finales`,
    });
    
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error(`POST /api/bookings/${params.id}/confirm error:`, error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', JSON.stringify(error.errors));
      return NextResponse.json(
        { error: 'Error de Validación', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al confirmar la reserva' },
      { status: 500 }
    );
  }
}