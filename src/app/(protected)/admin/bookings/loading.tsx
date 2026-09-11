// src/app/(protected)/admin/bookings/loading.tsx
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsLoading() {
  return (
    <PageContainer>
      <PageHeader title="Gestión de Reservas" />
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-56" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
