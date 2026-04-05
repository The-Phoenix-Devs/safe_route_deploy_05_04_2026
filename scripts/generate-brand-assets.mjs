/**
 * Builds PWA / Next / Capacitor raster assets from the official logo PNG when present,
 * otherwise from resources/app-icon.svg.
 *
 * Official logo (commit this file): public/lovable-uploads/5660de73-133f-4d61-aa57-08b2be7b455d.png
 *
 * Run: npm run icons:generate
 * Then (Android): npm run cap:assets:android
 */
import sharp from "sharp";
import { mkdirSync, readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const BRAND_PNG = join(
  root,
  "public",
  "lovable-uploads",
  "5660de73-133f-4d61-aa57-08b2be7b455d.png",
);
const svgPath = join(root, "resources", "app-icon.svg");

/** Splash when using Sishutirtha logo (navy ~#1B4174) */
const SPLASH_BG_BRAND = { r: 27, g: 65, b: 116 };
const SPLASH_BG_DEFAULT = { r: 15, g: 23, b: 42 };

function resolveSource() {
  if (existsSync(BRAND_PNG)) {
    return { kind: "png", path: BRAND_PNG, splashBg: SPLASH_BG_BRAND };
  }
  return {
    kind: "svg",
    path: svgPath,
    splashBg: SPLASH_BG_DEFAULT,
  };
}

async function rasterize(source, size, outPath) {
  const base =
    source.kind === "png"
      ? sharp(source.path)
      : sharp(readFileSync(source.path), { density: 400 });
  await base
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
}

async function main() {
  const source = resolveSource();
  if (source.kind === "svg" && !existsSync(source.path)) {
    console.error("Missing brand PNG and missing", source.path);
    process.exit(1);
  }

  const publicDir = join(root, "public");
  const assetsDir = join(root, "assets");
  mkdirSync(assetsDir, { recursive: true });

  await rasterize(source, 32, join(publicDir, "favicon-32x32.png"));
  await rasterize(source, 180, join(publicDir, "apple-touch-icon.png"));
  await rasterize(source, 192, join(publicDir, "icon-192.png"));
  await rasterize(source, 512, join(publicDir, "icon-512.png"));

  await rasterize(source, 1024, join(assetsDir, "icon.png"));

  const splashW = 2732;
  const splashH = 2732;
  const logoSize = 720;
  const logoBase =
    source.kind === "png"
      ? sharp(source.path)
      : sharp(readFileSync(source.path), { density: 400 });
  const logoBuf = await logoBase
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: splashW,
      height: splashH,
      channels: 3,
      background: source.splashBg,
    },
  })
    .composite([{ input: logoBuf, gravity: "center" }])
    .png()
    .toFile(join(assetsDir, "splash.png"));

  console.log(
    `Brand assets from ${source.kind === "png" ? "public/lovable-uploads/5660de73-…png" : "resources/app-icon.svg"} → public/* (favicon/PWA helpers), assets/* (Capacitor)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
