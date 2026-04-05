"use client";

import Link from "next/link";
import {
  Calendar,
  GraduationCap,
  Map,
  MessageCircle,
  Route as RouteIcon,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/admin/locations",
    label: "Live map",
    description: "Buses and students on the map",
    icon: Map,
    className: "from-sky-500/15 to-card dark:from-sky-500/20",
  },
  {
    href: "/admin/schedule",
    label: "Holidays",
    description: "School calendar & closures",
    icon: Calendar,
    className: "from-violet-500/15 to-card dark:from-violet-500/20",
  },
  {
    href: "/admin/students",
    label: "Students",
    description: "Roster & assignments",
    icon: GraduationCap,
    className: "from-emerald-500/15 to-card dark:from-emerald-500/20",
  },
  {
    href: "/admin/drivers",
    label: "Drivers",
    description: "Operators & QR login",
    icon: Users,
    className: "from-blue-500/15 to-card dark:from-blue-500/20",
  },
  {
    href: "/admin/routes",
    label: "Routes",
    description: "Stops and paths",
    icon: RouteIcon,
    className: "from-amber-500/15 to-card dark:from-amber-500/20",
  },
  {
    href: "/admin/feedback",
    label: "Feedback",
    description: "Parent messages",
    icon: MessageCircle,
    className: "from-rose-500/15 to-card dark:from-rose-500/20",
  },
];

export function AdminQuickActions() {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Quick actions</h3>
        <p className="text-sm text-muted-foreground">
          Common tasks in one tap — use Ctrl+K anywhere in the admin panel to jump by name.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              "group flex gap-3 rounded-2xl border border-border/60 bg-gradient-to-br p-4 shadow-sm transition-shadow hover:shadow-md",
              a.className,
            )}
          >
            <div className="rounded-xl bg-background/90 p-2.5 ring-1 ring-border/50">
              <a.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground group-hover:underline">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
