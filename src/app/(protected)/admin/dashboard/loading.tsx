// src/app/(protected)/admin/dashboard/loading.tsx
import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-full px-3 py-2 sm:max-w-6xl sm:px-4 sm:py-3 min-h-[100dvh]">
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent mb-3 sm:h-12 sm:w-12 sm:mb-4"></div>
        <p className="text-base sm:text-lg font-medium text-center">Cargando panel de estadísticas...</p>
        <p className="text-xs text-muted-foreground mt-2 text-center opacity-75">Este proceso puede tardar unos segundos</p>
      </div>
    </div>
  );
}