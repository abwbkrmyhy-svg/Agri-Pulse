import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop health",
  description:
    "NDVI vigour, soil moisture, sap and salinity tests with explicit agronomic warning flags for every field.",
  alternates: { canonical: "/health" },
};

export default function HealthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
