import type * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variant === "default" && "bg-secondary text-secondary-foreground",
        variant === "secondary" && "bg-primary/10 text-primary",
        variant === "outline" && "border border-border bg-transparent text-foreground",
        className,
      )}
      {...props}
    />
  );
}
