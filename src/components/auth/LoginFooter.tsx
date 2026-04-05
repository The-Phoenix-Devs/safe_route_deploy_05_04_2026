import React from "react";
import { CreditSep } from "@/components/ui/CreditSep";

/** Shared footer for auth screens (login gradient + admin login). */
const LoginFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full max-w-[28rem] rounded-2xl border border-white/20 bg-gradient-to-b from-white/12 to-white/5 px-5 py-3.5 text-center shadow-lg shadow-slate-950/30 backdrop-blur-xl dark:border-white/10 dark:from-white/8 dark:to-white/[0.03]"
      role="contentinfo"
    >
      <p className="text-xs font-semibold tracking-wide text-white/95 sm:text-sm">
        Sishu Tirtha
        <CreditSep className="text-emerald-300/80" />
        Safe Route
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-white/75 sm:text-xs">
        © {year}
        <CreditSep className="text-white/55" />
        Crafted by <span className="text-white/85">The Phoenix Devs</span>
        <CreditSep className="text-white/55" />
        <span className="text-white/85">Subhankar Ghorui</span>
      </p>
    </footer>
  );
};

export default LoginFooter;
