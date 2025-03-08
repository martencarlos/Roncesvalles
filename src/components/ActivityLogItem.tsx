// src/components/ActivityLogItem.tsx
import React from 'react';
import { format } from 'date-fns';
import { IActivityLog } from '@/models/ActivityLog';
import { Check, RefreshCw, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ActivityLogItemProps {
  log: IActivityLog;
}

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ log }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'update':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
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
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="py-3">
      <div className="flex justify-between items-start">
        <div className="flex gap-2 items-start">
          {getActionIcon(log.action)}
          <div>
            <span className={`font-medium ${getActionColor(log.action)}`}>
              {log.action.toUpperCase()}
            </span>{' '}
            <span className="text-sm">{log.details}</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {format(new Date(log.timestamp), 'MMM d, yyyy - HH:mm')}
        </div>
      </div>
      <Separator className="mt-3" />
    </div>
  );
};

export default ActivityLogItem;