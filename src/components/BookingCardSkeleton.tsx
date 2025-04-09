// src/components/BookingCardSkeleton.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function BookingCardSkeleton() {
  return (
    <Card className="overflow-hidden group animate-pulse">
      <CardHeader className="pb-2 px-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-28"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </CardHeader>
      <CardContent className="pb-2 px-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="h-4 bg-gray-200 rounded w-20"></span>
          <span className="h-6 bg-gray-200 rounded w-16"></span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="h-4 w-4 bg-gray-200 rounded-full"></span>
            <span className="h-4 bg-gray-200 rounded w-16"></span>
          </div>
          <span className="h-4 bg-gray-200 rounded w-4"></span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="h-4 w-4 bg-gray-200 rounded-full"></span>
            <span className="h-4 bg-gray-200 rounded w-16"></span>
          </div>
          <span className="h-4 bg-gray-200 rounded w-16"></span>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <span className="h-4 bg-gray-200 rounded w-16"></span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            <span className="h-6 bg-gray-200 rounded w-16"></span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <span className="h-4 bg-gray-200 rounded w-16"></span>
          </div>
          <div>
            <span className="h-6 bg-gray-200 rounded w-24"></span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-end gap-2 px-4">
        <div className="flex gap-2 w-full">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
        </div>
      </CardFooter>
    </Card>
  );
}

// src/components/BookingListItemSkeleton.tsx
export function BookingListItemSkeleton() {
  return (
    <div className="p-3 sm:p-4 rounded-md border animate-pulse">
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Header with apartment number and status */}
        <div className="flex justify-between items-start">
          <div>
            <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Booking details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-4"></div>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="flex gap-1 flex-wrap">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        </div>

        {/* Mobile Action buttons */}
        <div className="flex gap-2 justify-end mt-1 pt-3 border-t">
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
          <div className="h-8 bg-gray-200 rounded flex-1"></div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-8">
          {/* Apartment and status */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-32 mt-1"></div>
          </div>

          {/* People and tables */}
          <div className="flex flex-row gap-6">
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>

          {/* Services */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
            <div className="flex gap-1">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>

        {/* Desktop Action buttons */}
        <div className="flex gap-2 justify-end">
          <div className="h-7 bg-gray-200 rounded w-24"></div>
          <div className="h-7 bg-gray-200 rounded w-20"></div>
          <div className="h-7 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

// src/components/BookingsDateSkeleton.tsx
export function BookingsDateSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-3 bg-gray-100 p-2 rounded animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
    </div>
  );
}

// src/components/BookingsListSkeleton.tsx
export function BookingsListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-3 bg-gray-100 p-2 rounded animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
      
      <div className="flex flex-col gap-3">
        <BookingListItemSkeleton />
        <BookingListItemSkeleton />
        <BookingListItemSkeleton />
      </div>
    </div>
  );
}