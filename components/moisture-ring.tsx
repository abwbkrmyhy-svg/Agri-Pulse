import { cx } from "@/lib/format";
import type { MoistureStatus } from "@/lib/types";

const STROKE: Record<MoistureStatus, string> = {
  optimal: "#358d51",
  attention: "#d97706",
  critical: "#dc2626",
};

const TRACK: Record<MoistureStatus, string> = {
  optimal: "#dcefdf",
  attention: "#fde8c6",
  critical: "#fbd5d5",
};

export function MoistureRing({
  value,
  status,
  size = 76,
  label,
  className,
}: {
  /** 0–100 % of usable water */
  value: number;
  status: MoistureStatus;
  size?: number;
  label?: string;
  className?: string;
}) {
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div
      className={cx("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(value)} percent usable soil water — ${status}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={TRACK[status]} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={STROKE[status]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[17px] font-semibold leading-none text-ink">
          {Math.round(value)}
          <span className="text-[10px] font-medium text-[#5b6b61]">%</span>
        </span>
        <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-[#5f6e64]">
          {label ?? "usable"}
        </span>
      </div>
    </div>
  );
}
