import * as React from "react";

import { cn } from "@/lib/utils";

export function PageContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1180px] px-4 pb-24 pt-6 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  nowrap,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  nowrap?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-center justify-between gap-3",
        nowrap ? "flex-nowrap" : "flex-wrap",
        className
      )}
    >
      <div className={cn("min-w-0 space-y-0.5", nowrap && "flex-1")}>
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              nowrap && "truncate"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className={cn("flex items-center gap-2", nowrap && "shrink-0")}>
          {actions}
        </div>
      ) : null}
    </div>
  );
}
