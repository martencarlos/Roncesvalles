// src/app/(protected)/admin/feedback/loading.tsx
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedbackLoading() {
  return (
    <PageContainer>
      <PageHeader title="Gestión de Feedback" />
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
