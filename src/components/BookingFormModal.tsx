// src/components/BookingFormModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BookingForm from './BookingForm';
import { IBooking } from '@/models/Booking';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IBooking>) => Promise<void>;
  initialData?: Partial<IBooking>;
  isEditing: boolean;
}

const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] w-[95vw] p-0 flex flex-col overflow-hidden"
        // Radix handles focus trapping; this just opts out of auto-focusing the first input
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-3 sm:px-6 pt-3 sm:pt-6">
          <DialogTitle>{isEditing ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto min-h-0 px-3 sm:px-6 pb-3 sm:pb-6">
          <BookingForm
            onSubmit={async (data) => {
              await onSubmit(data);
              onClose();
            }}
            onCancel={onClose}
            initialData={initialData}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingFormModal;