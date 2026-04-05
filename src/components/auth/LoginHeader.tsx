import React, { Fragment, useEffect } from "react";
import { CardHeader, CardDescription } from "@/components/ui/card";
import { CreditSep } from "@/components/ui/CreditSep";
import { BRAND_LOGO_SRC } from "@/lib/brandLogo";

const LoginHeader: React.FC = () => {
  useEffect(() => {
    const title = "Secure Login — Sishu Tirtha Safe Route";
    document.title = title;
    const desc =
      "Guardian and driver login with your registered mobile number (no SMS charges).";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", window.location.href);
  }, []);

  return (
    <CardHeader className="space-y-3 pb-3 pt-5 text-center sm:space-y-4 sm:pt-8">
      <div className="flex justify-center">
        <div className="relative">
          <div
            className="absolute -inset-1 scale-105 rounded-full bg-gradient-to-tr from-sky-400/35 via-emerald-400/25 to-teal-300/30 blur-lg"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-60 dark:from-white/10"
            aria-hidden
          />
          <img
            src={BRAND_LOGO_SRC}
            alt=""
            className="relative h-[7.25rem] w-[7.25rem] rounded-full border-[3px] border-white object-cover shadow-2xl shadow-slate-900/25 ring-2 ring-sky-500/20 dark:border-slate-700 dark:shadow-black/40 dark:ring-emerald-500/25 sm:h-28 sm:w-28"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      <div className="space-y-1.5 px-1 sm:space-y-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          School transport
        </p>
        <h1 className="bg-gradient-to-r from-sishu-blue via-blue-600 to-emerald-600 bg-clip-text text-[1.25rem] font-bold leading-snug tracking-tight text-transparent dark:from-sky-200 dark:via-emerald-300 dark:to-teal-200 sm:text-2xl sm:leading-tight">
          Sishu Tirtha Safe Route
        </h1>
        <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
          Sign in to track the school bus in real time
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {["Baradongal", "Arambagh", "Hooghly"].map((label, i) => (
          <Fragment key={label}>
            {i > 0 ? <CreditSep className="text-slate-300 dark:text-slate-600" /> : null}
            <span className="rounded-full border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-slate-300">
              {label}
            </span>
          </Fragment>
        ))}
      </div>

      <CardDescription className="border-t border-slate-200/70 pt-2.5 text-sm italic leading-relaxed text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:pt-3">
        The safest route for your child&apos;s journey
      </CardDescription>
    </CardHeader>
  );
};

export default LoginHeader;
