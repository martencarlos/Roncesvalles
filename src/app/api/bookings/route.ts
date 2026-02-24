export const dynamic = 'force-dynamic';
// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';
import User from '@/models/User';
import { sendPushToConserje } from '@/lib/push-service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    
    const currentUser = session.user;
    
    await connectDB();
    
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const mealTypeParam = url.searchParams.get('mealType');
    const apartmentParam = url.searchParams.get('apartment');
    const availabilityCheck = url.searchParams.get('availabilityCheck');
    const forCalendar = url.searchParams.get('forCalendar');
    
    let query: any = {};
    
    // Robust Date Range Query
    if (dateParam) {
      const targetDate = new Date(dateParam);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    if (mealTypeParam && (mealTypeParam === 'lunch' || mealTypeParam === 'dinner')) {
      query.mealType = mealTypeParam;
    }
    
    // Permissions & Filters
    if (forCalendar === 'true' || (dateParam && mealTypeParam && availabilityCheck === 'true')) {
      // Return all bookings for availability checks/calendar
    } else if (dateParam && mealTypeParam) {
      // Return all bookings for specific date view
    } else {
      // Default: filter by user unless param provided (for admins)
      if (currentUser.role === 'user') {
        query.apartmentNumber = currentUser.apartmentNumber;
      } else if (apartmentParam && !isNaN(parseInt(apartmentParam))) {
        query.apartmentNumber = parseInt(apartmentParam);
      }
    }
    
    const bookings = await Booking.find(query).sort({ date: 1, mealType: 1, apartmentNumber: 1 });
    
    // SECURITY FILTER: Hide internalNotes for regular users
    if (currentUser.role === 'user') {
      const sanitizedBookings = bookings.map((b: any) => {
        const bookingObj = b.toObject();
        delete bookingObj.internalNotes; // Remove internal notes
        return bookingObj;
      });
      return NextResponse.json(sanitizedBookings);
    }

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
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const currentUser = session.user;
    
    if (currentUser.role === 'admin' || currentUser.role === 'conserje') {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }
    
    await connectDB();
    const body = await req.json();
    
    if (currentUser.role === 'user' && body.apartmentNumber !== currentUser.apartmentNumber) {
      return NextResponse.json({ error: "Only your own apt" }, { status: 403 });
    }
    
    // Date Setup
    const bookingDate = new Date(body.date);
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Fetch Existing Bookings for conflict check
    const existingBookings = await Booking.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      mealType: body.mealType
    });
    
    // 1. Table Conflict Check
    const bookedTables = existingBookings.flatMap((booking: any) => booking.tables);
    const requestedTables = body.tables;
    const conflictingTables = requestedTables.filter((table: any) => bookedTables.includes(table));
    
    if (conflictingTables.length > 0) {
      return NextResponse.json(
        { 
          error: 'Conflicto de reserva', 
          message: `Las mesas ${conflictingTables.join(', ')} ya están reservadas.` 
        },
        { status: 409 }
      );
    }

    // 2. Oven Conflict Check (Checking against existing bookings)
    // Note: We'll re-check if oven is allowed based on day-of-week below
    if (body.reservaHorno) {
      const ovenAlreadyBooked = existingBookings.some((booking: any) => booking.reservaHorno);
      if (ovenAlreadyBooked) {
        return NextResponse.json(
          { 
            error: 'Conflicto de recursos', 
            message: 'El horno ya está reservado para este turno por otro usuario.' 
          },
          { status: 409 }
        );
      }
    }

    // --- CONCIERGE & CLEANING LOGIC ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(bookingDate);
    compareDate.setHours(0, 0, 0, 0);
    
    // A. Notice Period (< 5 days)
    const daysDifference = Math.floor((compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isShortNotice = daysDifference <= 4;

    // B. Concierge Rest Days (Tuesday=2, Wednesday=3)
    const dayOfWeek = compareDate.getDay();
    const isConciergeRestDay = dayOfWeek === 2 || dayOfWeek === 3;

    // C. Determine Flags
    // No cleaning (No Concierge) if short notice OR rest day OR manually set
    const noCleaningService = isShortNotice || isConciergeRestDay || Boolean(body.noCleaningService);
    
    // Fire preparation: Disabled if Short Notice OR Rest Days (User must do it / No Concierge)
    const prepararFuego = (isConciergeRestDay || isShortNotice) ? false : Boolean(body.prepararFuego);
    
    // Oven allowed even on rest days/short notice (unless conflict above caught it)
    const reservaHorno = Boolean(body.reservaHorno);
    
    // -------------------------------------
    
    const bookingData = {
      apartmentNumber: body.apartmentNumber,
      date: bookingDate,
      mealType: body.mealType,
      numberOfPeople: body.numberOfPeople || 1,
      tables: body.tables || [],
      prepararFuego: prepararFuego,
      reservaHorno: reservaHorno,
      status: body.status || 'pending',
      userId: currentUser.id, 
      noCleaningService: noCleaningService,
      // Internal notes are not set during user creation
    };
    
    const newBooking = await Booking.create(bookingData);
    
    // Activity Logging
    const user = await User.findById(currentUser.id).select('name');
    let additionalDetails = '';
    if (prepararFuego) additionalDetails += ' con preparación de fuego';
    if (reservaHorno) additionalDetails += ' y reserva de horno';
    if (noCleaningService) {
        additionalDetails += additionalDetails ? ' y' : ' con';
        if (isConciergeRestDay) {
          additionalDetails += ' aviso de sin conserje (descanso)';
        } else if (isShortNotice) {
          additionalDetails += ' aviso de sin conserje (antelación)';
        }
    }
    
    const userRole = currentUser.role !== 'user' ? ` (${currentUser.role === 'it_admin' ? 'Admin IT' : ''})` : '';
    await ActivityLog.create({
      action: 'create',
      apartmentNumber: body.apartmentNumber,
      userId: currentUser.id,
      details: `${user ? user.name : 'Usuario'}${userRole} ha reservado para Apto. #${body.apartmentNumber} las mesas ${body.tables.join(', ')} para ${body.mealType === 'lunch' ? 'comida' : 'cena'} el ${new Date(body.date).toLocaleDateString('es-ES')}${additionalDetails}`,
    });

    // Notify conserje via push when a booking requires concierge service
    if (!noCleaningService) {
      const fechaStr = new Date(body.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      const mealLabel = body.mealType === 'lunch' ? 'comida' : 'cena';
      const fuegoLabel = prepararFuego ? ' · con fuego' : '';
      sendPushToConserje({
        title: '🔔 Nueva reserva con conserjería',
        body: `Apto #${body.apartmentNumber} · ${mealLabel} · ${fechaStr}${fuegoLabel}`,
        tag: `concierge-service-${Date.now()}`,
      }).catch(console.error);
    }

    return NextResponse.json(newBooking, { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validación', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 });
  }
}