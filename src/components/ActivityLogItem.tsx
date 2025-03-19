// src/components/ActivityLogItem.tsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IActivityLog } from '@/models/ActivityLog';
import { Check, RefreshCw, Trash2, CheckCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ActivityLogItemProps {
  log: IActivityLog;
}

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ log }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Check className="h-4 w-4 text-green-600 shrink-0" />;
      case 'update':
        return <RefreshCw className="h-4 w-4 text-blue-600 shrink-0" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600 shrink-0" />;
      case 'confirm':
        return <CheckCircle className="h-4 w-4 text-purple-600 shrink-0" />;
      default:
        return null;
    }
  };
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'text-green-600';
      case 'update':
        return 'text-blue-600';
      case 'delete':
        return 'text-red-600';
      case 'confirm':
        return 'text-purple-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'create':
        return 'CREAR';
      case 'update':
        return 'ACTUALIZAR';
      case 'delete':
        return 'ELIMINAR';
      case 'confirm':
        return 'CONFIRMAR';
      default:
        return action.toUpperCase();
    }
  };

  // Traducir texto específico en la descripción
  const translateDetails = (details: string) => {
    return details
      .replace('booked tables', 'ha reservado las mesas')
      .replace('for lunch on', 'para comida el')
      .replace('for dinner on', 'para cena el')
      .replace('modified booking for lunch on', 'ha modificado la reserva para comida el')
      .replace('modified booking for dinner on', 'ha modificado la reserva para cena el')
      .replace('cancelled booking for lunch on', 'ha cancelado la reserva para comida el')
      .replace('cancelled booking for dinner on', 'ha cancelado la reserva para cena el')
      .replace('confirmed booking for lunch on', 'ha confirmado la reserva para comida el')
      .replace('confirmed booking for dinner on', 'ha confirmado la reserva para cena el')
      .replace('tables', 'mesas')
      .replace('Apt', 'Apto.')
      .replace('with oven reservation', 'con reserva de horno')
      .replace('with grill reservation', 'con reserva de brasa')
      .replace('with oven and grill reservation', 'con reserva de horno y brasa')
      .replace('with final attendees', 'con asistentes finales');
  };

  return (
    <div className="py-3">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:items-start">
        <div className="flex gap-2 items-center">
          {getActionIcon(log.action)}
          <div>
            <span className={`font-medium ${getActionColor(log.action)}`}>
              {getActionText(log.action)}
            </span>{' '}
            <span className="text-sm">{translateDetails(log.details)}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 sm:mt-0 ml-6 sm:ml-0">
          {format(new Date(log.timestamp), 'd MMM, yyyy - HH:mm', { locale: es })}
        </div>
      </div>
      <Separator className="mt-3" />
    </div>
  );
};

export default ActivityLogItem;