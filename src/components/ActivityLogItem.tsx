// src/components/ActivityLogItem.tsx
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IActivityLog } from '@/models/ActivityLog';
import { Check, RefreshCw, Trash2, CheckCircle, UserPlus, UserCog, UserX } from "lucide-react";
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
      case 'user_create':
        return <UserPlus className="h-4 w-4 text-emerald-600 shrink-0" />;
      case 'user_update':
        return <UserCog className="h-4 w-4 text-indigo-600 shrink-0" />;
      case 'user_delete':
        return <UserX className="h-4 w-4 text-amber-600 shrink-0" />;
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
      case 'user_create':
        return 'text-emerald-600';
      case 'user_update':
        return 'text-indigo-600';
      case 'user_delete':
        return 'text-amber-600';
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
      case 'user_create':
        return 'NUEVO USUARIO';
      case 'user_update':
        return 'MODIF. USUARIO';
      case 'user_delete':
        return 'ELIM. USUARIO';
      default:
        return action.toUpperCase();
    }
  };

  // The details are already in Spanish in the updated API responses
  // So we don't need to translate them here

  return (
    <div className="w-full">
      {/* Desktop layout - hidden on mobile */}
      <div className="hidden sm:grid py-4 w-full grid-cols-[auto_120px_1fr_auto] gap-3 items-start">
        {/* Icon column */}
        <div className={`p-2 rounded-full self-center bg-white ${getActionColor(log.action).replace('text-', 'bg-')}`}>
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
            {log.details}
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
            <div className={`p-2 rounded-full bg-white ${getActionColor(log.action).replace('text-', 'bg-')}`}>
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
          {log.details}
        </p>
      </div>
      
      <Separator className="w-full" />
    </div>
  );
};

export default ActivityLogItem;