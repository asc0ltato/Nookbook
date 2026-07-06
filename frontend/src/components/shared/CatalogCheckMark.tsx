"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CatalogCheckMark({
  checked,
  className,
  size = "md",
}: {
  checked: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const box =
    size === "sm"
      ? "h-5 w-5 min-h-5 min-w-5 rounded-[5px] border-[2.5px]"
      : "h-6 w-6 min-h-6 min-w-6 rounded-md border-[3px]";
  const icon = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border-yellow-400 bg-yellow-300 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.85)]",
        box,
        className
      )}
      aria-hidden
    >
      {checked ? <Check className={cn(icon, "text-black stroke-[3]")} strokeWidth={3} /> : null}
    </span>
  );
}
