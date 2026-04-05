"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Wraps pages that only school `admin` may open (not `guardian_admin` coordinators).
 */
export default function RequireFullAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("sishu_tirtha_user");
    if (!raw) {
      router.replace("/admin");
      return;
    }
    try {
      const u = JSON.parse(raw) as { user_type?: string };
      if (u.user_type !== "admin") {
        router.replace("/admin/dashboard");
        return;
      }
      setOk(true);
    } catch {
      router.replace("/admin");
    }
  }, [router]);

  if (!ok) return null;
  return <>{children}</>;
}
