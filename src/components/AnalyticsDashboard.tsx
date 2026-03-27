import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  useEmployees,
  useTeams,
  useAbsenceCategories,
} from "../services/hooks/useData";
import { absence } from "../services/stores/absenceDataStore";
import useFilterStore from "../services/stores/analyticsStore";

dayjs.extend(weekOfYear);

type ViewMode = "daily" | "weekly" | "monthly";
type RiskLevel = "safe" | "warning" | "critical";

type HolidayItem = {
  date: string;
  name: string;
};

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const riskColors: Record<RiskLevel, string> = {
  safe: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
};

const CHART_HEIGHT = 340;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function enumerateDays(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(start);
  const endDate = new Date(end);

  current.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    result.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function overlapsDay(start: string, end: string, day: string) {
  const s = new Date(start);
  const e = new Date(end);
  const d = new Date(day);

  s.setHours(0, 0, 0, 0);
  e.setHours(23, 59, 59, 999);
  d.setHours(12, 0, 0, 0);

  return s <= d && e >= d;
}

function getOverlapDays(
  filterStart: Date,
  filterEnd: Date,
  absenceStart: Date,
  absenceEnd: Date,
): number {
  const s = absenceStart < filterStart ? filterStart : absenceStart;
  const e = absenceEnd < filterEnd ? absenceEnd : filterEnd;
  if (s > e) return 0;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getRiskLevel(rate: number): RiskLevel {
  if (rate >= 50) return "critical";
  if (rate >= 35) return "warning";
  return "safe";
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

function getSwedishLikeHolidaysForYears(
  start: string,
  end: string,
): HolidayItem[] {
  const startYear = new Date(start).getFullYear();
  const endYear = new Date(end).getFullYear();
  const result: HolidayItem[] = [];

  for (let year = startYear; year <= endYear; year++) {
    result.push(
      { date: `${year}-01-06`, name: "Trettondedag jul" },
      { date: `${year}-05-01`, name: "Första maj" },
      { date: `${year}-06-21`, name: "Midsommarafton" },
      { date: `${year}-12-24`, name: "Julafton" },
      { date: `${year}-12-25`, name: "Juldagen" },
      { date: `${year}-12-26`, name: "Annandag jul" },
      { date: `${year}-12-31`, name: "Nyårsafton" },
      { date: `${year + 1}-01-01`, name: "Nyårsdagen" },
    );
  }

  return result
    .filter((h) => h.date >= start && h.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function StatCard({
  title,
  value,
  subtitle,
  tone = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: "blue" | "green" | "amber" | "red" | "purple";
}) {
  const tones = {
    blue: "border-blue-200 bg-blue-50/50",
    green: "border-green-200 bg-green-50/50",
    amber: "border-amber-200 bg-amber-50/50",
    red: "border-red-200 bg-red-50/50",
    purple: "border-purple-200 bg-purple-50/50",
  };

  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", tones[tone])}>
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
      {subtitle ? (
        <div className="mt-1 text-xs text-gray-500">{subtitle}</div>
      ) : null}
    </div>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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

function Badge({ risk }: { risk: RiskLevel }) {
  const classes = {
    safe: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    critical: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        classes[risk],
      )}
    >
      {risk}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
      {text}
    </div>
  );
}

function ScrollArea({
  children,
  maxHeight = "max-h-[420px]",
}: {
  children: React.ReactNode;
  maxHeight?: string;
}) {
  return (
    <div className={cn("overflow-y-auto pr-1", maxHeight)}>{children}</div>
  );
}

export function AbsenceAnalyticsDashboard({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data: employees = [] } = useEmployees();
  const { data: teams = [] } = useTeams();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();

  const {
    teamSelections,
    selectedStatuses,
    selectedCategoryIds,
    getSelectedEmployeeIds,
  } = useFilterStore();

  const [trendMode, setTrendMode] = useState<ViewMode>("monthly");
  const [selectedHoliday, setSelectedHoliday] = useState<string>("");
  const [selectedHolidayTeam, setSelectedHolidayTeam] = useState<string>("");

  const analytics = useMemo(() => {
    if (!startDate || !endDate) return null;

    const selectedEmployeeIds =
      teamSelections.length === 0
        ? employees.map((e) => e.id)
        : getSelectedEmployeeIds(employees);

    const activeCategoryIds = selectedCategoryIds.includes("ALL")
      ? categories.map((c) => c.id)
      : selectedCategoryIds;

    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    const filteredAbsences = absences.filter((abs) => {
      if (!selectedEmployeeIds.includes(abs.employeeId)) return false;
      if (!selectedStatuses.includes(abs.status)) return false;
      if (!activeCategoryIds.includes(abs.absenceCategoryId)) return false;

      const absStart = new Date(abs.startDate);
      const absEnd = new Date(abs.endDate);
      absStart.setHours(0, 0, 0, 0);
      absEnd.setHours(23, 59, 59, 999);

      return absStart <= rangeEnd && absEnd >= rangeStart;
    });

    const days = enumerateDays(startDate, endDate);

    const dailyData = days.map((day) => {
      const absentIds = new Set(
        filteredAbsences
          .filter((abs) => overlapsDay(abs.startDate, abs.endDate, day))
          .map((abs) => abs.employeeId),
      );

      const totalEmployees = selectedEmployeeIds.length;
      const absentEmployees = absentIds.size;
      const availableEmployees = Math.max(0, totalEmployees - absentEmployees);
      const absenceRate =
        totalEmployees > 0 ? (absentEmployees / totalEmployees) * 100 : 0;
      const riskLevel = getRiskLevel(absenceRate);

      return {
        date: day,
        shortDate: dayjs(day).format("DD MMM"),
        totalEmployees,
        absentEmployees,
        availableEmployees,
        absenceRate,
        riskLevel,
      };
    });

    const byCategory = categories
      .map((cat) => {
        const matching = filteredAbsences.filter(
          (abs) => abs.absenceCategoryId === cat.id,
        );

        const totalDays = matching.reduce((sum, abs) => {
          const overlap = getOverlapDays(
            rangeStart,
            rangeEnd,
            new Date(abs.startDate),
            new Date(abs.endDate),
          );
          return sum + overlap;
        }, 0);

        const employeeCount = new Set(matching.map((m) => m.employeeId)).size;

        return {
          categoryId: cat.id,
          label: cat.label,
          color: cat.color || "#94a3b8",
          count: matching.length,
          totalDays,
          employeeCount,
          avgDuration:
            matching.length > 0 ? Math.round(totalDays / matching.length) : 0,
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.totalDays - a.totalDays);

    const selectedTeamIds =
      teamSelections.length === 0
        ? teams.map((t) => t.id)
        : teamSelections.map((t) => t.teamId);

    const byTeam = teams
      .filter((team) => selectedTeamIds.includes(team.id))
      .map((team) => {
        const teamEmployees = employees.filter(
          (e) => e.teamId === team.id && selectedEmployeeIds.includes(e.id),
        );

        const teamDaily = days.map((day) => {
          const absentIds = new Set(
            filteredAbsences
              .filter(
                (abs) =>
                  teamEmployees.some((e) => e.id === abs.employeeId) &&
                  overlapsDay(abs.startDate, abs.endDate, day),
              )
              .map((abs) => abs.employeeId),
          );

          const total = teamEmployees.length;
          const absent = absentIds.size;
          const available = Math.max(0, total - absent);
          const rate = total > 0 ? (absent / total) * 100 : 0;
          return { total, absent, available, rate, risk: getRiskLevel(rate) };
        });

        const avgAbsenceRate =
          teamDaily.length > 0
            ? teamDaily.reduce((sum, d) => sum + d.rate, 0) / teamDaily.length
            : 0;

        const peakAbsenceRate =
          teamDaily.length > 0 ? Math.max(...teamDaily.map((d) => d.rate)) : 0;

        const criticalDays = teamDaily.filter(
          (d) => d.risk === "critical",
        ).length;
        const warningDays = teamDaily.filter(
          (d) => d.risk === "warning",
        ).length;
        const lowestAvailable =
          teamDaily.length > 0
            ? Math.min(...teamDaily.map((d) => d.available))
            : 0;

        const riskLevel: RiskLevel =
          criticalDays > 0 ? "critical" : warningDays > 0 ? "warning" : "safe";

        return {
          teamId: team.id,
          teamName: team.name,
          totalEmployees: teamEmployees.length,
          avgAbsenceRate,
          peakAbsenceRate,
          criticalDays,
          warningDays,
          lowestAvailable,
          riskLevel,
        };
      })
      .filter((team) => team.totalEmployees > 0)
      .sort((a, b) => b.peakAbsenceRate - a.peakAbsenceRate);

    const trendMap: Record<
      string,
      { date: string; count: number; days: number }
    > = {};

    filteredAbsences.forEach((abs) => {
      const start = dayjs(abs.startDate);
      const end = dayjs(abs.endDate);
      let current = start;

      while (current.isBefore(end) || current.isSame(end, "day")) {
        if (
          current.isBefore(dayjs(startDate)) ||
          current.isAfter(dayjs(endDate))
        ) {
          current = current.add(1, "day");
          continue;
        }

        const key =
          trendMode === "daily"
            ? current.format("YYYY-MM-DD")
            : trendMode === "weekly"
              ? current.startOf("week").format("YYYY-MM-DD")
              : current.format("YYYY-MM");

        if (!trendMap[key]) {
          trendMap[key] = { date: key, count: 0, days: 0 };
        }

        trendMap[key].count += 1;
        trendMap[key].days += 1;

        current = current.add(1, "day");
      }
    });

    const trendData = Object.values(trendMap).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const holidays = getSwedishLikeHolidaysForYears(startDate, endDate);

    const holidayAbsences = holidays.map((holiday) => {
      const absentIds = new Set(
        filteredAbsences
          .filter((abs) =>
            overlapsDay(abs.startDate, abs.endDate, holiday.date),
          )
          .map((abs) => abs.employeeId),
      );

      const totalEmployees = selectedEmployeeIds.length;
      const absentEmployees = absentIds.size;
      const availableEmployees = Math.max(0, totalEmployees - absentEmployees);
      const absenceRate =
        totalEmployees > 0 ? (absentEmployees / totalEmployees) * 100 : 0;

      return {
        ...holiday,
        absentEmployees,
        availableEmployees,
        totalEmployees,
        absenceRate,
        riskLevel: getRiskLevel(absenceRate),
      };
    });

    const currentHolidayDate =
      selectedHoliday && holidayAbsences.some((h) => h.date === selectedHoliday)
        ? selectedHoliday
        : holidayAbsences[0]?.date || "";

    const holidayTeamComparison = currentHolidayDate
      ? byTeam
          .map((team) => {
            const teamEmployees = employees.filter(
              (e) =>
                e.teamId === team.teamId && selectedEmployeeIds.includes(e.id),
            );

            const absentEmployees = teamEmployees.filter((emp) =>
              filteredAbsences.some(
                (abs) =>
                  abs.employeeId === emp.id &&
                  overlapsDay(abs.startDate, abs.endDate, currentHolidayDate),
              ),
            );

            const availableEmployees = teamEmployees.filter(
              (emp) => !absentEmployees.some((a) => a.id === emp.id),
            );

            const absenceRate =
              teamEmployees.length > 0
                ? (absentEmployees.length / teamEmployees.length) * 100
                : 0;

            return {
              teamId: team.teamId,
              teamName: team.teamName,
              available: availableEmployees.length,
              absent: absentEmployees.length,
              absenceRate,
              total: teamEmployees.length,
              absentEmployees: absentEmployees.map((e) => ({
                id: e.id,
                name: e.name,
              })),
              availableEmployees: availableEmployees.map((e) => ({
                id: e.id,
                name: e.name,
              })),
            };
          })
          .sort((a, b) => b.absenceRate - a.absenceRate)
      : [];

    const currentHolidayTeamId =
      selectedHolidayTeam &&
      holidayTeamComparison.some((t) => t.teamId === selectedHolidayTeam)
        ? selectedHolidayTeam
        : holidayTeamComparison[0]?.teamId || "";

    const selectedHolidayTeamDetails = holidayTeamComparison.find(
      (t) => t.teamId === currentHolidayTeamId,
    );

    const totalAbsenceDays = filteredAbsences.reduce((sum, abs) => {
      const overlap = getOverlapDays(
        rangeStart,
        rangeEnd,
        new Date(abs.startDate),
        new Date(abs.endDate),
      );
      return sum + overlap;
    }, 0);

    const topCategory = byCategory[0];
    const topTeam = byTeam[0];
    const peakHoliday = [...holidayAbsences].sort(
      (a, b) => b.absenceRate - a.absenceRate,
    )[0];

    const peakDay = [...dailyData].sort(
      (a, b) => b.absentEmployees - a.absentEmployees,
    )[0];

    const riskDistribution = [
      {
        name: "Safe",
        value: dailyData.filter((d) => d.riskLevel === "safe").length,
        color: riskColors.safe,
      },
      {
        name: "Warning",
        value: dailyData.filter((d) => d.riskLevel === "warning").length,
        color: riskColors.warning,
      },
      {
        name: "Critical",
        value: dailyData.filter((d) => d.riskLevel === "critical").length,
        color: riskColors.critical,
      },
    ].filter((x) => x.value > 0);

    return {
      dailyData,
      byCategory,
      byTeam,
      trendData,
      holidayAbsences,
      holidayTeamComparison,
      currentHolidayDate,
      currentHolidayTeamId,
      selectedHolidayTeamDetails,
      riskDistribution,
      totals: {
        totalRequests: filteredAbsences.length,
        totalAbsenceDays,
        affectedEmployees: new Set(filteredAbsences.map((a) => a.employeeId))
          .size,
        criticalDays: dailyData.filter((d) => d.riskLevel === "critical")
          .length,
        warningDays: dailyData.filter((d) => d.riskLevel === "warning").length,
        peakDay,
        peakHoliday,
        topCategory,
        topTeam,
      },
    };
  }, [
    startDate,
    endDate,
    employees,
    teams,
    categories,
    absences,
    teamSelections,
    selectedStatuses,
    selectedCategoryIds,
    getSelectedEmployeeIds,
    trendMode,
    selectedHoliday,
    selectedHolidayTeam,
  ]);

  if (!startDate || !endDate) {
    return <EmptyState text="Välj ett datumintervall för att visa analys." />;
  }

  if (!analytics) {
    return <EmptyState text="Ingen data hittades för valt intervall." />;
  }

  const totalCategoryDays = analytics.byCategory.reduce(
    (sum, item) => sum + item.totalDays,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard
          title="Frånvarotillfällen"
          value={analytics.totals.totalRequests}
          tone="blue"
        />
        <StatCard
          title="Frånvarodagar"
          value={analytics.totals.totalAbsenceDays}
          tone="purple"
        />
        <StatCard
          title="Berörda anställda"
          value={analytics.totals.affectedEmployees}
          tone="green"
        />
        <StatCard
          title="Varningsdagar"
          value={analytics.totals.warningDays}
          tone="amber"
        />
        <StatCard
          title="Kritiska dagar"
          value={analytics.totals.criticalDays}
          tone="red"
        />
        <StatCard
          title="Största helgdag"
          value={analytics.totals.peakHoliday?.name || "-"}
          subtitle={
            analytics.totals.peakHoliday
              ? percent(analytics.totals.peakHoliday.absenceRate)
              : undefined
          }
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section title="Daglig bemanningsrisk" subtitle="Frånvarograd per dag">
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <BarChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `${Math.round(Number(value ?? 0))}%`,
                    "Frånvarograd",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="absenceRate" radius={[4, 4, 0, 0]}>
                  {analytics.dailyData.map((d, i) => (
                    <Cell key={i} fill={riskColors[d.riskLevel]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Tillgängliga vs frånvarande" subtitle="Daglig balans">
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <LineChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number | string | undefined, name) => [
                    Number(value ?? 0),
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="availableEmployees"
                  name="Tillgängliga"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="absentEmployees"
                  name="Frånvarande"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Riskfördelning" subtitle="Safe / warning / critical">
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {analytics.riskDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined, name) => [
                    `${Number(value ?? 0)} dagar`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section title="Stora helgdagars frånvaro" subtitle="Jämför helgdagar">
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <BarChart data={analytics.holidayAbsences}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  angle={-18}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `${Math.round(Number(value ?? 0))}%`,
                    "Frånvarograd",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Bar dataKey="absenceRate" radius={[4, 4, 0, 0]}>
                  {analytics.holidayAbsences.map((d, i) => (
                    <Cell key={i} fill={riskColors[d.riskLevel]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Helgdagssammanfattning" subtitle="Kort överblick">
          <ScrollArea maxHeight="max-h-[340px]">
            <div className="space-y-3">
              {analytics.holidayAbsences.map((holiday) => (
                <div
                  key={holiday.date}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {holiday.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {holiday.date}
                      </div>
                    </div>
                    <Badge risk={holiday.riskLevel} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-400">Lediga</div>
                      <div className="font-semibold">
                        {holiday.absentEmployees}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Arbetar</div>
                      <div className="font-semibold">
                        {holiday.availableEmployees}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Grad</div>
                      <div className="font-semibold">
                        {percent(holiday.absenceRate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Section>

        <Section title="Topprisk team" subtitle="Team med högst toppfrånvaro">
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.byTeam.slice(0, 8)}
                layout="vertical"
                margin={{ left: 40, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f3f4f6"
                />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="teamName"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number | string | undefined, name) => [
                    `${Math.round(Number(value ?? 0))}%`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="peakAbsenceRate"
                  name="Toppfrånvaro"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <Section
        title="Team per helgdag"
        subtitle="Se teamens bemanning och vilka anställda som är lediga eller arbetar"
        right={
          <div className="flex flex-col gap-2 sm:flex-row">
            {analytics.holidayAbsences.length > 0 ? (
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                value={analytics.currentHolidayDate}
                onChange={(e) => setSelectedHoliday(e.target.value)}
              >
                {analytics.holidayAbsences.map((h) => (
                  <option key={h.date} value={h.date}>
                    {h.date} – {h.name}
                  </option>
                ))}
              </select>
            ) : null}

            {analytics.holidayTeamComparison.length > 0 ? (
              <select
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                value={analytics.currentHolidayTeamId}
                onChange={(e) => setSelectedHolidayTeam(e.target.value)}
              >
                {analytics.holidayTeamComparison.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        }
      >
        {analytics.holidayTeamComparison.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div style={{ height: CHART_HEIGHT }}>
              <ResponsiveContainer>
                <BarChart
                  data={analytics.holidayTeamComparison}
                  layout="vertical"
                  margin={{ left: 40, right: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f3f4f6"
                  />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="teamName"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number | string | undefined, name) => {
                      return [Number(value ?? 0), String(name)];
                    }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="available"
                    name="Arbetar"
                    fill="#22c55e"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="Lediga"
                    fill="#ef4444"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              {analytics.selectedHolidayTeamDetails ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {analytics.selectedHolidayTeamDetails.teamName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {analytics.currentHolidayDate}
                      </p>
                    </div>
                    <Badge
                      risk={getRiskLevel(
                        analytics.selectedHolidayTeamDetails.absenceRate,
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-white p-3 shadow-sm">
                      <div className="text-xs text-gray-400">Totalt</div>
                      <div className="text-lg font-bold text-gray-900">
                        {analytics.selectedHolidayTeamDetails.total}
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-3">
                      <div className="text-xs text-green-700">Arbetar</div>
                      <div className="text-lg font-bold text-green-800">
                        {analytics.selectedHolidayTeamDetails.available}
                      </div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3">
                      <div className="text-xs text-red-700">Lediga</div>
                      <div className="text-lg font-bold text-red-800">
                        {analytics.selectedHolidayTeamDetails.absent}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-semibold text-red-700">
                        Lediga anställda
                      </div>
                      <ScrollArea maxHeight="max-h-[220px]">
                        <div className="space-y-2">
                          {analytics.selectedHolidayTeamDetails.absentEmployees
                            .length > 0 ? (
                            analytics.selectedHolidayTeamDetails.absentEmployees.map(
                              (emp) => (
                                <div
                                  key={emp.id}
                                  className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm text-gray-800"
                                >
                                  {emp.name}
                                </div>
                              ),
                            )
                          ) : (
                            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500">
                              Ingen frånvaro i teamet.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-semibold text-green-700">
                        Arbetande anställda
                      </div>
                      <ScrollArea maxHeight="max-h-[220px]">
                        <div className="space-y-2">
                          {analytics.selectedHolidayTeamDetails
                            .availableEmployees.length > 0 ? (
                            analytics.selectedHolidayTeamDetails.availableEmployees.map(
                              (emp) => (
                                <div
                                  key={emp.id}
                                  className="rounded-lg border border-green-100 bg-white px-3 py-2 text-sm text-gray-800"
                                >
                                  {emp.name}
                                </div>
                              ),
                            )
                          ) : (
                            <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500">
                              Ingen tillgänglig personal.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="Ingen teamdata tillgänglig för vald helgdag." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState text="Ingen helgdagsjämförelse tillgänglig." />
        )}
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section
          title="Frånvarotrender över tid"
          subtitle="Dag / vecka / månad"
          right={
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTrendMode(mode)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    trendMode === mode
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {mode === "daily"
                    ? "Dag"
                    : mode === "weekly"
                      ? "Vecka"
                      : "Månad"}
                </button>
              ))}
            </div>
          }
        >
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <AreaChart data={analytics.trendData}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    if (trendMode === "monthly")
                      return dayjs(String(value)).format("MMM YYYY");
                    if (trendMode === "weekly")
                      return `v.${dayjs(String(value)).week()}`;
                    return dayjs(String(value)).format("DD MMM");
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number | string | undefined) => [
                    `${Number(value ?? 0)} dagar`,
                    "Frånvarodagar",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="days"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#trendFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Frånvarotyper" subtitle="Fördelning per kategori">
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={analytics.byCategory}
                  dataKey="totalDays"
                  nameKey="label"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {analytics.byCategory.map((entry, index) => (
                    <Cell
                      key={entry.categoryId}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined, name) => [
                    `${Number(value ?? 0)} dagar`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="Kategoriers påverkan"
          subtitle="Dagar och berörda anställda"
        >
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.byCategory}
                layout="vertical"
                margin={{ left: 40, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f3f4f6"
                />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number | string | undefined, name) => [
                    Number(value ?? 0),
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="employeeCount"
                  name="Berörda anställda"
                  fill="#2563eb"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="totalDays"
                  name="Frånvarodagar"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section
          title="Teamjämförelse"
          subtitle="Snittfrånvaro och toppfrånvaro per team"
        >
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer>
              <BarChart
                data={analytics.byTeam}
                layout="vertical"
                margin={{ left: 40, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f3f4f6"
                />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                <YAxis
                  type="category"
                  dataKey="teamName"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number | string | undefined, name) => [
                    `${Math.round(Number(value ?? 0))}%`,
                    String(name),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="avgAbsenceRate"
                  name="Snittfrånvaro"
                  fill="#2563eb"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="peakAbsenceRate"
                  name="Toppfrånvaro"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section
          title="Kategorilista"
          subtitle="Detaljerad lista över frånvarotyper"
        >
          <ScrollArea maxHeight="max-h-[340px]">
            <div className="space-y-3">
              {analytics.byCategory.map((cat, index) => {
                const fill = cat.color || COLORS[index % COLORS.length];
                const share =
                  totalCategoryDays > 0
                    ? Math.round((cat.totalDays / totalCategoryDays) * 100)
                    : 0;

                return (
                  <div
                    key={cat.categoryId}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: fill }}
                        />
                        <span className="font-medium text-gray-900">
                          {cat.label}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{share}%</span>
                    </div>

                    <div className="mb-2 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${share}%`,
                          backgroundColor: fill,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                      <div>
                        <div className="text-gray-400">Tillfällen</div>
                        <div className="font-semibold text-gray-800">
                          {cat.count}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Dagar</div>
                        <div className="font-semibold text-gray-800">
                          {cat.totalDays}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Anställda</div>
                        <div className="font-semibold text-gray-800">
                          {cat.employeeCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Snitt</div>
                        <div className="font-semibold text-gray-800">
                          {cat.avgDuration}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Section>
      </div>

      <Section
        title="Teamrisk-tabell"
        subtitle="Detaljerad överblick över teamens belastning"
      >
        <ScrollArea maxHeight="max-h-[420px]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 pr-4 font-medium">Team</th>
                  <th className="pb-3 pr-4 font-medium">Storlek</th>
                  <th className="pb-3 pr-4 font-medium">Snitt</th>
                  <th className="pb-3 pr-4 font-medium">Topp</th>
                  <th className="pb-3 pr-4 font-medium">Kritiska dagar</th>
                  <th className="pb-3 pr-4 font-medium">Varningsdagar</th>
                  <th className="pb-3 pr-4 font-medium">Lägst tillgängliga</th>
                  <th className="pb-3 pr-4 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {analytics.byTeam.map((team) => (
                  <tr key={team.teamId} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {team.teamName}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {team.totalEmployees}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {percent(team.avgAbsenceRate)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {percent(team.peakAbsenceRate)}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {team.criticalDays}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {team.warningDays}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {team.lowestAvailable}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge risk={team.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Section>
    </div>
  );
}
