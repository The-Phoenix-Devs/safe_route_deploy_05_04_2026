"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";

/**
 * Drivers: session ends at midnight IST (new calendar day). Guardians/admins: no scheduled expiry.
 */
export function SessionExpiryGuard() {
  const { user, logout } = useSimpleAuth();
  const router = useRouter();

  useEffect(() => {
    const check = () => {
      if (!user || user.user_type !== "driver") return;
      const exp = user.sessionExpiresAt;
      if (typeof exp === "number" && Date.now() >= exp) {
        void logout();
        router.replace("/login?reason=driver_midnight");
      }
    };

    check();
    const id = setInterval(check, 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [user, logout, router]);

  return null;
}
