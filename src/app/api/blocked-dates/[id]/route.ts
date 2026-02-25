export const dynamic = "force-dynamic";
// src/app/api/blocked-dates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import BlockedDate from "@/models/BlockedDate";
import ActivityLog from "@/models/ActivityLog";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "it_admin") {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    await connectDB();

    const block = await BlockedDate.findById(params.id);
    if (!block) {
      return NextResponse.json(
        { error: "Bloqueo no encontrado" },
        { status: 404 }
      );
    }

    await BlockedDate.findByIdAndDelete(params.id);

    const mealLabel =
      block.mealType === "lunch"
        ? "comida"
        : block.mealType === "dinner"
        ? "cena"
        : "comida y cena";
    await ActivityLog.create({
      action: "delete",
      userId: session.user.id,
      details: `Admin IT ${session.user.name} eliminó bloqueo de ${mealLabel} el ${new Date(block.date).toLocaleDateString("es-ES")} (${block.reason})`,
    });

    return NextResponse.json({ message: "Bloqueo eliminado correctamente" });
  } catch (error) {
    console.error("DELETE /api/blocked-dates/[id] error:", error);
    return NextResponse.json(
      { error: "Error al eliminar el bloqueo" },
      { status: 500 }
    );
  }
}
