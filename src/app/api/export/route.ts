export const dynamic = 'force-dynamic';
// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import {
  calculateAdministrationCharge,
  getExportRange,
  type ExportScope,
} from "@/lib/export-utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["admin", "conserje", "it_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    await connectDB();
    
    const url = new URL(req.url);
    const year = url.searchParams.get('year');
    const scope = (url.searchParams.get("scope") || "year") as ExportScope;
    const month = url.searchParams.get("month");
    
    if (!year || isNaN(Number(year))) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    if (scope !== "year" && scope !== "month") {
      return NextResponse.json(
        { error: "Invalid scope parameter" },
        { status: 400 }
      );
    }

    let startDate: Date;
    let endDate: Date;
    try {
      ({ startDate, endDate } = getExportRange({
        scope,
        year: Number(year),
        month: month ? Number(month) : undefined,
      }));
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Invalid export range",
        },
        { status: 400 }
      );
    }
    
    const bookings = await Booking.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'completed'
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
        conciergeStatus: string;
        cleaningHours: number | null;
      }>;
    }> = {};
    
    bookings.forEach(booking => {
      const apartmentNumber = booking.apartmentNumber;
      const attendees = booking.numberOfPeople;
      const bookingDate = new Date(booking.date);
      const amount = calculateAdministrationCharge({
        bookingDate,
        numberOfPeople: attendees,
        noCleaningService: booking.noCleaningService,
        cleaningHours:
          typeof booking.cleaningHours === "number" ? booking.cleaningHours : null,
      });

      const dateStr = bookingDate.toLocaleDateString('es-ES');
      const mealType = booking.mealType === 'lunch' ? 'Comida' : 'Cena';
      const conciergeStatus = booking.noCleaningService
        ? "Sin servicio de conserjería"
        : "Con servicio de conserjería";
      const cleaningHours =
        typeof booking.cleaningHours === "number" ? booking.cleaningHours : null;
      
      const services: string[] = [];
      services.push(conciergeStatus);
      if (booking.prepararFuego) services.push('Fuego');
      if (booking.reservaHorno) services.push('Horno');
      if (booking.noCleaningService && cleaningHours && cleaningHours > 0) {
        services.push(`Limpieza acordada (${cleaningHours} h)`);
      }
      
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
        services,
        conciergeStatus,
        cleaningHours,
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
