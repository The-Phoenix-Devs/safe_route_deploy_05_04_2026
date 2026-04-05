"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ACCOUNT_NAV_COMMON,
  ACCOUNT_NAV_FULL_ADMIN,
  COORDINATOR_BLOCKED,
  PRIMARY_NAV,
  SECONDARY_NAV,
  filterNavByRole,
  type AdminNavItem,
} from "@/components/admin/layout/adminNavConfig";
import { BRAND_LOGO_SRC } from "@/lib/brandLogo";

export function AdminSidebar({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sishu_tirtha_user");
      if (raw) {
        const u = JSON.parse(raw) as { user_type?: string };
        setRole(u.user_type ?? null);
      }
    } catch {
      setRole(null);
    }
  }, []);

  const isCoordinator = role === "guardian_admin";
  const isFullAdmin = role === "admin";

  const secondaryNav = useMemo(
    () => filterNavByRole(SECONDARY_NAV, isCoordinator, COORDINATOR_BLOCKED),
    [isCoordinator],
  );

  const accountNav = useMemo(() => {
    const items: AdminNavItem[] = [];
    if (isFullAdmin) {
      items.push(...ACCOUNT_NAV_FULL_ADMIN);
    }
    items.push(...ACCOUNT_NAV_COMMON);
    return items;
  }, [isFullAdmin]);

  const q = query.trim().toLowerCase();
  const match = (items: AdminNavItem[]) => {
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) || i.path.toLowerCase().includes(q),
    );
  };

  const NavBlock = ({
    title,
    items,
  }: {
    title: string;
    items: AdminNavItem[];
  }) => {
    const filtered = match(items);
    if (filtered.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {filtered.map((item) => {
          const active =
            pathname === item.path ||
            (item.path !== "/admin/dashboard" &&
              pathname.startsWith(`${item.path}/`));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("flex h-full flex-col bg-card/95", className)}>
      <div className="border-b border-border/60 px-4 py-5">
        <div className="flex items-center gap-3">
          <img
            src={BRAND_LOGO_SRC}
            alt=""
            className="h-11 w-11 rounded-full ring-2 ring-primary/20"
            width={44}
            height={44}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sishu Tirtha
            </p>
            <p className="text-base font-bold leading-tight">
              {isCoordinator ? "Coordinator" : "Admin console"}
            </p>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter menu…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8 text-sm"
            aria-label="Filter navigation"
          />
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <NavBlock title="Overview" items={PRIMARY_NAV} />
        <NavBlock title="Operations" items={secondaryNav} />
        {accountNav.length > 0 ? (
          <NavBlock title="Account" items={accountNav} />
        ) : null}
      </nav>
    </div>
  );
}
