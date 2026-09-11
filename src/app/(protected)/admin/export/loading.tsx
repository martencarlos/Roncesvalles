// src/app/(protected)/admin/export/loading.tsx
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExportLoading() {
  return (
    <PageContainer>
      <PageHeader title="Exportar Datos" />
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-40" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </PageContainer>
  );
}
