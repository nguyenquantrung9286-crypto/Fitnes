"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  date: string;
  count: number;
}

export function WorkoutActivityChart({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 140,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6B7280",
          fontSize: 13,
        }}
      >
        Нет данных
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barSize={20}>
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          tick={{ fontSize: 10, fill: "#6B7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#18181B",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            color: "#fff",
          }}
          labelStyle={{ color: "#9CA3AF" }}
          itemStyle={{ color: "#ffffff" }}
          formatter={(val) => [`${val}`, "Тренировок"]}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.count > 0 ? "#7C3AED" : "rgba(124,58,237,0.12)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
