"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { TASKS } from "@/lib/data";
import { useFarm } from "@/providers/farm-provider";
import { cx } from "@/lib/format";

const PRIORITY: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-canopy-50 text-canopy-700",
};

export function TaskList() {
  const { doneTasks, toggleTask } = useFarm();
  const visible = TASKS.slice(0, 4);
  const remaining = TASKS.filter((t) => !doneTasks.includes(t.id)).length;

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#eef0e9] px-5 py-4">
        <div>
          <p className="eyebrow">Field work</p>
          <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
            This week
          </h2>
        </div>
        <span className="chip bg-sand-100 text-[#415047]">{remaining} open</span>
      </div>
      <ul className="divide-soft">
        {visible.map((task) => {
          const done = doneTasks.includes(task.id);
          return (
            <li key={task.id} className="flex items-start gap-3 px-5 py-3">
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                aria-pressed={done}
                aria-label={`${done ? "Reopen" : "Complete"} ${task.title}`}
                className={cx(
                  "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition",
                  done
                    ? "border-canopy-600 bg-canopy-600 text-white"
                    : "border-[#cbd5c8] bg-white hover:border-canopy-500",
                )}
              >
                {done && <Check size={11} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cx(
                    "truncate text-[12px] font-medium leading-snug",
                    done ? "text-[#5f6e64] line-through" : "text-ink",
                  )}
                >
                  {task.title}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-[#5b6b61]">
                  {task.detail} · {task.time}
                </p>
              </div>
              <span className={cx("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY[task.priority])} />
            </li>
          );
        })}
      </ul>
      <Link
        href="/fields"
        className="flex items-center justify-center gap-1 border-t border-[#eef0e9] py-2.5 text-[11px] font-semibold text-canopy-700 hover:bg-canopy-50"
      >
        Field operations <ArrowRight size={12} />
      </Link>
    </section>
  );
}
