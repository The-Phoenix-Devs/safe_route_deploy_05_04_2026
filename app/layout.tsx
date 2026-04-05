import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppProvidersLazy } from "@/components/providers/AppProvidersLazy";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://saferoute.sishutirtha.co.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Sishu Tirtha Safe Route",
  description: "Real-time school transport tracking for parents and administrators",
  authors: [{ name: "The Phoenix Devs" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/lovable-uploads/5660de73-133f-4d61-aa57-08b2be7b455d.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/lovable-uploads/5660de73-133f-4d61-aa57-08b2be7b455d.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Safe Route",
  },
  openGraph: {
    title: "Sishu Tirtha Safe Route",
    description: "Real-time school transport tracking for parents and administrators",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *,*::before,*::after{box-sizing:border-box}
              .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}
            `,
          }}
        />
        <AppProvidersLazy>{children}</AppProvidersLazy>
      </body>
    </html>
  );
}
