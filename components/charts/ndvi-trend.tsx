"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type NdviPoint = { label: string; ndvi: number; farm: number };

export function NdviTrendChart({ data }: { data: NdviPoint[] }) {
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -26, bottom: 0 }}>
          <defs>
            <linearGradient id="ndviFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84c341" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#84c341" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef0e9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#5b6b61" }} axisLine={false} tickLine={false} dy={5} />
          <YAxis domain={[0.2, 1]} tick={{ fontSize: 9, fill: "#5b6b61" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #e3e6dd",
              fontSize: 11,
              boxShadow: "0 18px 40px -18px rgba(13,27,20,.3)",
            }}
            formatter={(value, name) => [
              Number(value).toFixed(2),
              name === "ndvi" ? "This plot" : "Farm average",
            ]}
          />
          <ReferenceLine y={0.6} stroke="#d97706" strokeDasharray="3 4" strokeWidth={1} />
          <Area type="monotone" dataKey="ndvi" stroke="#358d51" strokeWidth={2.2} fill="url(#ndviFill)" dot={{ r: 2, fill: "#358d51" }} isAnimationActive={false} />
          <Area
            type="monotone"
            dataKey="farm"
            stroke="#66756a"
            strokeWidth={1.4}
            strokeDasharray="4 4"
            fill="transparent"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
