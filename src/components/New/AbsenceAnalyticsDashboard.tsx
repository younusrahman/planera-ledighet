import { useMemo, useState } from "react";
import useFilterStore from "../../services/stores/analyticsStore";
import { useEmployees } from "../../services/hooks/useData";
import { useWorkforceCoverageAnalytics, type RiskLevel, type WorkforceCoverageAnalyticsDto } from "./useWorkforceCoverageAnalytics";
import { FilterBar } from "../Analytics/FilterBar";


type Category = {
  id: string;
  label: string;
  color?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function riskStyles(risk: RiskLevel) {
  switch (risk) {
    case "safe":
      return {
        badge: "bg-green-100 text-green-700",
        bar: "bg-green-500",
        soft: "bg-green-50 border-green-200",
      };
    case "warning":
      return {
        badge: "bg-amber-100 text-amber-700",
        bar: "bg-amber-500",
        soft: "bg-amber-50 border-amber-200",
      };
    case "critical":
      return {
        badge: "bg-red-100 text-red-700",
        bar: "bg-red-500",
        soft: "bg-red-50 border-red-200",
      };
  }
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
        {value}
      </div>
      {subtitle ? (
        <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
      Loading analytics...
    </div>
  );
}

function ErrorState() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
      Failed to load analytics.
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        riskStyles(risk).badge,
      )}
    >
      {risk}
    </span>
  );
}

