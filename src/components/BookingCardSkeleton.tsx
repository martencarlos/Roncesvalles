// src/components/BookingCardSkeleton.tsx
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BookingCardSkeleton() {
  return (
    <Card className="group overflow-hidden">
      <CardHeader className="pb-2 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-6" />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>

        <div className="mt-1 flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>

        <div className="mt-1 flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 px-4 pb-4 pt-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
      </CardFooter>
    </Card>
  );
}

// src/components/BookingListItemSkeleton.tsx
export function BookingListItemSkeleton() {
  return (
    <div className="rounded-md border p-3 sm:p-4">
      {/* Mobile layout */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Header with apartment number and status */}
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="mb-1 h-5 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>

        {/* Booking details */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="col-span-2 flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-6 w-16" />
          </div>
        </div>

        {/* Mobile Action buttons */}
        <div className="mt-1 flex justify-end gap-2 border-t pt-3">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden justify-between gap-3 sm:flex sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:gap-8">
          {/* Apartment and status */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="mt-1 h-3 w-32" />
          </div>

          {/* People and tables */}
          <div className="flex flex-row gap-6">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Services */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-1">
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </div>

        {/* Desktop Action buttons */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
    </div>
  );
}

// Mirrors the /bookings list layout so loading does not shift the page:
// mobile always shows list items, desktop shows cards or rows per viewMode.
export function BookingsSkeleton({
  viewMode,
  showHeader,
  cardGrid,
}: {
  viewMode: "card" | "list";
  showHeader?: boolean;
  cardGrid?: boolean;
}) {
  const rows = (
    <>
      <BookingListItemSkeleton />
      <BookingListItemSkeleton />
      <BookingListItemSkeleton />
    </>
  );

  return (
    <div className="space-y-3">
      {showHeader ? (
        <div className="mb-3 flex justify-between items-center rounded bg-muted p-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
      ) : null}

      {/* Mobile: always list items */}
      <div className="flex flex-col gap-3 sm:hidden">{rows}</div>

      {/* Desktop: cards or list, matching the page */}
      <div className="hidden sm:block">
        {viewMode === "card" ? (
          <div
            className={
              cardGrid
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            <BookingCardSkeleton />
            <BookingCardSkeleton />
            <BookingCardSkeleton />
          </div>
        ) : (
          <div className="flex flex-col gap-3">{rows}</div>
        )}
      </div>
    </div>
  );
}
