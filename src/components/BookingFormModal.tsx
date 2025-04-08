// src/components/BookingFormModal.tsx
import React, { useEffect, useRef } from 'react';
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
  // Create a ref for the dialog content
  const dialogRef = useRef<HTMLDivElement>(null);

  // This effect will run after the dialog is opened
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      // Create a div element that can receive focus but does nothing
      const focusTrap = document.createElement('div');
      focusTrap.tabIndex = -1; // Making it not focusable via tab navigation
      focusTrap.style.outline = 'none'; // Remove outline when focused
      
      // Append it as the first child
      if (dialogRef.current.firstChild) {
        dialogRef.current.insertBefore(focusTrap, dialogRef.current.firstChild);
      } else {
        dialogRef.current.appendChild(focusTrap);
      }
      
      // Focus on this element instead of any input
      focusTrap.focus();
      
      // Cleanup function to remove the element when dialog closes
      return () => {
        if (dialogRef.current?.contains(focusTrap)) {
          dialogRef.current.removeChild(focusTrap);
        }
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        ref={dialogRef}
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] p-3 sm:p-6"
        // Add this prop to prevent focus trap behavior
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
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