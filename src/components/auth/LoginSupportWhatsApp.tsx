"use client";

import { useLayoutEffect, useState } from "react";
import { buildWhatsAppLink } from "@/utils/whatsappInvite";
import { cn } from "@/lib/utils";

const digits = (v: string | undefined) => (v ?? "").replace(/\D/g, "");

/**
 * School office WhatsApp (10-digit India or full with country code), e.g. 9198xxxxxxxx
 * Set in .env: NEXT_PUBLIC_LOGIN_SUPPORT_WHATSAPP=9198xxxxxxxx
 */
function supportPhoneDigits(): string {
  return digits(process.env.NEXT_PUBLIC_LOGIN_SUPPORT_WHATSAPP);
}

function messageForRole(
  role: "guardian" | "driver",
  pageUrl: string,
): string {
  const school = process.env.NEXT_PUBLIC_SCHOOL_NAME?.trim() || "Sishu Tirtha Safe Route";
  if (role === "guardian") {
    return (
      `Hello, I need help with my *Guardian / parent* login for ${school}.\n\n` +
      (pageUrl ? `Page: ${pageUrl}\n` : "") +
      `Please share my login details or reset instructions. Thank you.`
    );
  }
  return (
    `Hello, I need help with my *Driver* login for ${school}.\n\n` +
    (pageUrl ? `Page: ${pageUrl}\n` : "") +
    `Please share my login details or QR instructions. Thank you.`
  );
}

type Props = {
  /** Highlight column for the tab the user is on */
  activeRole: "guardian" | "driver";
  className?: string;
};

/**
 * Two WhatsApp shortcuts aligned under Guardian | Driver — requests credentials from the school.
 */
export function LoginSupportWhatsApp({ activeRole, className }: Props) {
  const phone = supportPhoneDigits();
  const [pageUrl, setPageUrl] = useState("");

  useLayoutEffect(() => {
    try {
      setPageUrl(`${window.location.origin}${window.location.pathname}`);
    } catch {
      setPageUrl("");
    }
  }, []);

  if (phone.length < 10) return null;

  const gHref = buildWhatsAppLink(phone, messageForRole("guardian", pageUrl));
  const dHref = buildWhatsAppLink(phone, messageForRole("driver", pageUrl));

  const cell = (role: "guardian" | "driver", shortLabel: string, href: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex min-h-[2.75rem] flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2 text-center transition-all duration-200 active:scale-[0.98] sm:min-h-[2.5rem] sm:flex-row sm:gap-2",
        role === activeRole
          ? "border-emerald-500/60 bg-gradient-to-b from-emerald-50 to-teal-50/90 text-emerald-950 shadow-md ring-2 ring-emerald-500/25 dark:border-emerald-500/40 dark:from-emerald-950/60 dark:to-teal-950/40 dark:text-emerald-50 dark:ring-emerald-400/20"
          : "border-slate-200/90 bg-white/70 text-slate-700 hover:border-emerald-300/60 hover:bg-emerald-50/50 hover:shadow-sm dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-emerald-600/30 dark:hover:bg-emerald-950/25",
      )}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <WhatsAppGlyph className="h-4 w-4 shrink-0 text-[#25D366] transition-transform duration-200 group-hover:scale-110" />
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200 sm:hidden">
        {role}
      </span>
      <span className="hidden text-xs font-semibold sm:inline">{shortLabel}</span>
    </a>
  );

  return (
    <div className={cn("mx-4 mb-3 space-y-2", className)} aria-label="Request login help on WhatsApp">
      <p className="text-center text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Need login help?
      </p>
      <div className="grid grid-cols-2 gap-2">
        {cell("guardian", "WhatsApp · Guardian", gHref)}
        {cell("driver", "WhatsApp · Driver", dHref)}
      </div>
    </div>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}
