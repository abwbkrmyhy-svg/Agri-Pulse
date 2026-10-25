import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cx } from "@/lib/format";

type Tone = "green" | "blue" | "amber" | "red" | "neutral";

const TONES: Record<Tone, { bg: string; icon: string; line: string }> = {
  green: { bg: "bg-canopy-50", icon: "text-canopy-700", line: "#358d51" },
  blue: { bg: "bg-sky-50", icon: "text-sky-600", line: "#2d8fbf" },
  amber: { bg: "bg-amber-50", icon: "text-amber-700", line: "#d97706" },
  red: { bg: "bg-red-50", icon: "text-red-700", line: "#dc2626" },
  neutral: { bg: "bg-sand-100", icon: "text-[#5b6b61]", line: "#5f6e64" },
};

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / span) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-8 w-[88px]" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "green",
  delta,
  deltaLabel,
  sub,
  spark,
  href,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: number;
  deltaLabel?: string;
  sub?: string;
  spark?: number[];
  href?: string;
}) {
  const t = TONES[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", t.bg, t.icon)}>
          <Icon size={17} strokeWidth={2} />
        </span>
        {typeof delta === "number" ? (
          <span
            className={cx(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold",
              delta >= 0 ? "bg-canopy-50 text-canopy-700" : "bg-red-50 text-red-700",
            )}
          >
            {delta >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(delta)}%
          </span>
        ) : spark ? (
          <Sparkline data={spark} color={t.line} />
        ) : null}
      </div>

      <p className="mt-3 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] text-ink">
        {value}
        {unit && <span className="ml-1 text-[12px] font-medium text-[#5b6b61]">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[11px] font-medium text-[#5b6b61]">{label}</p>
      {(deltaLabel || sub) && (
        <p className="mt-2 truncate text-[10px] text-[#5f6e64]">{deltaLabel ?? sub}</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="card card-pad block min-w-0 transition hover:-translate-y-0.5 hover:shadow-lift">
        {body}
      </Link>
    );
  }
  return <div className="card card-pad min-w-0">{body}</div>;
}
