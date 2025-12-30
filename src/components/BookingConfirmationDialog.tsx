// src/components/BookingConfirmationDialog.tsx
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { IBooking } from "@/models/Booking";
import { getApartmentLabel } from "@/lib/utils";

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: IBooking | null;
  onConfirm: (
    bookingId: string,
    data: { finalAttendees: number; notes: string }
  ) => Promise<void>;
}

const MAX_PEOPLE_PER_TABLE = 8;

const BookingConfirmationDialog: React.FC<BookingConfirmationDialogProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
}) => {
  const [finalAttendees, setFinalAttendees] = useState<number>(
    booking?.numberOfPeople || 0
  );
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const maxPeopleAllowed = booking
    ? booking.tables.length * MAX_PEOPLE_PER_TABLE
    : 0;

  useEffect(() => {
    if (booking) {
      setFinalAttendees(booking.numberOfPeople);
      setNotes(booking.notes || "");
      setError("");
    }
  }, [booking]);

  const handleFinalAttendeesChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value);

    if (isNaN(value) || value < 0) {
      setFinalAttendees(0);
      return;
    }

    if (booking && value > maxPeopleAllowed) {
      setFinalAttendees(maxPeopleAllowed);
      setError(
        `El número máximo de asistentes permitidos para ${booking.tables.length} mesa(s) es ${maxPeopleAllowed}`
      );
    } else {
      setFinalAttendees(value);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!booking?._id) return;

    setError("");

    if (finalAttendees > maxPeopleAllowed) {
      setError(
        `El número máximo de asistentes permitidos para ${booking.tables.length} mesa(s) es ${maxPeopleAllowed}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(booking._id, {
        finalAttendees,
        notes,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al confirmar la reserva");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[500px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Confirmar Reserva</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <div className="text-sm font-medium">Apartamento</div>
                <div className="text-lg">
                  {getApartmentLabel(booking.apartmentNumber)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Fecha</div>
                <div className="text-lg">
                  {format(new Date(booking.date), "d MMM, yyyy", {
                    locale: es,
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Servicio</div>
                <div className="text-lg">
                  {booking.mealType === "lunch" ? "Comida" : "Cena"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Mesas</div>
                <div className="text-lg">
                  {booking.tables.map((t) => `#${t}`).join(", ")}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="finalAttendees">
                  Número final de asistentes
                </Label>
                <Input
                  id="finalAttendees"
                  type="number"
                  min="0"
                  max={maxPeopleAllowed}
                  value={finalAttendees}
                  onChange={handleFinalAttendeesChange}
                  required
                />
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <InfoIcon className="h-3 w-3" />
                  <span>
                    Máximo: {maxPeopleAllowed} personas ({MAX_PEOPLE_PER_TABLE}{" "}
                    por mesa)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ingrese cualquier nota o comentario sobre la reserva"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              className="cursor-pointer"
              type="button"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Confirmando..." : "Confirmar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingConfirmationDialog;
