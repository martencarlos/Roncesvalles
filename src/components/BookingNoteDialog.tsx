// src/components/BookingNoteDialog.tsx
"use client";

import { useState } from "react";
import { IBooking } from "@/models/Booking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, StickyNote } from "lucide-react";
import { toast } from "sonner";

export default function BookingNoteDialog({
  booking,
  open,
  onOpenChange,
  onSaved,
}: {
  booking: IBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (booking: IBooking) => void | Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Remount when the dialog opens or the target booking changes so the
          fields initialize from that booking. */}
      <BookingNoteForm
        key={`${open}:${booking?._id ?? ""}`}
        booking={booking}
        onSaved={onSaved}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}

function BookingNoteForm({
  booking,
  onSaved,
  onClose,
}: {
  booking: IBooking | null;
  onSaved?: (booking: IBooking) => void | Promise<void>;
  onClose: () => void;
}) {
  const [internalNoteText, setInternalNoteText] = useState(
    booking?.internalNotes || ""
  );
  const [cleaningHoursText, setCleaningHoursText] = useState(
    typeof booking?.cleaningHours === "number"
      ? String(booking.cleaningHours)
      : ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!booking?._id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bookings/${booking._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalNotes: internalNoteText,
          cleaningHours: booking.noCleaningService
            ? cleaningHoursText.trim() === ""
              ? null
              : Number(cleaningHoursText)
            : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al guardar la nota");
      }

      const updatedBooking = await res.json();
      await onSaved?.(updatedBooking);
      toast.success("Nota interna actualizada");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-warning-foreground" />
          Notas Internas (Conserjería)
        </DialogTitle>
        <DialogDescription>
          Estas notas solo son visibles para conserjes y administradores IT.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <Textarea
          value={internalNoteText}
          onChange={(e) => setInternalNoteText(e.target.value)}
          placeholder="Escriba aquí anotaciones..."
          rows={5}
          className="bg-warning/10 border-warning/30"
        />
        {booking?.noCleaningService && (
          <div className="space-y-2">
            <Label htmlFor="cleaningHours">Horas de limpieza</Label>
            <Input
              id="cleaningHours"
              type="number"
              min="0"
              step="0.25"
              value={cleaningHoursText}
              onChange={(e) => setCleaningHoursText(e.target.value)}
              placeholder="Ej. 2.5"
            />
            <p className="text-xs text-muted-foreground">
              Si hubo acuerdo con el usuario, introduzca aquí las horas
              trabajadas para que la exportación aplique la tarifa correcta.
            </p>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            "Guardando..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Guardar Nota
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
