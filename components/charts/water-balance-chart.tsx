"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BalancePoint } from "@/lib/et";
import { formatDate } from "@/lib/format";

type Row = BalancePoint & { label: string };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-[#e3e6dd] bg-white/95 px-3 py-2 shadow-lift backdrop-blur">
      <p className="text-[11px] font-semibold text-ink">{formatDate(row.date, { day: "numeric", month: "short", weekday: "short" })}</p>
      <dl className="mt-1.5 space-y-0.5 text-[10px]">
        <div className="flex justify-between gap-4">
          <dt className="text-[#5b6b61]">Root-zone depletion</dt>
          <dd className="font-semibold text-canopy-800">{row.depletionMm.toFixed(1)} mm</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#5b6b61]">Refill threshold (RAW)</dt>
          <dd className="font-semibold text-amber-700">{row.raw.toFixed(1)} mm</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#5b6b61]">Crop ET</dt>
          <dd className="font-semibold text-ink">{row.etc.toFixed(1)} mm</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-[#5b6b61]">Rain</dt>
          <dd className="font-semibold text-sky-700">{row.precip.toFixed(1)} mm</dd>
        </div>
      </dl>
    </div>
  );
}

export function WaterBalanceChart({ points }: { points: BalancePoint[] }) {
  const rows: Row[] = points.map((p) => ({ ...p, label: formatDate(p.date) }));
  const taw = points[0]?.taw ?? 100;

  return (
    <div className="h-[236px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="depletionFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#358d51" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#358d51" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef0e9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#5b6b61" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            yAxisId="water"
            domain={[0, Math.ceil(taw / 20) * 20]}
            tick={{ fontSize: 10, fill: "#5b6b61" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <YAxis yAxisId="rain" orientation="right" hide domain={[0, 30]} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#c3ccbf", strokeDasharray: "3 3" }} />
          <Bar yAxisId="rain" dataKey="precip" fill="#bae0f0" radius={[3, 3, 0, 0]} barSize={14} isAnimationActive={false} />
          <ReferenceLine
            yAxisId="water"
            y={points[0]?.raw ?? 0}
            stroke="#d97706"
            strokeDasharray="4 4"
            strokeWidth={1.2}
            label={{ value: "RAW", position: "insideTopRight", fontSize: 9, fill: "#b45309" }}
          />
          <Area
            yAxisId="water"
            type="monotone"
            dataKey="depletionMm"
            stroke="#24713e"
            strokeWidth={2.2}
            fill="url(#depletionFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
            isAnimationActive={false}
          />
          <Line
            yAxisId="water"
            type="monotone"
            dataKey="taw"
            stroke="#c3ccbf"
            strokeWidth={1}
            strokeDasharray="2 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WaterBalanceLegend() {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-[#5b6b61]">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-canopy-600" /> Root-zone depletion
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-[2px] w-4 border-t-2 border-dashed border-amber-500" /> Refill threshold
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-sm bg-sky-200" /> Rainfall
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-[2px] w-4 border-t border-dashed border-[#c3ccbf]" /> TAW
      </span>
    </div>
  );
}
