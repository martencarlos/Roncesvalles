// src/app/api/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Booking from "@/models/Booking";
import ActivityLog from "@/models/ActivityLog";
import User from "@/models/User";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUser = session.user;

    await connectDB();
    const booking = await Booking.findById(params.id);
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (
      currentUser.role === "user" &&
      booking.apartmentNumber !== currentUser.apartmentNumber
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Hide internalNotes for regular users
    if (currentUser.role === "user") {
      const bookingObj = booking.toObject();
      delete bookingObj.internalNotes;
      return NextResponse.json(bookingObj);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error(`GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUser = session.user;

    // Regular admin is read-only
    if (currentUser.role === "admin")
      return NextResponse.json({ error: "No permission" }, { status: 403 });

    await connectDB();
    const body = await req.json();
    const bookingId = params.id;

    const originalBooking = await Booking.findById(bookingId);
    if (!originalBooking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // --- SPECIAL LOGIC FOR CONSERJE ---
    if (currentUser.role === "conserje") {
      // Conserje can ONLY update internalNotes
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { internalNotes: body.internalNotes },
        { new: true }
      );

      // Logging for note update
      const user = await User.findById(currentUser.id).select("name");
      await ActivityLog.create({
        action: "update",
        apartmentNumber: originalBooking.apartmentNumber,
        userId: currentUser.id,
        details: `Conserje ${
          user ? user.name : "Usuario"
        } actualizó nota interna en reserva Apto #${
          originalBooking.apartmentNumber
        }`,
      });

      return NextResponse.json(updatedBooking);
    }

    // --- LOGIC FOR IT_ADMIN & USER ---

    if (
      currentUser.role === "user" &&
      originalBooking.apartmentNumber !== currentUser.apartmentNumber
    )
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    if (currentUser.role === "user" && originalBooking.status === "confirmed")
      return NextResponse.json(
        { error: "Cannot modify confirmed" },
        { status: 403 }
      );

    // Determine Effective Values (New or Keep Original)
    const effectiveDate = body.date
      ? new Date(body.date)
      : new Date(originalBooking.date);
    const checkMealType = body.mealType || originalBooking.mealType;
    const requestedTables = body.tables || originalBooking.tables;
    
    // Oven logic: take body value, or original if undefined. 
    // Validation for availability happens in Conflict Check later.
    let wantsOven =
      body.reservaHorno !== undefined
        ? Boolean(body.reservaHorno)
        : originalBooking.reservaHorno;

    // --- CLEANING & CONCIERGE LOGIC ---
    let noCleaningService = originalBooking.noCleaningService;
    let prepararFuego =
      body.prepararFuego !== undefined
        ? Boolean(body.prepararFuego)
        : originalBooking.prepararFuego;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(effectiveDate);
    compareDate.setHours(0, 0, 0, 0);

    const dayOfWeek = compareDate.getDay();
    const isConciergeRestDay = dayOfWeek === 2 || dayOfWeek === 3; // Tue/Wed
    const daysDifference = Math.floor(
      (compareDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const isShortNotice = daysDifference <= 4;

    // Check if the date or meal type actually changed
    const dateHasChanged = body.date && new Date(body.date).getTime() !== new Date(originalBooking.date).getTime();
    const mealTypeHasChanged = body.mealType && body.mealType !== originalBooking.mealType;

    // Recalculate if date OR meal type changed OR enforce strict rules on existing date
    if (dateHasChanged || mealTypeHasChanged) {
      // If date or meal type changed, re-evaluate short notice based on *today*
      noCleaningService = isShortNotice || isConciergeRestDay;
    } else {
      // If date remains the same, PRESERVE original short-notice status
      // (User shouldn't lose cleaning service just because they edited the booking late)
      // However, Concierge Rest Days (Tue/Wed) always override
      if (isConciergeRestDay) {
        noCleaningService = true;
      } else {
        noCleaningService = originalBooking.noCleaningService;
      }
    }

    // Force disable FIRE on rest days OR short notice (if date or meal type changed)
    // If neither changed, fire logic should also respect original timing context unless it's a rest day
    if (isConciergeRestDay) {
      prepararFuego = false;
    } else if ((dateHasChanged || mealTypeHasChanged) && isShortNotice) {
      prepararFuego = false;
    }
    // Note: If date didn't change, we allow 'prepararFuego' to stay true if it was originally allowed
    // ----------------------------------

    // --- CONFLICT CHECKS ---
    // If anything relevant changed, check conflicts
    if (
      body.date ||
      body.mealType ||
      body.tables ||
      body.reservaHorno !== undefined
    ) {
      const checkDate = new Date(effectiveDate);
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find OTHER bookings for this slot
      const existingBookings = await Booking.find({
        _id: { $ne: bookingId },
        date: { $gte: startOfDay, $lte: endOfDay },
        mealType: checkMealType,
      });

      // 1. Table Conflict
      const bookedTables = existingBookings.flatMap(
        (booking: any) => booking.tables
      );
      const conflictingTables = requestedTables.filter((table: any) =>
        bookedTables.includes(table)
      );

      if (conflictingTables.length > 0) {
        return NextResponse.json(
          {
            error: "Booking conflict",
            message: `Tables occupied: ${conflictingTables.join(", ")}`,
          },
          { status: 409 }
        );
      }

      // 2. Oven Conflict (only if allowed/wantsOven)
      if (wantsOven) {
        const ovenTaken = existingBookings.some((b: any) => b.reservaHorno);
        if (ovenTaken) {
          return NextResponse.json(
            {
              error: "Conflict",
              message: "El horno ya está reservado por otro usuario.",
            },
            { status: 409 }
          );
        }
      }
    }

    if (currentUser.role === "user")
      body.apartmentNumber = currentUser.apartmentNumber;

    const updateData: any = {
      apartmentNumber: body.apartmentNumber,
      date: effectiveDate,
      mealType: checkMealType,
      numberOfPeople: body.numberOfPeople || originalBooking.numberOfPeople,
      tables: requestedTables,
      prepararFuego: prepararFuego,
      reservaHorno: wantsOven,
      status: body.status || originalBooking.status,
      userId: currentUser.id,
      noCleaningService: noCleaningService,
    };

    // Allow IT Admin to update internal notes as well
    if (currentUser.role === "it_admin" && body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      updateData,
      { new: true, runValidators: true }
    );

    // Logging
    const user = await User.findById(currentUser.id).select("name");
    let details = "";
    if (prepararFuego) details += " with fire";
    if (updateData.reservaHorno) details += " and oven";

    if (
      noCleaningService !== originalBooking.noCleaningService ||
      (noCleaningService && body.date)
    ) {
      details += noCleaningService ? " (sin conserje)" : " (con conserje)";
    }

    if (
      body.internalNotes &&
      body.internalNotes !== originalBooking.internalNotes
    ) {
      details += " (nota interna actualizada)";
    }

    const userRole =
      currentUser.role !== "user"
        ? ` (${currentUser.role === "it_admin" ? "Admin IT" : ""})`
        : "";
    await ActivityLog.create({
      action: "update",
      apartmentNumber: updateData.apartmentNumber,
      userId: currentUser.id,
      details: `${
        user ? user.name : "Usuario"
      }${userRole} modificó reserva Apto #${
        updateData.apartmentNumber
      }: ${new Date(updateData.date).toLocaleDateString()} ${details}`,
    });

    return NextResponse.json(updatedBooking);
  } catch (error: any) {
    console.error(`PUT error:`, error);
    if (error.name === "ValidationError")
      return NextResponse.json(
        { error: "Validation", details: error.message },
        { status: 400 }
      );
    return NextResponse.json({ error: "Failed update" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const currentUser = session.user;

    if (currentUser.role === "admin" || currentUser.role === "conserje")
      return NextResponse.json({ error: "No permission" }, { status: 403 });

    await connectDB();
    const bookingId = params.id;
    const booking = await Booking.findById(bookingId);

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (
      currentUser.role === "user" &&
      booking.apartmentNumber !== currentUser.apartmentNumber
    ) {
      return NextResponse.json({ error: "No permission" }, { status: 403 });
    }

    if (currentUser.role === "user" && booking.status === "confirmed") {
      return NextResponse.json(
        { error: "Cannot delete confirmed" },
        { status: 403 }
      );
    }

    const user = await User.findById(currentUser.id).select("name");
    const userRole =
      currentUser.role !== "user"
        ? ` (${currentUser.role === "it_admin" ? "Admin IT" : ""})`
        : "";

    let additionalDetails = "";
    if (booking.prepararFuego) additionalDetails += " con preparación de fuego";
    if (booking.reservaHorno)
      additionalDetails += additionalDetails ? " y" : " con";
    additionalDetails += " reserva de horno";

    await Booking.findByIdAndDelete(bookingId);

    await ActivityLog.create({
      action: "delete",
      apartmentNumber: booking.apartmentNumber,
      userId: currentUser.id,
      details: `${
        user ? user.name : "Usuario"
      }${userRole} canceló reserva Apto #${booking.apartmentNumber} para ${
        booking.mealType === "lunch" ? "comida" : "cena"
      } el ${new Date(booking.date).toLocaleDateString(
        "es-ES"
      )} ${additionalDetails}`,
    });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error(`DELETE error:`, error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}