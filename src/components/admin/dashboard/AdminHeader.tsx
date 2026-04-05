"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import { Menu, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { SimpleThemeToggle } from '@/components/ui/theme-toggle';
import { DashboardDateTime } from '@/components/layout/DashboardDateTime';
import { BRAND_LOGO_SRC } from "@/lib/brandLogo";

interface AdminHeaderProps {
  user: { name: string };
  /** Opens mobile navigation drawer */
  onMenuClick?: () => void;
  /** Opens command palette (jump to any admin page) */
  onOpenCommandPalette?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  user,
  onMenuClick,
  onOpenCommandPalette,
}) => {
  const router = useRouter();
  const { logout } = useSimpleAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    router.push("/login");
  };

  return (
    <div className="border-b border-primary/20 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center space-x-2 sm:space-x-3">
          {onMenuClick ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label="Open navigation menu"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : null}
          <img 
            src={BRAND_LOGO_SRC} 
            alt="Sishu Tirtha Safe Route" 
            className="h-8 w-8 sm:h-10 sm:w-10" 
          />
          <h1 className="text-lg sm:text-xl font-bold">
            <span className="hidden sm:inline">Sishu Tirtha Admin Panel</span>
            <span className="sm:hidden">Admin</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:gap-4">
          <DashboardDateTime
            appearance="onPrimary"
            className="inline-flex max-w-[min(100%,14rem)] shrink-0 flex-col items-end gap-0.5 text-[10px] sm:max-w-none sm:flex-row sm:items-center sm:gap-x-2 sm:text-xs"
          />
          {onOpenCommandPalette ? (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-9 w-9 shrink-0 border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 sm:hidden"
                onClick={onOpenCommandPalette}
                aria-label="Jump to page"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="hidden h-9 gap-2 border-0 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 sm:inline-flex"
                onClick={onOpenCommandPalette}
              >
                <Search className="h-4 w-4" />
                <span className="max-w-[8rem] truncate text-xs font-medium">Jump to…</span>
                <kbd className="hidden rounded bg-primary-foreground/20 px-1 font-mono text-[10px] md:inline">
                  Ctrl+K
                </kbd>
              </Button>
            </>
          ) : null}
          <span className="hidden sm:inline text-sm">{user.name}</span>
          <SimpleThemeToggle />
          <Menubar className="border-none bg-transparent">
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer text-primary-foreground p-1">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => router.push("/admin/profile")}>
                  My Profile
                </MenubarItem>
                <MenubarItem onClick={handleLogout}>Logout</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;