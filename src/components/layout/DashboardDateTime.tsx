"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardDateTimeProps = {
  className?: string;
  /** Update interval in ms (default 1000) */
  tickMs?: number;
  /** Use on solid primary / dark headers (e.g. admin bar). */
  appearance?: "default" | "onPrimary";
};

/**
 * Live date & time in India Standard Time (Asia/Kolkata) for dashboard headers.
 */
export function DashboardDateTime({
  className,
  tickMs = 1000,
  appearance = "default",
}: DashboardDateTimeProps) {
  /** null until mount — avoids SSR vs client clock mismatch (hydration error). */
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  const dateStr = now
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now)
    : "—";

  const timeStr = now
    ? new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now)
    : "—";

  const onPrimary = appearance === "onPrimary";

  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs",
        onPrimary
          ? "text-primary-foreground/95 [&_span]:text-primary-foreground/95"
          : "text-muted-foreground",
        className,
      )}
      role="timer"
      aria-live="polite"
      aria-atomic
      aria-busy={!now}
    >
      <Clock className={cn("h-3.5 w-3.5 shrink-0", onPrimary ? "opacity-90" : "opacity-80")} aria-hidden />
      <span className={cn("font-medium", onPrimary ? "text-primary-foreground" : "text-foreground/90")}>
        {dateStr}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums tracking-tight",
          onPrimary ? "text-primary-foreground" : "text-foreground/85",
        )}
      >
        {timeStr}
      </span>
      <span
        className={cn(
          "rounded px-1 py-px text-[10px] font-semibold uppercase",
          onPrimary
            ? "bg-primary-foreground/15 text-primary-foreground"
            : "bg-muted/80 text-muted-foreground",
        )}
      >
        IST
      </span>
    </div>
  );
}
