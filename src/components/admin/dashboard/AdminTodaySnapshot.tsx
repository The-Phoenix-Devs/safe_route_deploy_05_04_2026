"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Bus,
  CheckCircle2,
  MessageCircle,
  Radio,
  Sun,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { cn } from "@/lib/utils";

type Snapshot = {
  date_ist: string;
  active_trips: number;
  trips_started_today: number;
  trips_completed_today: number;
  open_feedback: number;
  live_drivers: number;
};

function rpcErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return String(e);
}

function normalizeSnapshotRaw(raw: unknown): Snapshot | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return normalizeSnapshotRaw(JSON.parse(raw) as unknown);
    } catch {
      return null;
    }
  }
  if (Array.isArray(raw)) {
    if (raw.length === 1) return normalizeSnapshotRaw(raw[0]);
    return null;
  }
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    o.active_trips === undefined &&
    o.trips_started_today === undefined &&
    o.open_feedback === undefined
  ) {
    return null;
  }
  return {
    date_ist: String(o.date_ist ?? ""),
    active_trips: Number(o.active_trips) || 0,
    trips_started_today: Number(o.trips_started_today) || 0,
    trips_completed_today: Number(o.trips_completed_today) || 0,
    open_feedback: Number(o.open_feedback) || 0,
    live_drivers: Number(o.live_drivers) || 0,
  };
}

export function AdminTodaySnapshot() {
  const { user } = useSimpleAuth();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canRun =
    user?.user_type === "admin" || user?.user_type === "guardian_admin";

  useEffect(() => {
    if (!user?.id || !canRun) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: raw, error: rpcError } = await supabase.rpc(
          "get_admin_today_snapshot",
          { p_admin_profile_id: user.id },
        );
        if (rpcError) throw rpcError;
        const snap = normalizeSnapshotRaw(raw);
        if (!cancelled) {
          if (snap) setData(snap);
          else setError("Unexpected snapshot response. Apply Supabase migration get_admin_today_snapshot if missing.");
        }
      } catch (e: unknown) {
        const msg = rpcErrorMessage(e);
        const friendly = msg.includes("forbidden")
          ? "Access denied"
          : msg.length > 0
            ? msg
            : "Could not load today’s snapshot";
        if (!cancelled) setError(friendly);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, canRun]);

  if (!canRun) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
        Loading today’s operations…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const tiles = [
    {
      label: "Active trips",
      value: data.active_trips,
      icon: Activity,
      hint: "Drivers who have not ended the trip yet",
      href: "/admin/history",
    },
    {
      label: "Started today",
      value: data.trips_started_today,
      icon: Sun,
      hint: "Trips started since midnight (IST)",
      href: "/admin/history",
    },
    {
      label: "Completed today",
      value: data.trips_completed_today,
      icon: CheckCircle2,
      hint: "Marked completed today (IST)",
      href: "/admin/history",
    },
    {
      label: "Open feedback",
      value: data.open_feedback,
      icon: MessageCircle,
      hint: "Needs attention or in progress",
      href: "/admin/feedback",
    },
    {
      label: "Live on map",
      value: data.live_drivers,
      icon: Radio,
      hint: "Drivers posting active location",
      href: "/admin/locations",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Today (IST)</h3>
          <p className="text-sm text-muted-foreground">
            Quick read for the morning rush — {data.date_ist}
          </p>
        </div>
        <Link
          href="/admin/locations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <Bus className="h-3.5 w-3.5" />
          Live map
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className={cn(
              "group rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm transition-shadow hover:shadow-md",
              t.value > 0 && t.label === "Open feedback"
                ? "border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20"
                : "",
            )}
            title={t.hint}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.label}
              </p>
              <t.icon className="h-4 w-4 shrink-0 text-primary opacity-80 group-hover:opacity-100" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{t.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
