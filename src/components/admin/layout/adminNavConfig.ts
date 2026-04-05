import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Calendar,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Map,
  MessageCircle,
  Route as RouteIcon,
  Shield,
  TrendingUp,
  UserCircle,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

export type AdminNavItem = { path: string; icon: LucideIcon; label: string };

export const PRIMARY_NAV: AdminNavItem[] = [
  { path: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
  { path: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
  { path: "/admin/drivers", icon: Users, label: "Drivers" },
  { path: "/admin/students", icon: GraduationCap, label: "Students" },
  { path: "/admin/routes", icon: RouteIcon, label: "Routes" },
  { path: "/admin/locations", icon: Map, label: "Live map" },
];

export const SECONDARY_NAV: AdminNavItem[] = [
  { path: "/admin/feedback", icon: MessageCircle, label: "Feedback" },
  { path: "/admin/performance", icon: TrendingUp, label: "Performance" },
  { path: "/admin/reports", icon: Download, label: "Reports" },
  { path: "/admin/schedule", icon: Calendar, label: "Schedule" },
  { path: "/admin/history", icon: Clock, label: "Trip history" },
  { path: "/admin/user-logs", icon: FileText, label: "User logs" },
  { path: "/admin/session-management", icon: Shield, label: "Sessions" },
  { path: "/admin/notifications", icon: Bell, label: "Notifications" },
];

/** Paths hidden for guardian_admin (coordinator) role */
export const COORDINATOR_BLOCKED = new Set<string>(["/admin/session-management"]);

export const ACCOUNT_NAV_FULL_ADMIN: AdminNavItem[] = [
  { path: "/admin/add-guardian-coordinator", icon: UsersRound, label: "Parent coordinator" },
  { path: "/admin/add-admin", icon: UserPlus, label: "Add admin" },
];

export const ACCOUNT_NAV_COMMON: AdminNavItem[] = [
  { path: "/admin/profile", icon: UserCircle, label: "Profile" },
];

export function filterNavByRole(
  items: AdminNavItem[],
  isCoordinator: boolean,
  blocked: Set<string>,
): AdminNavItem[] {
  if (!isCoordinator) return items;
  return items.filter((i) => !blocked.has(i.path));
}
