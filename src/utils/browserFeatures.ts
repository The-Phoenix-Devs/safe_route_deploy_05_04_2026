/**
 * Camera / precise geolocation require a secure context in Chromium & Safari.
 * `http://192.168.x.x` on a phone is NOT secure — use https, localhost, or the native app.
 */
export function isSecureBrowserContext(): boolean {
  if (typeof window === "undefined") return true;
  if (window.isSecureContext) return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function insecureContextHelpMessage(): string {
  return "Camera and GPS need HTTPS on your phone. Use https://… (not http://192.168…), open localhost from a PC, or sign in with Mobile instead of QR.";
}
