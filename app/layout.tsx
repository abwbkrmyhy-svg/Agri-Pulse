import type { Metadata, Viewport } from "next";
import "./globals.css";
import { FarmProvider } from "@/providers/farm-provider";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AgriPulse — Precision farming & irrigation",
    template: "%s · AgriPulse",
  },
  description:
    "AgriPulse turns weather, soil and satellite data into a simple daily irrigation decision for every field.",
  applicationName: "AgriPulse",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgriPulse",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  // Chrome/Google Translate mutates text nodes in place and breaks React
  // hydration. Keep the DOM stable; localisation belongs in a real locale.
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  themeColor: "#082014",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const DEV_SW_CLEANUP = `
(function () {
  try {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      if (!registrations.length) return;
      Promise.all(registrations.map(function (r) { return r.unregister(); })).then(function () {
        if (window.caches) {
          caches.keys().then(function (keys) {
            keys.forEach(function (key) { caches.delete(key); });
          });
        }
        if (!sessionStorage.getItem('agripulse:sw-cleared')) {
          sessionStorage.setItem('agripulse:sw-cleared', '1');
          location.reload();
        }
      });
    });
  } catch (error) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      translate="no"
      className="notranslate"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased notranslate" suppressHydrationWarning>
        {process.env.NODE_ENV !== "production" && (
          <script dangerouslySetInnerHTML={{ __html: DEV_SW_CLEANUP }} />
        )}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
        >
          Skip to content
        </a>
        <FarmProvider>
          <AppShell>
            <div id="main">{children}</div>
          </AppShell>
        </FarmProvider>
      </body>
    </html>
  );
}
