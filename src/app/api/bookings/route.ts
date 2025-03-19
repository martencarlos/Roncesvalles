// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Obtener parámetros de consulta
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    const mealTypeParam = url.searchParams.get('mealType');
    
    // Construir consulta
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
    
    // Ordenar por fecha, tipo de comida, luego por número de apartamento
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
    await connectDB();
    
    const body = await req.json();
    
    // Verificar si hay mesas conflictivas en la misma fecha y tipo de comida
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
    
    // Verificar conflictos de mesa
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
    
    // Crear nueva reserva
    const newBooking = await Booking.create(body);
    
    // Preparar detalles adicionales para el registro de actividad
    let additionalDetails = '';
    if (body.reservaHorno && body.reservaBrasa) {
      additionalDetails = ' con reserva de horno y brasa';
    } else if (body.reservaHorno) {
      additionalDetails = ' con reserva de horno';
    } else if (body.reservaBrasa) {
      additionalDetails = ' con reserva de brasa';
    }
    
    // Registrar actividad
    await ActivityLog.create({
      action: 'create',
      apartmentNumber: body.apartmentNumber,
      details: `Apto. #${body.apartmentNumber} ha reservado las mesas ${body.tables.join(', ')} para ${body.mealType === 'lunch' ? 'comida' : 'cena'} el ${new Date(body.date).toLocaleDateString('es-ES')}${additionalDetails}`,
    });
    
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/bookings error:', error);
    
    if (error.name === 'ValidationError') {
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