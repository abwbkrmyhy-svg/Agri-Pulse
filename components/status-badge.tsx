import type { MoistureStatus } from "@/lib/types";
import { STATUS_META, cx } from "@/lib/format";

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: MoistureStatus;
  label?: string;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <span className={cx("chip ring-1 ring-inset", meta.bg, meta.text, meta.ring, className)}>
      <span className={cx("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {label ?? meta.label}
    </span>
  );
}

export function Dot({ className }: { className?: string }) {
  return <span className={cx("inline-block h-1.5 w-1.5 rounded-full", className)} />;
}
