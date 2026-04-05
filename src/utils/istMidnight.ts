/**
 * Next midnight in Asia/Kolkata (IST, UTC+5:30, no DST).
 * Used to expire driver sessions at end of calendar day in India.
 */
export function getNextMidnightISTMs(from: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(from);
  const y = +parts.find((p) => p.type === "year")!.value;
  const m = +parts.find((p) => p.type === "month")!.value;
  const d = +parts.find((p) => p.type === "day")!.value;
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const y2 = next.getUTCFullYear();
  const m2 = next.getUTCMonth() + 1;
  const d2 = next.getUTCDate();
  const iso = `${y2}-${String(m2).padStart(2, "0")}-${String(d2).padStart(2, "0")}T00:00:00+05:30`;
  return new Date(iso).getTime();
}
