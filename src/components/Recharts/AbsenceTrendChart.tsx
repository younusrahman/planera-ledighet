// src/domains/analytics/charts/AbsenceTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useTrends } from "../../services/analytics/hooks";


export function AbsenceTrendChart() {
  const { data = [] } = useTrends();

  const chartData = data.map(t => ({
    name: `${t.year}-${String(t.month).padStart(2, "0")}`,
    totalDays: t.totalDays,
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="totalDays" stroke="#82ca9d" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}
