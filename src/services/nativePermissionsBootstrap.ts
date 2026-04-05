/**
 * Capacitor Android/iOS: request OS permissions on first load so WebView APIs work
 * (geolocation, camera, push/local notifications, microphone for chat/voice).
 * Safe no-op in browser / SSR. Single flight per page session.
 */
import { Capacitor } from "@capacitor/core";

let nativePermDone: Promise<void> | null = null;

export function ensureNativePermissions(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  if (!nativePermDone) {
    nativePermDone = runNativePermissionPrompts();
  }
  return nativePermDone;
}

async function runNativePermissionPrompts(): Promise<void> {
  // 1) Location — WebView navigator.geolocation + Capacitor helpers
  try {
    const { Geolocation } = await import("@capacitor/geolocation");
    await Geolocation.requestPermissions();
  } catch (e) {
    console.warn("[native perms] Geolocation.requestPermissions:", e);
  }

  // 2) Camera — QR, PhotoCapture, html5-qrcode, etc.
  try {
    const { Camera } = await import("@capacitor/camera");
    await Camera.requestPermissions();
  } catch (e) {
    console.warn("[native perms] Camera.requestPermissions:", e);
  }

  // 3) Notifications — FCM Web Push, background tracking toasts (Android 13+ POST_NOTIFICATIONS)
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  } catch (e) {
    console.warn("[native perms] Notification.requestPermission:", e);
  }

  // 4) Microphone — VoiceRecorder, WebRTC-style chat (RECORD_AUDIO). Audio-only avoids a second camera prompt.
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      stream.getTracks().forEach((t) => t.stop());
    }
  } catch (e) {
    console.warn("[native perms] getUserMedia (audio):", e);
  }
}
