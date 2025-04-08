// src/components/DeleteConfirmationDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  apartmentNumber: number;
  date: Date;
  mealType: 'lunch' | 'dinner';
  isDeleting?: boolean; // New prop to track deletion state
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  apartmentNumber,
  date,
  mealType,
  isDeleting = false // Default to false
}) => {
  // Format date in a more readable way
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="flex flex-col items-center gap-1">
          <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
          <DialogTitle>Eliminar Reserva</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-center mb-4">
            ¿Está seguro de que desea eliminar la siguiente reserva?
          </p>
          
          <div className="bg-muted p-4 rounded-md text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="font-medium">Apartamento:</div>
              <div>#{apartmentNumber}</div>
              
              <div className="font-medium">Fecha:</div>
              <div>{formatDate(date)}</div>
              
              <div className="font-medium">Servicio:</div>
              <div>{mealType === 'lunch' ? 'Comida' : 'Cena'}</div>
            </div>
          </div>
          
          <p className="text-destructive-foreground text-sm mt-4">
            Esta acción no se puede deshacer.
          </p>
        </div>
        
        <DialogFooter className="gap-3 sm:gap-3">
          <Button 
            variant="outline" 
            className='cursor-pointer' 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className='cursor-pointer'
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar Reserva"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;