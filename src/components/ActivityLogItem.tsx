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
        return 'RESERVA';
      case 'update':
        return 'MODIF.';
      case 'delete':
        return 'CANCELACIÓN';
      case 'confirm':
        return 'CONFIRMACIÓN';
      default:
        return action.toUpperCase();
    }
  };

  // Complete Spanish translation of all text in details
  const translateDetails = (details: string) => {
    return details
      // Base translations
      .replace(/booked tables/g, 'ha reservado las mesas')
      .replace(/for lunch on/g, 'para comida el')
      .replace(/for dinner on/g, 'para cena el')
      // Fix "modified booking" translation
      .replace(/modified booking/g, 'ha modificado la reserva')
      .replace(/modified booking for lunch on/g, 'ha modificado la reserva para comida el')
      .replace(/modified booking for dinner on/g, 'ha modificado la reserva para cena el')
      .replace(/cancelled booking for lunch on/g, 'ha cancelado la reserva para comida el')
      .replace(/cancelled booking for dinner on/g, 'ha cancelado la reserva para cena el')
      .replace(/confirmed booking for lunch on/g, 'ha confirmado la reserva para comida el')
      .replace(/confirmed booking for dinner on/g, 'ha confirmado la reserva para cena el')
      // Table references
      .replace(/tables/g, 'mesas')
      .replace(/table/g, 'mesa')
      // Apartment references
      // .replace(/Apt #/g, 'Apto. #')
      .replace(/Apto/g, 'Apt')
      // Services
      .replace(/with fire preparation/g, 'con preparación de fuego')
      .replace(/with oven reservation/g, 'con reserva de horno')
      .replace(/with grill reservation/g, 'con reserva de brasa')
      .replace(/with oven and grill reservation/g, 'con reserva de horno y brasa')
      .replace(/with final attendees/g, 'con asistentes finales')
      // Additional translations to catch English terms
      .replace(/lunch/g, 'comida')
      .replace(/dinner/g, 'cena');
  };

  return (
    <div className="w-full">
      {/* Desktop layout - hidden on mobile */}
      <div className="hidden sm:grid py-4 w-full grid-cols-[auto_100px_1fr_auto] gap-3 items-start">
        {/* Icon column */}
        <div className={`p-2 rounded-full self-center bg-opacity-10 ${getActionColor(log.action).replace('text-', 'bg-')}`}>
          {getActionIcon(log.action)}
        </div>
        
        {/* Action text column - fixed width */}
        <div className="self-center">
          <span className={`font-medium ${getActionColor(log.action)} whitespace-nowrap text-sm`}>
            {getActionText(log.action)}
          </span>
        </div>
        
        {/* Details column */}
        <div className="min-w-0 self-center">
          <p className="text-sm line-clamp-2 break-words">
            {translateDetails(log.details)}
          </p>
        </div>
        
        {/* Date column */}
        <div className="text-xs text-muted-foreground whitespace-nowrap self-center">
          {format(new Date(log.timestamp), 'd MMM, yyyy - HH:mm', { locale: es })}
        </div>
      </div>
      
      {/* Mobile layout - shown only on mobile */}
      <div className="sm:hidden py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full bg-opacity-10 ${getActionColor(log.action).replace('text-', 'bg-')}`}>
              {getActionIcon(log.action)}
            </div>
            <span className={`font-medium ${getActionColor(log.action)} text-sm`}>
              {getActionText(log.action)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(log.timestamp), 'd MMM, yyyy - HH:mm', { locale: es })}
          </div>
        </div>
        <p className="text-sm ml-10 mb-1">
          {translateDetails(log.details)}
        </p>
      </div>
      
      <Separator className="w-full" />
    </div>
  );
};

export default ActivityLogItem;