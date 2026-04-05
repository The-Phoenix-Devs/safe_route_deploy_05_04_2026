namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
    NEXT_PUBLIC_SUPABASE_PROJECT_ID?: string;
    /** Firebase Web Push — Cloud Messaging → Web Push certificates (VAPID). */
    NEXT_PUBLIC_FIREBASE_VAPID_KEY?: string;
    /** Android WebView loads this origin (default: https://saferoute.sishutirtha.co.in). */
    CAPACITOR_SERVER_URL?: string;
    /** LAN dev only, e.g. http://192.168.1.5:8080 — overrides CAPACITOR_SERVER_URL. */
    CAPACITOR_LIVE_RELOAD_URL?: string;
  }
}
