import React from "react";
import { Bus, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  totalDrivers: number;
  totalStudents: number;
  activeBuses: number;
  loading: boolean;
}

interface AdminDashboardStatsProps {
  dashboardData: DashboardData;
}

const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({ dashboardData }) => {
  if (dashboardData.loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Loading live stats…</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-border/60 bg-muted/40 p-6"
            >
              <div className="mb-4 h-4 rounded bg-muted" />
              <div className="h-10 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statsItems = [
    {
      title: "Drivers",
      subtitle: "Registered operators",
      value: dashboardData.totalDrivers,
      icon: Users,
      className:
        "from-blue-600/15 via-card to-card dark:from-blue-500/20",
    },
    {
      title: "Students",
      subtitle: "On transport roster",
      value: dashboardData.totalStudents,
      icon: GraduationCap,
      className:
        "from-emerald-600/15 via-card to-card dark:from-emerald-500/20",
    },
    {
      title: "Active buses",
      subtitle: "With assigned drivers",
      value: dashboardData.activeBuses,
      icon: Bus,
      className:
        "from-amber-500/15 via-card to-card dark:from-amber-500/15",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Snapshot of your fleet and students for Sishu Tirtha Safe Route.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statsItems.map((item) => (
          <div
            key={item.title}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br p-6 shadow-sm",
              item.className,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{item.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
              <div className="rounded-xl bg-background/80 p-2.5 shadow-sm ring-1 ring-border/50">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardStats;