function CoverageDayCard({
  date,
  absentEmployees,
  availableEmployees,
  totalEmployees,
  absenceRate,
  riskLevel,
}: WorkforceCoverageAnalyticsDto["daily"][number]) {
  const styles = riskStyles(riskLevel);

  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-gray-800">{date}</div>
        <RiskBadge risk={riskLevel} />
      </div>

      <div className="mb-2 h-2 w-full rounded-full bg-gray-100">
        <div
          className={cn("h-2 rounded-full transition-all", styles.bar)}
          style={{ width: `${Math.min(absenceRate, 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div>
          <div className="text-gray-400">Absent</div>
          <div className="font-semibold text-gray-800">{absentEmployees}</div>
        </div>
        <div>
          <div className="text-gray-400">Available</div>
          <div className="font-semibold text-gray-800">
            {availableEmployees}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Rate</div>
          <div className="font-semibold text-gray-800">
            {formatPercent(absenceRate)}
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {absentEmployees}/{totalEmployees} employees absent
      </div>
    </div>
  );
}

function CategoryBreakdown({
  items,
}: {
  items: WorkforceCoverageAnalyticsDto["byCategory"];
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (items.length === 0) {
    return <EmptyState text="No absence type data for selected period." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percent = total > 0 ? (item.count / total) * 100 : 0;

        return (
          <div key={item.categoryId}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-gray-700">{item.label}</span>
              <span className="text-gray-500">
                {item.count} · {formatPercent(percent)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamRiskTable({
  teams,
}: {
  teams: WorkforceCoverageAnalyticsDto["byTeam"];
}) {
  if (teams.length === 0) {
    return <EmptyState text="No team risk data available." />;
  }

  const sorted = [...teams].sort((a, b) => {
    const rank = { critical: 3, warning: 2, safe: 1 };
    if (rank[b.riskLevel] !== rank[a.riskLevel]) {
      return rank[b.riskLevel] - rank[a.riskLevel];
    }
    return b.peakAbsenceRate - a.peakAbsenceRate;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-3 pr-4 font-medium">Team</th>
            <th className="pb-3 pr-4 font-medium">Employees</th>
            <th className="pb-3 pr-4 font-medium">Avg absence</th>
            <th className="pb-3 pr-4 font-medium">Peak absence</th>
            <th className="pb-3 pr-4 font-medium">Critical days</th>
            <th className="pb-3 pr-4 font-medium">Lowest available</th>
            <th className="pb-3 pr-4 font-medium">Risk</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team) => (
            <tr key={team.teamId} className="border-b border-gray-100">
              <td className="py-3 pr-4 font-medium text-gray-900">
                {team.teamName}
              </td>
              <td className="py-3 pr-4 text-gray-600">{team.totalEmployees}</td>
              <td className="py-3 pr-4 text-gray-600">
                {formatPercent(team.avgAbsenceRate)}
              </td>
              <td className="py-3 pr-4 text-gray-600">
                {formatPercent(team.peakAbsenceRate)}
              </td>
              <td className="py-3 pr-4 text-gray-600">{team.criticalDays}</td>
              <td className="py-3 pr-4 text-gray-600">
                {team.lowestAvailable ?? "-"}
                {team.minRequiredWorking
                  ? ` / min ${team.minRequiredWorking}`
                  : ""}
              </td>
              <td className="py-3 pr-4">
                <RiskBadge risk={team.riskLevel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertsPanel({
  alerts,
}: {
  alerts: WorkforceCoverageAnalyticsDto["alerts"];
}) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
        No staffing alerts in selected period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => {
        const soft =
          alert.severity === "critical"
            ? "border-red-200 bg-red-50 text-red-700"
            : alert.severity === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-green-200 bg-green-50 text-green-700";

        return (
          <div
            key={`${alert.date}-${alert.teamId ?? "all"}-${index}`}
            className={cn("rounded-xl border p-3", soft)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{alert.date}</div>
              <RiskBadge risk={alert.severity} />
            </div>
            <div className="mt-1 text-sm">{alert.message}</div>
            {alert.teamName ? (
              <div className="mt-1 text-xs opacity-80">
                Team: {alert.teamName}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function HolidayFocusCard({ data }: { data: WorkforceCoverageAnalyticsDto }) {
  const critical = data.daily.filter((d) => d.riskLevel === "critical").length;
  const warning = data.daily.filter((d) => d.riskLevel === "warning").length;
  const safe = data.daily.filter((d) => d.riskLevel === "safe").length;

  return (
    <SectionCard
      title="Holiday / special period focus"
      subtitle="Quick planning view for Christmas, New Year, summer weeks, or any selected date range."
    >
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-green-50 p-4">
          <div className="text-xs font-medium text-green-700">Safe days</div>
          <div className="mt-1 text-2xl font-bold text-green-800">{safe}</div>
        </div>
        <div className="rounded-xl bg-amber-50 p-4">
          <div className="text-xs font-medium text-amber-700">Warning days</div>
          <div className="mt-1 text-2xl font-bold text-amber-800">
            {warning}
          </div>
        </div>
        <div className="rounded-xl bg-red-50 p-4">
          <div className="text-xs font-medium text-red-700">Critical days</div>
          <div className="mt-1 text-2xl font-bold text-red-800">{critical}</div>
        </div>
      </div>

      <div className="space-y-2">
        {data.daily.slice(0, 10).map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
          >
            <div>
              <div className="text-sm font-medium text-gray-800">
                {day.date}
              </div>
              <div className="text-xs text-gray-500">
                {day.availableEmployees} available / {day.totalEmployees} total
              </div>
            </div>
            <RiskBadge risk={day.riskLevel} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function buildRecommendations(data: WorkforceCoverageAnalyticsDto): string[] {
  const recommendations: string[] = [];

  if (data.totals.criticalDays > 0) {
    recommendations.push(
      `${data.totals.criticalDays} critical staffing day(s) detected. Review approvals and ensure enough employees are scheduled to work.`,
    );
  }

  if (data.totals.warningDays > 0) {
    recommendations.push(
      `${data.totals.warningDays} warning day(s) found. Consider shifting work coverage before the period starts.`,
    );
  }

  const topTeam = [...data.byTeam].sort(
    (a, b) =>
      b.criticalDays - a.criticalDays || b.peakAbsenceRate - a.peakAbsenceRate,
  )[0];

  if (topTeam) {
    recommendations.push(
      `${topTeam.teamName} is currently the most exposed team, with peak absence at ${formatPercent(
        topTeam.peakAbsenceRate,
      )}.`,
    );
  }

  const topCategory = [...data.byCategory].sort((a, b) => b.count - a.count)[0];
  if (topCategory) {
    recommendations.push(
      `${topCategory.label} is the most common absence type in the selected period.`,
    );
  }

  if (data.totals.peakAbsenceDate) {
    recommendations.push(
      `Highest absence load is on ${data.totals.peakAbsenceDate}. This date should be checked carefully for minimum staffing.`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "No major staffing issues detected in selected period.",
    );
  }

  return recommendations;
}

function RecommendationsPanel({
  data,
}: {
  data: WorkforceCoverageAnalyticsDto;
}) {
  const recommendations = buildRecommendations(data);

  return (
    <SectionCard
      title="Recommendations"
      subtitle="Automatic planning insights based on the selected absence data."
    >
      <ul className="space-y-3">
        {recommendations.map((text, index) => (
          <li
            key={index}
            className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800"
          >
            {text}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function AbsenceAnalyticsDashboard({
  availableCategories,
}: {
  availableCategories: Category[];
}) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: employees = [] } = useEmployees();

  const {
    teamSelections,
    selectedCategoryIds,
    selectedStatuses,
    getSelectedEmployeeIds,
  } = useFilterStore();

  const selectedTeamIds = useMemo(
    () => teamSelections.map((t) => t.teamId),
    [teamSelections],
  );

  const selectedEmployeeIds = useMemo(
    () => getSelectedEmployeeIds(employees),
    [employees, teamSelections, getSelectedEmployeeIds],
  );

  const categoryIds = useMemo(() => {
    return selectedCategoryIds.includes("ALL") ? [] : selectedCategoryIds;
  }, [selectedCategoryIds]);

  const statuses = selectedStatuses;

  const { data, isLoading, error } = useWorkforceCoverageAnalytics({
    start: startDate,
    end: endDate,
    teamIds: selectedTeamIds,
    employeeIds: selectedEmployeeIds,
    categoryIds,
    statuses,
  });

  return (
    <div className="space-y-6">
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        availableCategories={availableCategories}
      />

      {!startDate || !endDate ? (
        <EmptyState text="Choose a date range to view absence analytics and staffing risk." />
      ) : null}

      {startDate && endDate && isLoading ? <LoadingState /> : null}
      {startDate && endDate && error ? <ErrorState /> : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard
              title="Total absences"
              value={data.totals.totalAbsenceRequests}
            />
            <StatCard title="Approved" value={data.totals.approvedAbsences} />
            <StatCard
              title="Employees affected"
              value={data.totals.distinctEmployeesAbsent}
            />
            <StatCard title="Avg / day" value={data.totals.avgDailyAbsences} />
            <StatCard title="Critical days" value={data.totals.criticalDays} />
            <StatCard
              title="Peak day"
              value={data.totals.peakAbsenceDate || "-"}
              subtitle={
                data.totals.peakAbsenceDate
                  ? `${data.totals.peakAbsenceCount} absent`
                  : undefined
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <SectionCard
                title="Daily staffing risk"
                subtitle="Shows which days are safe, warning, or critical based on current absence load."
              >
                {data.daily.length === 0 ? (
                  <EmptyState text="No daily staffing data found." />
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
                    {data.daily.map((day) => (
                      <CoverageDayCard key={day.date} {...day} />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <SectionCard
              title="Critical alerts"
              subtitle="Fast overview of dates and teams that may be under-staffed."
            >
              <AlertsPanel alerts={data.alerts} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard
              title="Team risk overview"
              subtitle="Compare teams to quickly see where staffing pressure is highest."
            >
              <TeamRiskTable teams={data.byTeam} />
            </SectionCard>

            <SectionCard
              title="Absence type breakdown"
              subtitle="Understand which absence categories drive staffing load."
            >
              <CategoryBreakdown items={data.byCategory} />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <HolidayFocusCard data={data} />
            <RecommendationsPanel data={data} />
          </div>
        </>
      ) : null}
    </div>
  );
}
