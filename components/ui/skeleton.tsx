import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Loading placeholder. Used wherever a value is not known yet (e.g. while the
 * live BTC price is still connecting) so the UI never shows a made-up number.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded bg-border/70", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
