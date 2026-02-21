export const dynamic = 'force-dynamic';
// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get the year from query parameters
    const url = new URL(req.url);
    const year = url.searchParams.get('year');
    
    if (!year || isNaN(Number(year))) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }
    
    // Create date range for the specified year
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
    
    // Get all confirmed bookings for the year
    const bookings = await Booking.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'confirmed'
    }).sort({ apartmentNumber: 1, date: 1 });
    
    // Aggregate bookings by apartment
    const apartmentData: Record<number, {
      totalBookings: number;
      totalAttendees: number;
      totalAmount: number;
      bookingDetails: Array<{
        date: string;
        mealType: string;
        attendees: number;
        amount: number;
        tables: number[];
        services: string[];
      }>;
    }> = {};
    
    bookings.forEach(booking => {
      const apartmentNumber = booking.apartmentNumber;
      const attendees = booking.finalAttendees || booking.numberOfPeople;
      
      // --- Billing Logic Update ---
      const bookingDate = new Date(booking.date);
      const month = bookingDate.getMonth(); // 0 = Jan, 11 = Dec
      
      // Off-season: May 1st (Index 4) to November 30th (Index 10) included
      const isOffSeason = month >= 4 && month <= 10;
      
      let amount = 0;
      
      if (isOffSeason) {
        // Rule 1: Off-season is 0€
        amount = 0;
      } else {
        // In-season (Dec - Apr)
        
        // Check days in advance (Booking Date - Created Date)
        const createdDate = new Date(booking.createdAt);
        
        // Normalize dates to reset time part for accurate day diff
        const targetDateNormalized = new Date(bookingDate);
        targetDateNormalized.setHours(0, 0, 0, 0);
        
        const createdDateNormalized = new Date(createdDate);
        createdDateNormalized.setHours(0, 0, 0, 0);
        
        const diffTime = targetDateNormalized.getTime() - createdDateNormalized.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Rule 2: Short notice (< 5 days) in high season -> Flat 30€
        if (diffDays < 5) {
          amount = 30;
        } else {
          // Rule 3: Standard In-season logic
          // 7€ per person, minimum 30€ per booking
          const pricePerPerson = 7;
          const minimumBookingPrice = 30;
          const calculatedPrice = attendees * pricePerPerson;
          
          amount = Math.max(minimumBookingPrice, calculatedPrice);
        }
      }
      // -----------------------------

      const dateStr = bookingDate.toLocaleDateString('es-ES');
      const mealType = booking.mealType === 'lunch' ? 'Comida' : 'Cena';
      
      // Determine which services were used
      const services: string[] = [];
      if (booking.prepararFuego) services.push('Fuego');
      if (booking.reservaHorno) services.push('Horno');
      
      if (!apartmentData[apartmentNumber]) {
        apartmentData[apartmentNumber] = {
          totalBookings: 0,
          totalAttendees: 0,
          totalAmount: 0,
          bookingDetails: []
        };
      }
      
      apartmentData[apartmentNumber].totalBookings += 1;
      apartmentData[apartmentNumber].totalAttendees += attendees;
      apartmentData[apartmentNumber].totalAmount += amount;
      apartmentData[apartmentNumber].bookingDetails.push({
        date: dateStr,
        mealType,
        attendees,
        amount,
        tables: booking.tables,
        services
      });
    });
    
    // Convert to array and sort by apartment number
    const result = Object.entries(apartmentData).map(([apt, data]) => ({
      apartmentNumber: Number(apt),
      ...data
    })).sort((a, b) => a.apartmentNumber - b.apartmentNumber);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}