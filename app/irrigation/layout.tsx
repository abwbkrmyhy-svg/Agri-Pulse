import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Irrigation planner",
  description:
    "FAO-56 water balance, crop coefficients and a per-plot irrigation recommendation with volume, runtime and energy estimates.",
  alternates: { canonical: "/irrigation" },
};

export default function IrrigationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
