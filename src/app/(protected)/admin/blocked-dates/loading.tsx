// src/app/(protected)/admin/blocked-dates/loading.tsx
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlockedDatesLoading() {
  return (
    <PageContainer>
      <PageHeader title="Bloqueos de Fecha" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
