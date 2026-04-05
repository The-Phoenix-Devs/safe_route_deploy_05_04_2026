"use client";

import { useEffect } from "react";

export function ClientBoot() {
  useEffect(() => {
    const initServices = async () => {
      try {
        const { ensureNativePermissions } = await import("@/services/nativePermissionsBootstrap");
        await ensureNativePermissions();
      } catch (e) {
        console.warn("Native permissions bootstrap:", e);
      }
      try {
        await import("@/config/firebase");
      } catch {
        /* optional */
      }
      const [{ backgroundLocationService }, { locationService }, { pwaService }] =
        await Promise.all([
          import("@/services/backgroundLocationService"),
          import("@/services/locationService"),
          import("@/services/pwaService"),
        ]);
      void backgroundLocationService.initialize().catch(console.error);
      void locationService.initializeLocationServices().catch(console.error);
      void pwaService.initialize().catch(console.error);
    };

    const path = window.location.pathname;
    const needsImmediate = /^\/(driver|guardian|admin)/.test(path);

    const start = async () => {
      const { Capacitor } = await import("@capacitor/core");
      const native = Capacitor.isNativePlatform();
      if (native || needsImmediate) {
        void initServices();
        return;
      }
      if ("requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
          () => void initServices(),
          { timeout: 2000 },
        );
      } else {
        setTimeout(() => void initServices(), 1200);
      }
    };

    if (document.readyState === "complete") void start();
    else window.addEventListener("load", () => void start());
  }, []);

  return null;
}
