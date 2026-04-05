"use client";

import { useEffect, useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarDays, Bus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TodayStatus = {
  is_holiday: boolean;
  is_weekend: boolean;
  holiday_name: string | null;
  holiday_message: string | null;
};

type HolidayRow = {
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

export type SchoolServiceCalendarVariant = "full" | "todayOnly";

type SchoolServiceCalendarCardProps = {
  /**
   * `todayOnly` — driver/guardian: only today’s status (no “Next on calendar” list).
   * `full` — optional future use (e.g. admin): today + upcoming holidays.
   */
  variant?: SchoolServiceCalendarVariant;
};

export function SchoolServiceCalendarCard({
  variant = "full",
}: SchoolServiceCalendarCardProps) {
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [upcoming, setUpcoming] = useState<HolidayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const statusRes = await supabase.rpc("get_today_holiday_status").maybeSingle();

        if (variant === "full") {
          const { data: holidayRows, error: holidayErr } = await supabase
            .from("holiday_schedule")
            .select("id,name,start_date,end_date")
            .gte("end_date", todayStr)
            .order("start_date", { ascending: true })
            .limit(6);
          if (!cancelled && !holidayErr && holidayRows) {
            setUpcoming(holidayRows as HolidayRow[]);
          } else if (!cancelled) {
            setUpcoming([]);
          }
        } else {
          setUpcoming([]);
        }

        if (!cancelled) {
          if (statusRes.data && !statusRes.error) {
            const d = statusRes.data as Record<string, unknown>;
            setToday({
              is_holiday: Boolean(d.is_holiday),
              is_weekend: Boolean(d.is_weekend),
              holiday_name: (d.holiday_name as string) || null,
              holiday_message: (d.holiday_message as string) || null,
            });
          }
        }
      } catch {
        if (!cancelled) {
          setToday(null);
          setUpcoming([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (loading) {
    return (
      <Card className="rounded-2xl border-border/60 border-dashed bg-muted/20 shadow-sm">
        <CardContent className="py-4 text-sm text-muted-foreground">Loading school calendar…</CardContent>
      </Card>
    );
  }

  const noService =
    today &&
    (today.is_holiday || today.is_weekend) &&
    Boolean(today.holiday_message);

  const isTodayOnly = variant === "todayOnly";

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
          {isTodayOnly ? "Today · school calendar" : "School bus & holidays"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {today ? (
          <div
            className={`rounded-xl border p-3 text-sm ${
              noService
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
                : "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"
            }`}
          >
            {isTodayOnly ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                  Today&apos;s event
                </p>
                {today.holiday_name ? (
                  <p className="mt-1 text-base font-semibold leading-snug">{today.holiday_name}</p>
                ) : (
                  <p className="mt-1 text-sm font-medium text-foreground/80">Regular school day</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Bus className="h-4 w-4 shrink-0" />
                  {noService ? (
                    <Badge variant="secondary" className="bg-amber-200/80 text-amber-950 dark:bg-amber-800/80 dark:text-amber-50">
                      No regular bus service today
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-200/80 text-emerald-950 dark:bg-emerald-800/80 dark:text-emerald-50">
                      Regular school day window
                    </Badge>
                  )}
                </div>
                {today.holiday_message ? (
                  <p className="mt-2 leading-relaxed">{today.holiday_message}</p>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    No special holiday entry for today in the published calendar.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Bus className="h-4 w-4 shrink-0" />
                  {noService ? (
                    <Badge variant="secondary" className="bg-amber-200/80 text-amber-950 dark:bg-amber-800/80 dark:text-amber-50">
                      No regular bus service today
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-200/80 text-emerald-950 dark:bg-emerald-800/80 dark:text-emerald-50">
                      Regular school day window
                    </Badge>
                  )}
                </div>
                {today.holiday_name ? (
                  <p className="mt-2 font-semibold leading-snug">{today.holiday_name}</p>
                ) : null}
                {today.holiday_message ? (
                  <p className="mt-2 leading-relaxed">{today.holiday_message}</p>
                ) : (
                  <p className="mt-2 text-muted-foreground">
                    No holiday or weekend rule applies for today in the published calendar.
                  </p>
                )}
              </>
            )}
          </div>
        ) : null}

        {!today ? (
          <p className="text-sm text-muted-foreground">Today&apos;s calendar could not be loaded.</p>
        ) : null}

        {!isTodayOnly && upcoming.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Next on calendar
            </p>
            <ul className="space-y-2 text-sm">
              {upcoming.map((h) => (
                <li
                  key={h.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{h.name}</span>
                  <span className="text-muted-foreground">{fmtRange(h.start_date, h.end_date)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              Dates may change for local festivals. Check with the school for final notices.
            </p>
          </div>
        ) : null}
        {!isTodayOnly && upcoming.length === 0 && !loading ? (
          <p className="text-sm text-muted-foreground">No upcoming holidays loaded.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
