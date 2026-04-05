"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Bus, MessageSquare, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { Button } from "@/components/ui/button";

type Row = {
  id: string;
  message: string;
  created_at: string;
  driver_name: string;
  bus_number: string;
};

export function AdminDriverStatusFeed() {
  const { user } = useSimpleAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canRun =
    user?.user_type === "admin" || user?.user_type === "guardian_admin";

  const load = useCallback(async () => {
    if (!user?.id || !canRun) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "admin_list_driver_quick_status",
        { p_admin_profile_id: user.id, p_limit: 25 },
      );
      if (rpcError) throw rpcError;
      const raw = data as unknown;
      setRows(Array.isArray(raw) ? (raw as Row[]) : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not load messages";
      setError(msg.includes("forbidden") ? "Access denied" : msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, canRun]);

  useEffect(() => {
    load();
  }, [load]);

  if (!canRun) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
        Loading driver messages…
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Driver quick messages</h3>
          <p className="text-sm text-muted-foreground">
            Latest status lines drivers sent from the driver app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/locations">Live map</Link>
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-border/50 bg-muted/20 p-4 text-sm text-muted-foreground">
          No messages yet. Drivers can send presets from their dashboard.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            let timeLabel = r.created_at;
            try {
              timeLabel = format(parseISO(r.created_at), "MMM d, h:mm a");
            } catch {
              /* keep raw */
            }
            return (
              <li
                key={r.id}
                className="flex gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-sm shadow-sm"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{r.message}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Bus className="h-3 w-3" />
                      {r.driver_name}
                    </span>
                    <span>·</span>
                    <span>{r.bus_number}</span>
                    <span>·</span>
                    <span>{timeLabel}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
