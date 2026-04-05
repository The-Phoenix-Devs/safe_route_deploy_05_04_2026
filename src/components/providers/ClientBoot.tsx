"use client";

import { useEffect } from "react";

export function ClientBoot() {
  useEffect(() => {
    const initServices = async () => {
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

    const start = () => {
      if (needsImmediate) {
        initServices();
      } else if ("requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(initServices, { timeout: 2000 });
      } else {
        setTimeout(initServices, 1200);
      }
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start);
  }, []);

  return null;
}
