// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User'; // Import User model
import { authenticate } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
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
    
    // Get query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const mealTypeParam = url.searchParams.get('mealType');
    const apartmentParam = url.searchParams.get('apartment');
    
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
    
    // Regular users can only see their own bookings
    if (currentUser.role === 'user') {
      query.apartmentNumber = currentUser.apartmentNumber;
    } 
    // If specifically filtering by apartment number
    else if (apartmentParam && !isNaN(parseInt(apartmentParam))) {
      query.apartmentNumber = parseInt(apartmentParam);
    }
    
    // Sort by date, meal type, then apartment number
    const bookings = await Booking.find(query).sort({ date: 1, mealType: 1, apartmentNumber: 1 });
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Error al obtener las reservas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await authenticate(req);
    
    console.log("Authentication result:", JSON.stringify(currentUser));
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log("Current user ID:", currentUser.id);
    
    if (currentUser.role === 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to create bookings" },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body));
    
    // Regular users can only create bookings for their own apartment
    if (
      currentUser.role === 'user' && 
      body.apartmentNumber !== currentUser.apartmentNumber
    ) {
      return NextResponse.json(
        { error: "You can only create bookings for your own apartment" },
        { status: 403 }
      );
    }
    
    // Check for conflicting tables on the same date and meal type
    const bookingDate = new Date(body.date);
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
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
          error: 'Conflicto de reserva', 
          message: `Las mesas ${conflictingTables.join(', ')} ya están reservadas para ${body.mealType === 'lunch' ? 'comida' : 'cena'} en esta fecha.` 
        },
        { status: 409 }
      );
    }
    
    // Ensure userId is a string - the schema might expect a specific format
    const userId = String(currentUser.id);
    console.log("User ID after conversion:", userId);
    
    // Create a new booking document directly with all required fields explicitly set
    const booking = new Booking({
      apartmentNumber: body.apartmentNumber,
      date: new Date(body.date),
      mealType: body.mealType,
      numberOfPeople: body.numberOfPeople || 1,
      tables: body.tables || [],
      prepararFuego: Boolean(body.prepararFuego),
      reservaHorno: Boolean(body.reservaHorno),
      reservaBrasa: Boolean(body.reservaBrasa),
      status: body.status || 'pending',
      userId: userId  // Explicitly setting as string
    });
    
    console.log("Booking before save:", JSON.stringify(booking));
    
    // Save the booking document
    const savedBooking = await booking.save();
    console.log("Booking saved successfully");
    
    // Get username for better activity logging
    const user = await User.findById(currentUser.id).select('name');
    
    // Prepare additional details for activity log
    let additionalDetails = '';
    
    if (body.prepararFuego) {
      additionalDetails += ' con preparación de fuego';
    }
    
    if (body.reservaHorno && body.reservaBrasa) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de horno y brasa';
    } else if (body.reservaHorno) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de horno';
    } else if (body.reservaBrasa) {
      additionalDetails += additionalDetails ? ' y' : ' con';
      additionalDetails += ' reserva de brasa';
    }
    
    // Get the user's role to include in the activity log
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : 'Conserje'})` : '';
    
    // Log activity
    await ActivityLog.create({
      action: 'create',
      apartmentNumber: body.apartmentNumber,
      userId: currentUser.id,
      details: `${user ? user.name : 'Usuario'}${userRole} ha reservado para Apto. #${body.apartmentNumber} las mesas ${body.tables.join(', ')} para ${body.mealType === 'lunch' ? 'comida' : 'cena'} el ${new Date(body.date).toLocaleDateString('es-ES')}${additionalDetails}`,
    });
    
    return NextResponse.json(savedBooking, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/bookings detailed error:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', JSON.stringify(error.errors));
      return NextResponse.json(
        { error: 'Error de Validación', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al crear la reserva' },
      { status: 500 }
    );
  }
}