import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Farm profile, weather connection, notification preferences and demo data controls for the AgriPulse workspace.",
  alternates: { canonical: "/settings" },
};

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
