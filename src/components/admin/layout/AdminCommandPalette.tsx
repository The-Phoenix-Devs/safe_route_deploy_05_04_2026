"use client";

import React, { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ACCOUNT_NAV_COMMON,
  ACCOUNT_NAV_FULL_ADMIN,
  COORDINATOR_BLOCKED,
  PRIMARY_NAV,
  SECONDARY_NAV,
  filterNavByRole,
  type AdminNavItem,
} from "@/components/admin/layout/adminNavConfig";

function readRole(): "admin" | "guardian_admin" | null {
  try {
    const raw = localStorage.getItem("sishu_tirtha_user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { user_type?: string };
    if (u.user_type === "guardian_admin") return "guardian_admin";
    if (u.user_type === "admin") return "admin";
    return null;
  } catch {
    return null;
  }
}

export function AdminCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "guardian_admin" | null>(null);

  useEffect(() => {
    if (!open) return;
    setRole(readRole());
  }, [open]);

  const secondary = useMemo(
    () => filterNavByRole(SECONDARY_NAV, role === "guardian_admin", COORDINATOR_BLOCKED),
    [role],
  );

  const account: AdminNavItem[] = useMemo(() => {
    const tail = [...ACCOUNT_NAV_COMMON];
    if (role === "admin") {
      return [...ACCOUNT_NAV_FULL_ADMIN, ...tail];
    }
    return tail;
  }, [role]);

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const Row = ({ item }: { item: AdminNavItem }) => (
    <CommandItem key={item.path} value={`${item.label} ${item.path}`} onSelect={() => go(item.path)}>
      <item.icon className="mr-2 h-4 w-4" />
      {item.label}
    </CommandItem>
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to page…" />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandGroup heading="Overview">
          {PRIMARY_NAV.map((item) => (
            <Row key={item.path} item={item} />
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Operations">
          {secondary.map((item) => (
            <Row key={item.path} item={item} />
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          {account.map((item) => (
            <Row key={item.path} item={item} />
          ))}
        </CommandGroup>
      </CommandList>
      <div className="border-t px-3 py-2 text-[11px] text-muted-foreground">
        <span>Press </span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>
        <span> + </span>
        <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">K</kbd>
        <span> anytime to open this palette.</span>
      </div>
    </CommandDialog>
  );
}

/** Attach global keyboard shortcut (admin layout only). */
export function useAdminCommandPaletteShortcut(
  setOpen: Dispatch<SetStateAction<boolean>>,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "k" && e.key !== "K") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
      }
      e.preventDefault();
      setOpen((o) => !o);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);
}
