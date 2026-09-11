// src/app/(protected)/activity/loading.tsx
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <PageContainer>
      <PageHeader
        title="Registro de Actividad"
        description="Toda la actividad relacionada con las reservas y gestión de usuarios"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3.5">
              <Skeleton className="h-5 w-28 rounded-md" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
