"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { CalendarRange, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
};

function fmtRange(start: string, end: string): string {
  const s = parseISO(start + "T12:00:00");
  const e = parseISO(end + "T12:00:00");
  if (!isValid(s) || !isValid(e)) return `${start} – ${end}`;
  if (start === end) return format(s, "MMM d, yyyy");
  return `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`;
}

export function AdminUpcomingHolidays() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const today = format(new Date(), "yyyy-MM-dd");
        const { data, error } = await supabase
          .from("holiday_schedule")
          .select("id,name,start_date,end_date")
          .gte("end_date", today)
          .order("start_date", { ascending: true })
          .limit(10);

        if (error) throw error;
        if (!cancelled) setRows((data as Row[]) || []);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Loading upcoming holidays…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Upcoming holidays</h3>
          <p className="text-sm text-muted-foreground">
            Next closures that affect the schedule (from your holiday calendar).
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/schedule" className="gap-1">
            Full calendar
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/80">
        {rows.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3",
              i === 0 && "bg-primary/5",
            )}
          >
            <CalendarRange className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{r.name}</p>
              <p className="text-xs text-muted-foreground">{fmtRange(r.start_date, r.end_date)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
