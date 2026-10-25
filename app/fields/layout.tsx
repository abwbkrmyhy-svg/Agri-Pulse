import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fields",
  description:
    "Map every plot with geodesic boundaries, soil type, irrigation system and live usable-water status across the farm.",
  alternates: { canonical: "/fields" },
};

export default function FieldsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
