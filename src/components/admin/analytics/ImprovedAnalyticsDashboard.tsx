import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Bus,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Route,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

interface Kpis {
  totalTrips: number;
  totalTripsPrev: number;
  onTimePercentage: number | null;
  onTimePercentagePrev: number | null;
  totalStudents: number;
  safetyIncidents: number;
  safetyIncidentsPrev: number;
  activeDriversInPeriod: number;
}

interface AnalyticsPayload {
  kpis: Kpis;
  monthlyTrends: Array<{ month: string; trips: number; onTime: number; fuel: number }>;
  weeklyStats: Array<{ day: string; pickup: number; dropoff: number; incidents: number }>;
  routePerformance: Array<{ route: string; onTime: number; avgDelay: number; students: number }>;
  driverPerformance: Array<{ name: string; rating: number; trips: number; onTime: number }>;
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function formatTrend(delta: number | null): { trend: "up" | "down"; label: string } | null {
  if (delta === null || Number.isNaN(delta)) return null;
  if (delta === 0) return { trend: "up", label: "0%" };
  return {
    trend: delta > 0 ? "up" : "down",
    label: `${delta > 0 ? "+" : ""}${delta}%`,
  };
}

function tripsDistributionPie(drivers: { trips: number }[]) {
  let a = 0,
    b = 0,
    c = 0,
    d = 0;
  for (const row of drivers) {
    const t = row.trips;
    if (t >= 20) a++;
    else if (t >= 10) b++;
    else if (t >= 4) c++;
    else d++;
  }
  const total = a + b + c + d;
  if (total === 0) {
    return [
      { name: "No trip data", value: 1, color: "#94a3b8" },
    ];
  }
  return [
    { name: "20+ trips", value: a, color: "#00C49F" },
    { name: "10–19 trips", value: b, color: "#0088FE" },
    { name: "4–9 trips", value: c, color: "#FFBB28" },
    { name: "1–3 trips", value: d, color: "#FF8042" },
  ].filter((x) => x.value > 0);
}

export const ImprovedAnalyticsDashboard: React.FC = () => {
  const { user } = useSimpleAuth();
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  const canLoad = Boolean(user?.id && (user.user_type === "admin" || user.user_type === "guardian_admin"));

  useEffect(() => {
    const load = async () => {
      if (!canLoad || !user?.id) {
        setLoading(false);
        setData(null);
        setError(
          !user
            ? "Sign in as an admin to load analytics."
            : "Analytics require an admin or guardian-admin account.",
        );
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { data: raw, error: rpcError } = await supabase.rpc("get_admin_analytics", {
          p_range: timeRange,
          p_admin_profile_id: user.id,
        });

        if (rpcError) {
          setError(rpcError.message || "Could not load analytics.");
          setData(null);
          return;
        }

        const payload = raw as AnalyticsPayload;
        setData({
          kpis: payload.kpis,
          monthlyTrends: Array.isArray(payload.monthlyTrends) ? payload.monthlyTrends : [],
          weeklyStats: Array.isArray(payload.weeklyStats) ? payload.weeklyStats : [],
          routePerformance: Array.isArray(payload.routePerformance) ? payload.routePerformance : [],
          driverPerformance: Array.isArray(payload.driverPerformance) ? payload.driverPerformance : [],
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [timeRange, user?.id, user?.user_type, canLoad]);

  const pieData = useMemo(
    () => tripsDistributionPie(data?.driverPerformance ?? []),
    [data?.driverPerformance],
  );

  const tripTrend = data ? formatTrend(pctChange(data.kpis.totalTrips, data.kpis.totalTripsPrev)) : null;
  const onTimeTrend =
    data &&
    data.kpis.onTimePercentage != null &&
    data.kpis.onTimePercentagePrev != null
      ? formatTrend(
          Math.round((data.kpis.onTimePercentage - data.kpis.onTimePercentagePrev) * 10) / 10,
        )
      : null;

  const StatCard = ({
    title,
    value,
    icon,
    trend,
    trendValue,
    footnote,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: "up" | "down";
    trendValue?: string;
    footnote?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && trendValue && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{trendValue} vs prior period</span>
              </div>
            )}
            {footnote && <p className="mt-1 text-xs text-muted-foreground">{footnote}</p>}
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-8 bg-muted rounded w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Analytics unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <p className="mt-4 text-sm text-muted-foreground">
          Run the migration <code className="rounded bg-muted px-1">20260407100000_admin_analytics_rpc.sql</code>{" "}
          in Supabase SQL Editor, then refresh. Metrics use{" "}
          <code className="rounded bg-muted px-1">trip_sessions</code>,{" "}
          <code className="rounded bg-muted px-1">pickup_drop_history</code>,{" "}
          <code className="rounded bg-muted px-1">panic_alerts</code>, and{" "}
          <code className="rounded bg-muted px-1">students</code>.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const { kpis, monthlyTrends, weeklyStats, routePerformance, driverPerformance } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Live metrics from your Supabase project (trips, students, pickups, safety alerts).
          </p>
          <Badge variant="secondary" className="mt-2">
            Connected to database
          </Badge>
        </div>
        <div className="flex gap-2">
          {(["week", "month", "quarter"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Alert>
          <AlertTitle>Partial warning</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total trips (period)"
          value={kpis.totalTrips.toLocaleString()}
          icon={<Bus className="h-8 w-8" />}
          trend={tripTrend?.trend}
          trendValue={tripTrend?.label}
        />
        <StatCard
          title="On-time completion"
          value={
            kpis.onTimePercentage != null ? `${kpis.onTimePercentage}%` : "—"
          }
          icon={<Clock className="h-8 w-8" />}
          trend={onTimeTrend?.trend}
          trendValue={
            onTimeTrend
              ? `${onTimeTrend.label} pts`
              : undefined
          }
          footnote="Share of completed trips ended within 12h of start"
        />
        <StatCard
          title="Students enrolled"
          value={kpis.totalStudents.toLocaleString()}
          icon={<Users className="h-8 w-8" />}
          footnote={`${kpis.activeDriversInPeriod} driver(s) with trips this period`}
        />
        <StatCard
          title="Safety incidents"
          value={String(kpis.safetyIncidents)}
          icon={<AlertTriangle className="h-8 w-8" />}
          footnote={`Panic alerts this period · prior period: ${kpis.safetyIncidentsPrev}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly trip volume & on-time %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="trips" fill="#8884d8" name="Trips" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="onTime"
                  stroke="#82ca9d"
                  name="On-time %"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Last 7 days activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pickup"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Pickups"
                />
                <Area
                  type="monotone"
                  dataKey="dropoff"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Drop-offs"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Routes (students & on-time %)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={routePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="route" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="students" fill="#8884d8" name="Students" />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="onTime"
                  stroke="#82ca9d"
                  name="On-time %"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Driver trip volume (this period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent: number }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top drivers by trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {driverPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trips in this period yet.</p>
              ) : (
                driverPerformance.slice(0, 5).map((driver, index) => (
                  <div key={driver.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.trips} trips</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{driver.rating}/5.0</p>
                      <p className="text-sm text-muted-foreground">{driver.onTime}% on-time</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routePerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No routes defined or no trip data.</p>
              ) : (
                routePerformance.map((route) => (
                  <div key={route.route} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{route.route}</p>
                      <p className="text-sm text-muted-foreground">{route.students} students</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Badge
                          variant={
                            route.onTime >= 95 ? "default" : route.onTime >= 80 ? "secondary" : "destructive"
                          }
                        >
                          {route.onTime}%
                        </Badge>
                        {route.onTime >= 95 && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </div>
                      <p className="text-sm text-muted-foreground">On-time (completed trips)</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
