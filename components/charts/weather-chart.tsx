"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeatherDay } from "@/lib/types";
import { formatWeekday } from "@/lib/format";

export function WeatherChart({ days }: { days: WeatherDay[] }) {
  const rows = days.map((d) => ({
    ...d,
    label: formatWeekday(d.date),
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 12, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#eef0e9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#5b6b61" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            yAxisId="temp"
            domain={[8, 34]}
            ticks={[8, 16, 24, 32]}
            tick={{ fontSize: 10, fill: "#5b6b61" }}
            axisLine={false}
            tickLine={false}
            width={40}
            unit="°"
          />
          <YAxis yAxisId="rain" orientation="right" hide domain={[0, 20]} />
          <Tooltip
            cursor={{ stroke: "#c3ccbf", strokeDasharray: "3 3" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e3e6dd",
              fontSize: 11,
              boxShadow: "0 18px 40px -18px rgba(13,27,20,.3)",
            }}
            formatter={(value, name) => {
              const labels: Record<string, string> = {
                tMax: "High",
                tMin: "Low",
                precip: "Rain",
              };
              return [`${value}${name === "precip" ? " mm" : "°C"}`, labels[String(name)] ?? name];
            }}
          />
          <Bar yAxisId="rain" dataKey="precip" fill="#bae0f0" radius={[3, 3, 0, 0]} barSize={16} isAnimationActive={false} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="tMax"
            stroke="#c2712f"
            strokeWidth={2.4}
            dot={{ r: 2.5, fill: "#c2712f", strokeWidth: 0 }}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="tMin"
            stroke="#2d8fbf"
            strokeWidth={2}
            dot={{ r: 2.5, fill: "#2d8fbf", strokeWidth: 0 }}
            activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
