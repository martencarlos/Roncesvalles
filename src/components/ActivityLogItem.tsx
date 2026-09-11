// src/components/ActivityLogItem.tsx
import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { IActivityLog } from '@/models/ActivityLog';
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { Check, RefreshCw, Trash2, CheckCircle, UserPlus, UserCog, UserX } from "lucide-react";

interface ActivityLogItemProps {
  log: IActivityLog;
}

type ActionMeta = {
  label: string;
  tone: StatusTone;
  icon: React.ComponentType<{ className?: string }>;
};

const ACTION_META: Record<string, ActionMeta> = {
  create: { label: 'RESERVA', tone: 'success', icon: Check },
  update: { label: 'MODIF.', tone: 'info', icon: RefreshCw },
  delete: { label: 'CANCELACIÓN', tone: 'danger', icon: Trash2 },
  confirm: { label: 'CONFIRMACIÓN', tone: 'success', icon: CheckCircle },
  user_create: { label: 'NUEVO USUARIO', tone: 'success', icon: UserPlus },
  user_update: { label: 'MODIF. USUARIO', tone: 'info', icon: UserCog },
  user_delete: { label: 'ELIM. USUARIO', tone: 'danger', icon: UserX },
};

const ActivityLogItem: React.FC<ActivityLogItemProps> = ({ log }) => {
  const meta = ACTION_META[log.action];
  const Icon = meta?.icon;
  const timestamp = new Date(log.timestamp);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5">
      <StatusBadge tone={meta?.tone ?? 'neutral'} className="shrink-0">
        {Icon ? <Icon /> : null}
        {meta?.label ?? log.action.toUpperCase()}
      </StatusBadge>

      <p className="order-last w-full min-w-0 break-words text-sm text-muted-foreground sm:order-none sm:w-auto sm:flex-1">
        {log.details}
      </p>

      <time
        dateTime={timestamp.toISOString()}
        title={format(timestamp, 'd MMM, yyyy - HH:mm', { locale: es })}
        className="ml-auto shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:ml-0"
      >
        {formatDistanceToNow(timestamp, { addSuffix: true, locale: es })}
      </time>
    </div>
  );
};

export default ActivityLogItem;
