import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useAbsenceTypes } from "../../services/analytics/hooks";

export function AbsenceByTypeChart() {
  const { data, isLoading, error } = useAbsenceTypes();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load analytics</div>;
  if (!Array.isArray(data)) return <div>No data</div>;

  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        dataKey="totalDays"
        nameKey="absenceType"
        cx="50%"
        cy="50%"
        outerRadius={120}
        label
      >
        {data.map((item, i) => (
          <Cell key={i} fill={item.color} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
