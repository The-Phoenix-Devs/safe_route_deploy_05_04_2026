"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Radio, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  enqueueDriverStatus,
  flushDriverStatusQueue,
  getQueuedCountForProfile,
  isPermanentDriverStatusFailure,
  isRetryableDriverStatusError,
} from "@/services/driverStatusOfflineQueue";

const TEMPLATES = [
  "Running about 10 minutes late",
  "Heavy traffic — delayed",
  "Short break, resuming shortly",
  "All students picked up — on the way",
  "Route completed for today",
] as const;

type Props = {
  driverProfileId: string;
};

export function DriverQuickStatus({ driverProfileId }: Props) {
  const [custom, setCustom] = useState("");
  const [sending, setSending] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [pending, setPending] = useState(0);
  const { toast } = useToast();

  const syncPendingCount = useCallback(() => {
    setPending(getQueuedCountForProfile(driverProfileId));
  }, [driverProfileId]);

  const flushQueue = useCallback(async () => {
    setFlushing(true);
    try {
      const { sent, remaining } = await flushDriverStatusQueue(driverProfileId, supabase);
      setPending(remaining);
      if (sent > 0) {
        toast({
          title: "Queued messages sent",
          description: `${sent} message(s) reached the school dashboard.`,
        });
      }
    } finally {
      setFlushing(false);
    }
  }, [driverProfileId, toast]);

  useEffect(() => {
    syncPendingCount();
  }, [syncPendingCount]);

  useEffect(() => {
    const onOnline = () => {
      flushQueue().catch(console.error);
    };
    window.addEventListener("online", onOnline);
    flushQueue().catch(console.error);
    return () => window.removeEventListener("online", onOnline);
  }, [flushQueue]);

  const send = async (message: string) => {
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("driver_post_quick_status", {
        p_driver_profile_id: driverProfileId,
        p_message: text,
      });
      if (error) throw error;
      if (!data) throw new Error("No id returned");
      toast({
        title: "Status sent",
        description: "School admin can see this on the dashboard.",
      });
      setCustom("");
      syncPendingCount();
    } catch (e: unknown) {
      if (isPermanentDriverStatusFailure(e)) {
        toast({
          title: "Failed to send",
          description:
            e instanceof Error && e.message.includes("not a driver")
              ? "Driver profile not linked."
              : e instanceof Error
                ? e.message
                : "Could not send",
          variant: "destructive",
        });
        return;
      }

      const offline =
        (typeof navigator !== "undefined" && navigator.onLine === false) ||
        isRetryableDriverStatusError(e);

      if (offline) {
        enqueueDriverStatus(driverProfileId, text);
        syncPendingCount();
        toast({
          title: "Saved offline",
          description: "We'll send this when the connection is back. You can also tap Retry queue.",
        });
        setCustom("");
        return;
      }

      toast({
        title: "Failed to send",
        description: e instanceof Error ? e.message : "Could not send",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-5 w-5 text-primary" />
            Quick message to school
          </CardTitle>
          {pending > 0 ? (
            <Badge variant="secondary" className="shrink-0">
              {pending} queued
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Tap a line to notify admin. If you lose signal, messages are saved on this device and sent when
          you're back online.
        </p>
        {pending > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full sm:w-auto"
            disabled={flushing || sending}
            onClick={() => flushQueue().catch(console.error)}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${flushing ? "animate-spin" : ""}`} />
            Retry queue now
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <Button
              key={t}
              type="button"
              variant="secondary"
              size="sm"
              className="h-auto min-h-9 max-w-full whitespace-normal rounded-xl px-3 py-2 text-left text-xs leading-snug"
              disabled={sending || flushing}
              onClick={() => send(t)}
            >
              {t}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Or type your own (short)…"
            value={custom}
            maxLength={280}
            disabled={sending || flushing}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send(custom);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            className="shrink-0"
            disabled={sending || flushing || !custom.trim()}
            onClick={() => send(custom)}
            aria-label="Send custom message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
