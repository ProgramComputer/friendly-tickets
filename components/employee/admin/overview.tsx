"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const data = [
  {
    name: "Mobile",
    total: 94,
    resolved: 85,
  },
  {
    name: "Web",
    total: 78,
    resolved: 70,
  },
  {
    name: "API",
    total: 56,
    resolved: 49,
  },
  {
    name: "Enterprise",
    total: 45,
    resolved: 42,
  },
  {
    name: "Billing",
    total: 34,
    resolved: 31,
  },
  {
    name: "Security",
    total: 23,
    resolved: 21,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
        <Bar
          dataKey="resolved"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary/30"
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 