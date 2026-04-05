"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

interface HolidayEvent {
  id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  affects_routes: boolean;
}

function yearFromIsoDate(d: string): number {
  return new Date(d + "T12:00:00").getFullYear();
}

const AdminSchedule: React.FC = () => {
  const { user } = useSimpleAuth();
  const [events, setEvents] = useState<HolidayEvent[]>([]);
  const [yearFilter, setYearFilter] = useState<string>("2026");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    is_recurring: false,
    affects_routes: true,
  });
  const { toast } = useToast();

  const canManage =
    user?.user_type === "admin" || user?.user_type === "guardian_admin";

  const fetchEvents = useCallback(async () => {
    if (!user?.id || !canManage) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_list_holidays", {
        p_actor: user.id,
      });

      if (error) throw error;
      setEvents((data as HolidayEvent[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch schedule";
      toast({
        title: "Error",
        description: msg.includes("forbidden") ? "You do not have access to this schedule." : msg,
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, canManage, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    events.forEach((e) => {
      years.add(yearFromIsoDate(e.start_date));
      years.add(yearFromIsoDate(e.end_date));
    });
    const list = Array.from(years).sort((a, b) => b - a);
    if (!list.includes(2026)) list.push(2026);
    return list.sort((a, b) => b - a);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (yearFilter === "all") return events;
    const y = parseInt(yearFilter, 10);
    return events.filter(
      (e) => yearFromIsoDate(e.start_date) === y || yearFromIsoDate(e.end_date) === y
    );
  }, [events, yearFilter]);

  const addEvent = async () => {
    if (!user?.id || !canManage) return;
    const end = newEvent.end_date || newEvent.start_date;
    try {
      const { error } = await supabase.rpc("admin_insert_holiday", {
        p_actor: user.id,
        p_name: newEvent.name.trim(),
        p_description: newEvent.description.trim() || null,
        p_start_date: newEvent.start_date,
        p_end_date: end,
        p_is_recurring: newEvent.is_recurring,
        p_affects_routes: newEvent.affects_routes,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Holiday added." });
      setNewEvent({
        name: "",
        description: "",
        start_date: "",
        end_date: "",
        is_recurring: false,
        affects_routes: true,
      });
      setShowForm(false);
      fetchEvents();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to add event",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = async (id: string) => {
    if (!user?.id || !canManage) return;
    try {
      const { error } = await supabase.rpc("admin_delete_holiday", {
        p_actor: user.id,
        p_holiday_id: id,
      });
      if (error) throw error;
      toast({ title: "Removed", description: "Holiday deleted." });
      fetchEvents();
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const exportCsv = () => {
    const rows = filteredEvents;
    const header = ["name", "start_date", "end_date", "is_recurring", "affects_routes", "description"];
    const lines = [
      header.join(","),
      ...rows.map((e) =>
        [
          `"${(e.name || "").replace(/"/g, '""')}"`,
          e.start_date,
          e.end_date,
          e.is_recurring,
          e.affects_routes,
          `"${(e.description || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holidays-${yearFilter === "all" ? "all" : yearFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canManage) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in as an admin to manage the holiday schedule.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-7 w-7" />
          Holiday schedule
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={!filteredEvents.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add event
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add holiday or event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Event name"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Start date</label>
                <Input
                  type="date"
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">End date (optional)</label>
                <Input
                  type="date"
                  value={newEvent.end_date}
                  onChange={(e) => setNewEvent({ ...newEvent, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newEvent.affects_routes}
                onCheckedChange={(checked) => setNewEvent({ ...newEvent, affects_routes: checked })}
              />
              <span className="text-sm">Affects bus routes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newEvent.is_recurring}
                onCheckedChange={(checked) => setNewEvent({ ...newEvent, is_recurring: checked })}
              />
              <span className="text-sm">Recurring yearly (for reference)</span>
            </div>
            <Button
              onClick={addEvent}
              disabled={!newEvent.name.trim() || !newEvent.start_date}
            >
              Add event
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading schedule…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-medium">{event.name}</h3>
                    {event.description ? (
                      <p className="text-sm text-muted-foreground break-words">{event.description}</p>
                    ) : null}
                    <p className="text-sm mt-1">
                      {format(new Date(event.start_date + "T12:00:00"), "MMM d, yyyy")}
                      {" — "}
                      {format(new Date(event.end_date + "T12:00:00"), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {event.affects_routes && <Badge variant="destructive">Routes</Badge>}
                      {event.is_recurring && <Badge variant="secondary">Recurring</Badge>}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteEvent(event.id)}
                      aria-label={`Delete ${event.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!filteredEvents.length && (
            <p className="text-sm text-muted-foreground">No holidays in this filter.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSchedule;
