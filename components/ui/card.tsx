import * as React from "react";
import { cn } from "@/utils/cn";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
        className
      )}
      {...props}
    />
  )
);

Card.displayName = "Card";

export { Card };
