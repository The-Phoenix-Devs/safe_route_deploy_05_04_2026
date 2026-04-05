"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

type MobileDashboardFeatureNavProps = {
  items: DashboardNavItem[];
  /** Shown in card header */
  title?: string;
  className?: string;
};

/**
 * Compact grid of feature shortcuts + slide-out list (same links) for driver/guardian dashboards.
 */
export function MobileDashboardFeatureNav({
  items,
  title = "Features",
  className,
}: MobileDashboardFeatureNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!items.length) return null;

  const goTo = (id: string) => {
    scrollToSection(id);
    setSheetOpen(false);
  };

  const NavButtons = ({ dense }: { dense?: boolean }) => (
    <ul
      className={cn(
        "grid gap-2",
        dense ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
      )}
      role="list"
    >
      {items.map(({ id, label, icon: Icon }) => (
        <li key={id}>
          <button
            type="button"
            onClick={() => goTo(id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2.5 text-left text-sm font-medium text-foreground shadow-sm transition-all",
              "hover:border-primary/40 hover:bg-primary/5 active:scale-[0.99]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 leading-snug">{label}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <Card
      className={cn(
        "rounded-2xl border-border/60 bg-card/90 shadow-sm backdrop-blur-sm dark:bg-card/80",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutGrid className="h-4 w-4" aria-hidden />
          </span>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 rounded-xl border-dashed px-3 text-xs font-semibold"
              aria-label="Open full menu"
            >
              <Menu className="h-4 w-4" />
              Menu
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100vw-2rem,20rem)] sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>Tap a row to scroll to that section.</SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <NavButtons dense />
            </div>
          </SheetContent>
        </Sheet>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        <NavButtons />
      </CardContent>
    </Card>
  );
}
