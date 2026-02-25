export const dynamic = "force-dynamic";
// src/app/api/blocked-dates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import BlockedDate from "@/models/BlockedDate";
import ActivityLog from "@/models/ActivityLog";
import { sendPushToConserje } from "@/lib/push-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    let query: any = {};

    if (dateParam) {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const blocks = await BlockedDate.find(query).sort({ date: 1 });
    return NextResponse.json(blocks);
  } catch (error) {
    console.error("GET /api/blocked-dates error:", error);
    return NextResponse.json(
      { error: "Error al obtener los bloqueos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "it_admin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { date, mealType, reason, prepararFuego } = body;

    if (!date || !mealType || !reason) {
      return NextResponse.json(
        { error: "Fecha, tipo de servicio y motivo son obligatorios" },
        { status: 400 }
      );
    }

    const blockDate = new Date(date);
    const startOfDay = new Date(blockDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(blockDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Conflict check: overlapping blocks for the same date+mealType
    const conflictQuery: any = {
      date: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { mealType: "both" },
        { mealType: mealType },
        ...(mealType === "both"
          ? [{ mealType: "lunch" }, { mealType: "dinner" }]
          : []),
      ],
    };

    const existingBlock = await BlockedDate.findOne(conflictQuery);

    if (existingBlock) {
      const existingMealLabel =
        existingBlock.mealType === "lunch"
          ? "comida"
          : existingBlock.mealType === "dinner"
          ? "cena"
          : "comida y cena";
      return NextResponse.json(
        {
          error: "Bloqueo duplicado",
          message: `Ya existe un bloqueo para ${existingMealLabel} en esta fecha (${existingBlock.reason}).`,
        },
        { status: 409 }
      );
    }

    const newBlock = await BlockedDate.create({
      date: startOfDay,
      mealType,
      reason,
      prepararFuego: Boolean(prepararFuego),
      createdBy: session.user.id,
    });

    // Activity log
    const mealLabel =
      mealType === "lunch"
        ? "comida"
        : mealType === "dinner"
        ? "cena"
        : "comida y cena";
    const fuegoDetail = prepararFuego ? " con preparación de fuego" : "";
    await ActivityLog.create({
      action: "create",
      userId: session.user.id,
      details: `Admin IT ${session.user.name} creó bloqueo de ${mealLabel} el ${blockDate.toLocaleDateString("es-ES")} por: ${reason}${fuegoDetail}`,
    });

    // Notify concierge via push when fire preparation is requested
    if (prepararFuego) {
      const fechaStr = blockDate.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
      sendPushToConserje({
        title: `🔔 Reserva para ${reason}`,
        body: `${fechaStr} · ${mealLabel} · con preparación de fuego`,
        tag: `blocked-date-${Date.now()}`,
      }).catch(console.error);
    }

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/blocked-dates error:", error);
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validación", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Error al crear el bloqueo" },
      { status: 500 }
    );
  }
}
