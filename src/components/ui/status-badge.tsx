import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "info"
  | "danger";

const toneVariant: Record<
  StatusTone,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  neutral: "muted",
  success: "success",
  warning: "warning",
  info: "info",
  danger: "destructive",
};

export function StatusBadge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<typeof Badge> & { tone?: StatusTone }) {
  return (
    <Badge
      variant={toneVariant[tone]}
      className={cn("font-medium", className)}
      {...props}
    />
  );
}
