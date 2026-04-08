import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    className={cn(
      "flex h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
      className,
    )}
    ref={ref}
    {...props}
  />
));

Input.displayName = "Input";
