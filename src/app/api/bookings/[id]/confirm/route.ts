// src/app/api/bookings/[id]/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
    
    // Update the booking with confirmation details
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        status: 'confirmed',
        finalAttendees: body.finalAttendees || booking.numberOfPeople,
        notes: body.notes
      },
      { new: true, runValidators: true }
    );
    
    // Additional details for activity log
    const serviceDetails = [];
    if (booking.prepararFuego) serviceDetails.push('preparación de fuego');
    if (booking.reservaHorno) serviceDetails.push('horno');
    if (booking.reservaBrasa) serviceDetails.push('brasa');
    
    const serviceText = serviceDetails.length > 0 
      ? ` con ${serviceDetails.join(' y ')}` 
      : '';
    
    // Create activity log entry
    await ActivityLog.create({
      action: 'confirm',
      apartmentNumber: booking.apartmentNumber,
      details: `Apto. #${booking.apartmentNumber} ha confirmado la reserva para ${booking.mealType === 'lunch' ? 'comida' : 'cena'} del ${new Date(booking.date).toLocaleDateString('es-ES')}, mesas ${booking.tables.join(', ')}${serviceText} con ${body.finalAttendees || booking.numberOfPeople} asistentes finales`,
    });
    
    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error(`POST /api/bookings/${params.id}/confirm error:`, error);
    
    if (error.name === 'ValidationError') {
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