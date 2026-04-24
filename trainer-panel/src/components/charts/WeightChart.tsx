"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  weight: number;
}

export function WeightChart({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6B7280",
          fontSize: 13,
        }}
      >
        Нет данных о весе
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#6B7280"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          domain={["auto", "auto"]}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181B",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            color: "#fff",
          }}
          labelStyle={{ color: "#9CA3AF" }}
          itemStyle={{ color: "#ffffff" }}
          formatter={(val) => [`${val} кг`, "Вес"]}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#7C3AED"
          strokeWidth={2}
          dot={{ fill: "#7C3AED", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#A78BFA" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
