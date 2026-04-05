import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY = "sishu_driver_status_queue_v1";
const MAX_ITEMS = 40;

export type QueuedDriverStatus = {
  id: string;
  profileId: string;
  message: string;
  createdAt: number;
};

function safeParse(raw: string | null): QueuedDriverStatus[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is QueuedDriverStatus =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as QueuedDriverStatus).id === "string" &&
        typeof (x as QueuedDriverStatus).profileId === "string" &&
        typeof (x as QueuedDriverStatus).message === "string" &&
        typeof (x as QueuedDriverStatus).createdAt === "number",
    );
  } catch {
    return [];
  }
}

export function loadQueue(): QueuedDriverStatus[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function saveQueue(q: QueuedDriverStatus[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
  } catch {
    /* quota */
  }
}

export function getQueuedCountForProfile(profileId: string): number {
  return loadQueue().filter((x) => x.profileId === profileId).length;
}

export function enqueueDriverStatus(profileId: string, message: string): void {
  const text = message.trim();
  if (!text || !profileId) return;
  const q = loadQueue();
  if (q.length >= MAX_ITEMS) {
    const drop = q.shift();
    if (drop) console.warn("[driver status queue] dropped oldest:", drop.id);
  }
  q.push({
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    profileId,
    message: text,
    createdAt: Date.now(),
  });
  saveQueue(q);
}

/** True when we should retry later (offline / transient). */
export function isRetryableDriverStatusError(e: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = e instanceof Error ? e.message : String(e);
  if (/load failed|failed to fetch|networkerror|network request failed|timeout|timed out|offline|disconnected|502|503|504|service unavailable/i.test(msg)) {
    return true;
  }
  const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
  if (code === "ECONNABORTED") return true;
  return false;
}

/** True when the message should not be retried (bad payload / not a driver). */
export function isPermanentDriverStatusFailure(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (/not a driver/i.test(msg)) return true;
  if (/message must|280|profile required/i.test(msg)) return true;
  return false;
}

export async function flushDriverStatusQueue(
  profileId: string,
  supabase: SupabaseClient,
): Promise<{ sent: number; remaining: number }> {
  const all = loadQueue();
  const others = all.filter((x) => x.profileId !== profileId);
  const mine = all
    .filter((x) => x.profileId === profileId)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (mine.length === 0) {
    return { sent: 0, remaining: 0 };
  }

  let sent = 0;
  const still: QueuedDriverStatus[] = [];

  for (let i = 0; i < mine.length; i++) {
    const item = mine[i];
    const { error } = await supabase.rpc("driver_post_quick_status", {
      p_driver_profile_id: item.profileId,
      p_message: item.message,
    });

    if (!error) {
      sent++;
      continue;
    }

    if (isPermanentDriverStatusFailure(error)) {
      console.warn("[driver status queue] dropping failed item:", item.id, error);
      continue;
    }

    still.push(...mine.slice(i));
    break;
  }

  saveQueue([...others, ...still]);
  return { sent, remaining: still.length };
}
