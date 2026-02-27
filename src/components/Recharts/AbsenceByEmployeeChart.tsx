// src/domains/analytics/charts/AbsenceByEmployeeChart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useEmployeeAnalytics } from "../../services/analytics/hooks";

export function AbsenceByEmployeeChart() {
  const { data = [] } = useEmployeeAnalytics();

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="employeeName" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="totalDays" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
