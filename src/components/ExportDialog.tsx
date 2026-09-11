// src/components/ExportDialog.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookingsExportForm from "@/components/BookingsExportForm";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Datos</DialogTitle>
        </DialogHeader>
        <BookingsExportForm
          variant="dialog"
          buttonLabel="Exportar"
          onCancel={onClose}
          onExportSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
