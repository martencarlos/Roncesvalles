// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import ActivityLog from "@/models/ActivityLog";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    // Get session directly
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.error("No valid session found in bookings GET route");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const currentUser = session.user;

    await connectDB();

    // Get query parameters
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const mealTypeParam = url.searchParams.get("mealType");
    const apartmentParam = url.searchParams.get("apartment");
    const availabilityCheck = url.searchParams.get("availabilityCheck");
    const forCalendar = url.searchParams.get("forCalendar");

    // Build query
    let query: any = {};

    if (dateParam) {
      const date = new Date(dateParam);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query.date = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    if (
      mealTypeParam &&
      (mealTypeParam === "lunch" || mealTypeParam === "dinner")
    ) {
      query.mealType = mealTypeParam;
    }

    // For calendar view or availability checks, return all bookings regardless of user
    if (
      forCalendar === "true" ||
      (dateParam && mealTypeParam && availabilityCheck === "true")
    ) {
      // Do not filter by apartment for calendar view or availability checks
      // We need to see everyone's bookings to know what is taken
    }
    // For other queries (like listing user's bookings with no date), apply permissions
    else {
      // Regular users can only see their own bookings by default
      if (currentUser.role === "user") {
        query.apartmentNumber = currentUser.apartmentNumber;
      }
      // If specifically filtering by apartment number (for admins)
      else if (apartmentParam && !isNaN(parseInt(apartmentParam))) {
        query.apartmentNumber = parseInt(apartmentParam);
      }
    }

    // Sort by date, meal type, then apartment number
    const bookings = await Booking.find(query).sort({
      date: 1,
      mealType: 1,
      apartmentNumber: 1,
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { error: "Error al obtener las reservas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get session directly
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const currentUser = session.user;

    // Read-only admins cannot create
    if (currentUser.role === "admin") {
      return NextResponse.json(
        { error: "You don't have permission to create bookings" },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();

    // Regular users can only create bookings for their own apartment
    if (
      currentUser.role === "user" &&
      body.apartmentNumber !== currentUser.apartmentNumber
    ) {
      return NextResponse.json(
        { error: "You can only create bookings for your own apartment" },
        { status: 403 }
      );
    }

    // Define date range for the selected day
    const bookingDate = new Date(body.date);
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch all existing bookings for this time slot
    const existingBookings = await Booking.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      mealType: body.mealType,
    });

    // 1. Check for Table conflicts
    const bookedTables = existingBookings.flatMap((booking) => booking.tables);
    const requestedTables = body.tables;

    const conflictingTables = requestedTables.filter((table: any) =>
      bookedTables.includes(table)
    );

    if (conflictingTables.length > 0) {
      return NextResponse.json(
        {
          error: "Conflicto de reserva",
          message: `Las mesas ${conflictingTables.join(
            ", "
          )} ya están reservadas.`,
        },
        { status: 409 }
      );
    }

    // 2. Check for Oven conflict
    // If user wants oven, check if anyone else already has it
    if (body.reservaHorno) {
      const ovenAlreadyBooked = existingBookings.some(
        (booking) => booking.reservaHorno
      );
      if (ovenAlreadyBooked) {
        return NextResponse.json(
          {
            error: "Conflicto de recursos",
            message:
              "El horno ya está reservado para este turno por otro usuario.",
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

    // A. Notice period calculation
    const daysDifference = Math.floor(
      (compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isShortNotice = daysDifference <= 4;

    // B. Concierge Rest Days (Tuesday=2, Wednesday=3)
    const dayOfWeek = compareDate.getDay();
    const isConciergeRestDay = dayOfWeek === 2 || dayOfWeek === 3;

    // C. Determine flags
    // Cleaning is disabled on short notice OR rest days OR if manually flagged
    const noCleaningService =
      isShortNotice || isConciergeRestDay || Boolean(body.noCleaningService);

    // Fire prep is IMPOSSIBLE on rest days
    const prepararFuego = isConciergeRestDay
      ? false
      : Boolean(body.prepararFuego);
    // ----------------------------------

    // Create booking object
    const bookingData = {
      apartmentNumber: body.apartmentNumber,
      date: bookingDate,
      mealType: body.mealType,
      numberOfPeople: body.numberOfPeople || 1,
      tables: body.tables || [],
      prepararFuego: prepararFuego,
      reservaHorno: Boolean(body.reservaHorno),
      status: body.status || "pending",
      userId: currentUser.id,
      noCleaningService: noCleaningService,
    };

    // Save to DB
    const newBooking = await Booking.create(bookingData);

    // Prepare logs
    const user = await User.findById(currentUser.id).select("name");
    let additionalDetails = "";

    if (prepararFuego) {
      additionalDetails += " con preparación de fuego";
    }
    if (body.reservaHorno) {
      additionalDetails += additionalDetails ? " y" : " con";
      additionalDetails += " reserva de horno";
    }

    if (noCleaningService) {
      additionalDetails += additionalDetails ? " y" : " con";
      if (isConciergeRestDay) {
        additionalDetails += " aviso de sin limpieza (descanso conserje)";
      } else {
        additionalDetails += " aviso de sin limpieza (antelación)";
      }
    }

    const userRole =
      currentUser.role !== "user"
        ? ` (${currentUser.role === "it_admin" ? "Admin IT" : ""})`
        : "";

    await ActivityLog.create({
      action: "create",
      apartmentNumber: body.apartmentNumber,
      userId: currentUser.id,
      details: `${
        user ? user.name : "Usuario"
      }${userRole} ha reservado para Apto. #${
        body.apartmentNumber
      } las mesas ${body.tables.join(", ")} para ${
        body.mealType === "lunch" ? "comida" : "cena"
      } el ${new Date(body.date).toLocaleDateString(
        "es-ES"
      )}${additionalDetails}`,
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/bookings detailed error:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Error de Validación", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al crear la reserva" },
      { status: 500 }
    );
  }
}
