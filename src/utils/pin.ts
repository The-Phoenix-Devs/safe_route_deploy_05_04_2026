/** Cryptographically better than pure Math.random for short-lived PINs; still not a CSPRNG — acceptable for 6-digit portal PINs issued server-side. */
export function generateSixDigitPin(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const n = 100000 + (buf[0] % 900000);
  return String(n);
}
