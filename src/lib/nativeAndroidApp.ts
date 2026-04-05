/**
 * Safe Route Android wrapper: only driver + guardian are supported in the native app.
 * Uses @capacitor/core (safe to import in client components; do not use in RSC).
 *
 * Build-time: set NEXT_PUBLIC_HIDE_ADMIN_LOGIN_LINK=1 when producing `out/` for the
 * Capacitor APK if runtime detection ever fails in your WebView.
 */
import { Capacitor } from "@capacitor/core";

function capacitorAndroidFromGlobal(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  };
  const cap = w.Capacitor;
  try {
    if (cap?.isNativePlatform?.() && cap.getPlatform?.() === "android") return true;
  } catch {
    /* ignore */
  }
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") return true;
  } catch {
    /* ignore */
  }
  return false;
}

/** User-agent fallback when the bridge is slow or tree-shaking drops the global. */
function androidCapacitorUserAgentHint(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (!/Android/i.test(ua)) return false;
  if (/Capacitor/i.test(ua)) return true;
  return false;
}

export function isNativeAndroidApp(): boolean {
  if (typeof window === "undefined") return false;
  return capacitorAndroidFromGlobal() || androidCapacitorUserAgentHint();
}

/** Short copy when geolocation is denied or unavailable (Capacitor app vs browser). */
export function locationPermissionHelpText(): string {
  if (typeof window === "undefined") {
    return "Please enable location services.";
  }
  try {
    if (Capacitor.isNativePlatform()) {
      return "Map shows the school area until GPS works. Allow Location for Safe Route in your device Settings → Apps.";
    }
  } catch {
    /* ignore */
  }
  return "Map shows the school area until GPS works. Allow location for this site in your browser settings.";
}

/** Hide “Admin sign-in” on the login screen (Android app + optional env). */
export function shouldHideAdminLoginLink(): boolean {
  if (process.env.NEXT_PUBLIC_HIDE_ADMIN_LOGIN_LINK === "1") return true;
  if (typeof window === "undefined") return false;
  return isNativeAndroidApp();
}
