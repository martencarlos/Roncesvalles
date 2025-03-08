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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Booking' : 'New Booking'}</DialogTitle>
        </DialogHeader>
        <BookingForm
          onSubmit={async (data) => {
            await onSubmit(data);
            onClose();
          }}
          onCancel={onClose}
          initialData={initialData}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BookingFormModal;