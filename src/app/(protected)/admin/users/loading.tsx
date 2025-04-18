// src/app/profile/loading.tsx
import React from 'react';

export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-lg font-medium">Cargando usuarios...</p>
      </div>
    </div>
  );
}