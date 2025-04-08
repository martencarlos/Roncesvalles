// src/components/ui/loading.tsx
import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = 'md',
  message = 'Cargando...',
  submessage,
  fullScreen = false,
}: LoadingProps) {
  // Size map
  const sizeMap = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-3',
    lg: 'h-16 w-16 border-4',
  };
  
  const spinner = (
    <div 
      className={`animate-spin rounded-full border-primary border-t-transparent ${sizeMap[size]}`}
      aria-hidden="true"
    ></div>
  );
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        {spinner}
        {message && <p className="text-lg font-medium text-foreground mt-4">{message}</p>}
        {submessage && <p className="text-sm text-muted-foreground mt-1">{submessage}</p>}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center p-8">
      {spinner}
      {message && <p className="text-base font-medium text-foreground mt-4">{message}</p>}
      {submessage && <p className="text-sm text-muted-foreground mt-1">{submessage}</p>}
    </div>
  );
}