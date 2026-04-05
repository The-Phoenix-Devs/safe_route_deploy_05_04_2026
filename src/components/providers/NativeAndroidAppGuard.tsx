"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isNativeAndroidApp } from "@/lib/nativeAndroidApp";

/**
 * Android app build is for drivers and guardians only. Block /admin/* in the WebView.
 */
export function NativeAndroidAppGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isNativeAndroidApp()) return;
    if (!pathname?.startsWith("/admin")) return;
    router.replace("/login?reason=native_android");
  }, [pathname, router]);

  return null;
}
