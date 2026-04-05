/** Build wa.me link (opens WhatsApp desktop / web if logged in). */
export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  const d = phoneDigits.replace(/\D/g, "");
  let e164 = d;
  if (d.length === 10) {
    e164 = `91${d}`;
  } else if (d.length === 11 && d.startsWith("0")) {
    e164 = `91${d.slice(1)}`;
  } else if (d.length === 12 && d.startsWith("91")) {
    e164 = d;
  } else if (d.length > 10 && d.startsWith("91")) {
    e164 = d;
  }
  const text = encodeURIComponent(message);
  return `https://wa.me/${e164}?text=${text}`;
}

export function openWhatsAppInvite(phoneDigits: string, message: string): void {
  if (typeof window === "undefined") return;
  window.open(buildWhatsAppLink(phoneDigits, message), "_blank", "noopener,noreferrer");
}

export function driverWelcomeMessage(params: {
  name: string;
  mobile: string;
  busNumber: string;
  pin?: string;
}): string {
  const pinLine =
    params.pin && /^\d{6}$/.test(params.pin)
      ? `• 6-digit login PIN: *${params.pin}*\n`
      : "• 6-digit PIN: ask your school if you did not receive it yet.\n";
  return (
    `Hello ${params.name}, welcome to Sishu Tirtha Safe Route.\n\n` +
    `*Driver app login*\n` +
    `• Mobile (username): ${params.mobile}\n` +
    pinLine +
    `• Bus number: ${params.busNumber}\n\n` +
    `Open Safe Route → *Driver* tab: enter mobile + PIN, or scan the QR your school shares.\n\n` +
    `— Sishu Tirtha Transport`
  );
}

export function guardianWelcomeMessage(params: {
  guardianName: string;
  studentName: string;
  mobile: string;
  pickup: string;
  bus?: string;
  pin?: string;
}): string {
  const pinLine =
    params.pin && /^\d{6}$/.test(params.pin)
      ? `• 6-digit login PIN: *${params.pin}*\n`
      : "• 6-digit PIN: ask your school if you did not receive it yet.\n";
  return (
    `Hello ${params.guardianName}, your child *${params.studentName}* is on Sishu Tirtha Safe Route.\n\n` +
    `*Guardian app login*\n` +
    `• Mobile (username): ${params.mobile}\n` +
    pinLine +
    `• Pickup: ${params.pickup}\n` +
    (params.bus ? `• Bus: ${params.bus}\n` : "") +
    `\nOpen the *Guardian* tab on the login page and sign in with mobile + PIN.\n\n` +
    `— Sishu Tirtha Transport`
  );
}

export function coordinatorWelcomeMessage(params: {
  name: string;
  mobile: string;
  pin: string;
}): string {
  return (
    `Hello ${params.name}, you are a Parent Coordinator for Sishu Tirtha Safe Route.\n\n` +
    `Admin web login:\n• Mobile: ${params.mobile}\n• 6-digit PIN: ${params.pin}\n\n` +
    `Open the admin link from the school and choose “Parent coordinator” to sign in.\n\n` +
    `Keep this PIN private.\n\n` +
    `— Sishu Tirtha Transport`
  );
}

/** Reminder text for guardians (password/OTP is not stored in the app). */
export function guardianLoginReminderMessage(params: {
  guardianName: string;
  studentName?: string;
  username: string;
  loginOrigin: string;
  /** When known (e.g. from admin resend), include 6-digit portal PIN. */
  pin?: string | null;
}): string {
  const base = (params.loginOrigin || "").replace(/\/$/, "") || "https://saferoute.sishutirtha.co.in";
  const loginUrl = `${base}/login`;
  const ctx = params.studentName
    ? `for ${params.studentName}`
    : "for your family";
  const pinLine =
    params.pin && /^\d{6}$/.test(params.pin)
      ? `• 6-digit PIN: ${params.pin}\n`
      : "• PIN: ask the school office if you don’t have your 6-digit PIN yet.\n";
  return (
    `Hello ${params.guardianName},\n\n` +
    `Sishu Tirtha Safe Route — guardian login ${ctx}:\n` +
    `• Mobile (username): ${params.username}\n` +
    pinLine +
    `• Open: ${loginUrl}\n` +
    `Choose Guardian, then sign in with mobile + PIN.\n\n` +
    `— Sishu Tirtha Transport`
  );
}

/** Reminder for drivers (QR / mobile login; no password in DB). */
export function driverLoginReminderMessage(params: {
  name: string;
  username: string;
  busNumber: string;
  loginOrigin: string;
  pin?: string | null;
}): string {
  const base = (params.loginOrigin || "").replace(/\/$/, "") || "https://saferoute.sishutirtha.co.in";
  const loginUrl = `${base}/login`;
  const pinLine =
    params.pin && /^\d{6}$/.test(params.pin)
      ? `• 6-digit PIN: ${params.pin}\n`
      : "• PIN: ask transport office if you need your 6-digit PIN.\n";
  return (
    `Hello ${params.name},\n\n` +
    `Sishu Tirtha Safe Route — driver login:\n` +
    `• Mobile (username): ${params.username}\n` +
    pinLine +
    `• Bus: ${params.busNumber}\n` +
    `Open ${loginUrl} → Driver (mobile + PIN) or scan your QR from admin.\n\n` +
    `— Sishu Tirtha Transport`
  );
}

export function hasWhatsAppablePhone(phone: string | null | undefined): boolean {
  const d = String(phone ?? "").replace(/\D/g, "");
  return d.length >= 10;
}
