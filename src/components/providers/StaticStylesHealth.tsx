"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";

const STORAGE_KEY = "sishu_hide_styles_help";

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483646,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: "rgba(15, 23, 42, 0.97)",
  color: "#e2e8f0",
  textAlign: "left",
  fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
};

const panel: CSSProperties = {
  maxWidth: "32rem",
  borderRadius: "1rem",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "#020617",
  padding: "1.5rem",
  boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
};

const code: CSSProperties = {
  fontFamily: "ui-monospace, monospace",
  fontSize: "0.75rem",
  padding: "0.125rem 0.35rem",
  borderRadius: "0.25rem",
  background: "rgba(255,255,255,0.1)",
};

const btn: CSSProperties = {
  marginTop: "1.5rem",
  width: "100%",
  border: "none",
  borderRadius: "0.75rem",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  cursor: "pointer",
  background: "#2563eb",
  color: "#fff",
};

/**
 * Detects missing Tailwind/global CSS and shows instructions (inline-styled so it still works).
 */
export function StaticStylesHealth() {
  const [broken, setBroken] = useState(false);

  useLayoutEffect(() => {
    try {
      if (typeof window === "undefined" || sessionStorage.getItem(STORAGE_KEY) === "1") {
        return;
      }
    } catch {
      /* ignore */
    }

    const marker = getComputedStyle(document.documentElement)
      .getPropertyValue("--sishu-styles-loaded")
      .trim();
    if (!marker) {
      setBroken(true);
      return;
    }

    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.className = "opacity-0 fixed left-0 top-0 -z-50 h-px w-px pointer-events-none";
    document.body.appendChild(el);
    const opacity = getComputedStyle(el).opacity;
    document.body.removeChild(el);

    if (opacity !== "0") {
      setBroken(true);
    }
  }, []);

  if (!broken) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setBroken(false);
  };

  return (
    <div role="alert" style={overlay}>
      <div style={panel}>
        <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>
          App styles did not load
        </h2>
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "#cbd5e1" }}>
          CSS from <span style={code}>/_next/static/</span> is missing. The app must be served from the
          build output root (not opened as a raw file).
        </p>
        <ul
          style={{
            margin: "1rem 0 0",
            paddingLeft: "1.25rem",
            fontSize: "0.875rem",
            lineHeight: 1.7,
            color: "#cbd5e1",
          }}
        >
          <li style={{ marginBottom: "0.5rem" }}>
            Dev: <span style={code}>npm run dev</span> or <span style={code}>npm run dev:8080</span> (Next must serve
            the app — not a raw <span style={code}>out/</span> folder unless you ran{" "}
            <span style={code}>build:static</span> + <span style={code}>preview:static</span>).
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Production: <span style={code}>npm run build</span> then{" "}
            <span style={code}>npm run start</span> (Next serves <span style={code}>/_next/static</span>).
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Static folder only: <span style={code}>npm run build:static</span> then{" "}
            <span style={code}>npm run preview:static</span>
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            Subpath hosting: set <span style={code}>NEXT_PUBLIC_BASE_PATH</span> before build (see{" "}
            <span style={code}>next.config.mjs</span>).
          </li>
          <li>
            Capacitor: use packaged <span style={code}>out</span>; optional{" "}
            <span style={code}>CAPACITOR_LIVE_RELOAD_URL</span> for live reload only.
          </li>
        </ul>
        <button type="button" style={btn} onClick={dismiss}>
          Dismiss for this session
        </button>
      </div>
    </div>
  );
}
