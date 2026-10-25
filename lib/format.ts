import type { MoistureStatus } from "./types";

export { formatArea } from "./geo";

export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
): string {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function formatDateLong(iso: string): string {
  return formatDate(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatWeekday(iso: string): string {
  return formatDate(iso, { weekday: "short" });
}

export function formatNumber(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export const STATUS_META: Record<
  MoistureStatus,
  { label: string; text: string; bg: string; dot: string; ring: string }
> = {
  optimal: {
    label: "Optimal",
    text: "text-canopy-700",
    bg: "bg-canopy-100",
    dot: "bg-canopy-500",
    ring: "ring-canopy-200",
  },
  attention: {
    label: "Attention",
    text: "text-amber-700",
    bg: "bg-amber-100",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  critical: {
    label: "Action needed",
    text: "text-red-700",
    bg: "bg-red-100",
    dot: "bg-red-500",
    ring: "ring-red-200",
  },
};

export function moisturePct(
  moisture: number,
  wilting: number,
  fieldCapacity: number,
): number {
  return Math.round(
    Math.min(
      100,
      Math.max(0, ((moisture - wilting) / (fieldCapacity - wilting)) * 100),
    ),
  );
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function severityMeta(severity: "critical" | "warning" | "info") {
  switch (severity) {
    case "critical":
      return { label: "Critical", cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" };
    case "warning":
      return { label: "Warning", cls: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" };
    default:
      return { label: "Info", cls: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" };
  }
}
