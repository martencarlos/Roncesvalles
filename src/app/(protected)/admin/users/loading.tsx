// src/app/(protected)/admin/users/loading.tsx
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <PageContainer>
      <PageHeader title="Gestión de Usuarios" />
      <div className="mb-6 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-9 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-56" />
            <Skeleton className="mt-4 h-8 w-full" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
