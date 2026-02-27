import { AbsenceByEmployeeChart } from "./Recharts/AbsenceByEmployeeChart";
import { AbsenceByTypeChart } from "./Recharts/AbsenceByTypeChart";
import { AbsenceTrendChart } from "./Recharts/AbsenceTrendChart";


export function AnalyticsDashboard() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Absence Overview</h2>

      <div style={{ display: "flex", gap: 32 }}>
        <AbsenceByTypeChart />
        <AbsenceByEmployeeChart />
      </div>

      <h2 style={{ marginTop: 40 }}>Monthly Trend</h2>
      <AbsenceTrendChart />
    </div>
  );
}
