"use client";

import { useEffect, useRef } from "react";
import { useSimpleAuth } from "@/hooks/useSimpleAuth";
import { useToast } from "@/hooks/use-toast";

/**
 * When a guardian has the app open, show in-app toasts for FCM data (background still uses the service worker).
 */
export function GuardianForegroundMessages() {
  const { user } = useSimpleAuth();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const guardianId =
    user?.user_type === "guardian" ? user.id : null;

  useEffect(() => {
    if (!guardianId) return;

    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const { getMessaging, onMessage, isSupported } = await import("firebase/messaging");
        const { default: app } = await import("@/config/firebase");
        const ok = await isSupported().catch(() => false);
        if (!ok) return;

        const messaging = getMessaging(app);
        unsubscribe = onMessage(messaging, (payload) => {
          const n = payload.notification;
          toastRef.current({
            title: n?.title ?? "Notification",
            description: n?.body ?? undefined,
          });
        });
      } catch {
        /* messaging unavailable */
      }
    })();

    return () => {
      unsubscribe?.();
    };
  }, [guardianId]);

  return null;
}
