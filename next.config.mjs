/** @type {import('next').NextConfig} */
const rawBase =
  process.env.NEXT_BASE_PATH?.trim() ||
  process.env.NEXT_PUBLIC_BASE_PATH?.trim() ||
  "";
const basePath =
  !rawBase || rawBase === "/"
    ? undefined
    : (rawBase.startsWith("/") ? rawBase : `/${rawBase}`).replace(/\/$/, "") || undefined;

/** CDN or alternate origin for /_next/static (rare); must match deployment. */
const assetPrefixRaw = process.env.NEXT_PUBLIC_ASSET_PREFIX?.trim();
const assetPrefix = assetPrefixRaw && assetPrefixRaw !== "/" ? assetPrefixRaw.replace(/\/$/, "") : undefined;

/**
 * Static HTML export is **opt-in** (`NEXT_STATIC_EXPORT=1`). Use it only for Capacitor `webDir`
 * (`npm run build:static`) or static hosting of `out/`.
 *
 * Default `next build` produces a normal `.next` app so `next start` serves `/_next/static/*`
 * correctly. Always exporting caused broken styling when people ran `next start` or another
 * server that expected a Node Next app instead of the `out/` folder.
 */
const staticExport =
  process.env.NEXT_STATIC_EXPORT === "1" ||
  process.env.NEXT_STATIC_EXPORT === "true";

const nextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: "export" } : {}),
  ...(basePath ? { basePath } : {}),
  ...(assetPrefix ? { assetPrefix } : {}),
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.output.chunkLoadTimeout = 120000;
    }
    return config;
  },
};

export default nextConfig;
