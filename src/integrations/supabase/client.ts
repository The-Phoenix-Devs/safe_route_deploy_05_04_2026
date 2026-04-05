import { createClient } from "@supabase/supabase-js";

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
/** Dashboard “anon” key; also accept newer “publishable” naming. */
const rawKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ""
).trim();

/**
 * Vercel sets `VERCEL=1` during `next build`. Without Supabase env, prerender would throw at import.
 * Use placeholders only in that situation so the build finishes; the deployed app still needs real keys.
 */
const isAutomatedProdBuild =
  process.env.NODE_ENV === "production" &&
  (process.env.VERCEL === "1" ||
    process.env.CI === "true" ||
    process.env.NEXT_PHASE === "phase-production-build");
const useBuildPlaceholder = isAutomatedProdBuild && (!rawUrl || !rawKey);

const SUPABASE_URL = useBuildPlaceholder ? "https://placeholder.supabase.co" : rawUrl;
const SUPABASE_PUBLISHABLE_KEY = useBuildPlaceholder
  ? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build-placeholder-not-for-production"
  : rawKey;

if (!useBuildPlaceholder && (!rawUrl || !rawKey)) {
  throw new Error(
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your .env file.",
  );
}

function getAuthStorage(): Storage {
  if (typeof window !== "undefined") {
    return localStorage;
  }
  const memory = new Map<string, string>();
  return {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key: string) {
      return memory.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(memory.keys())[index] ?? null;
    },
    removeItem(key: string) {
      memory.delete(key);
    },
    setItem(key: string, value: string) {
      memory.set(key, value);
    },
  } as Storage;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: getAuthStorage(),
    persistSession: true,
    autoRefreshToken: true,
  },
});