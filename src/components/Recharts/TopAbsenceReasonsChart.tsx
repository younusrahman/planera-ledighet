import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  useEmployees,
  useAbsenceCategories,
} from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import dayjs from "dayjs";
import styles from "./TopAbsenceReasonsChart.module.css";

// Lightweight Icons
const TrendIcon = ({ type }: { type: "up" | "down" | "stable" }) => {
  if (type === "up")
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2.5"
      >
        <path d="M23 6l-9.5 9.5-5-5L1 18m22-12h-6m6 0v6" />
      </svg>
    );
  if (type === "down")
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
      >
        <path d="M23 18l-9.5-9.5-5 5L1 6m22 12h-6m6 0v-6" />
      </svg>
    );
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9ca3af"
      strokeWidth="2.5"
    >
      <path d="M5 12h14" />
    </svg>
  );
};

export function TopAbsenceReasonsChart({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) {
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();
  const { teamSelections, getSelectedEmployeeIds, selectedStatuses } =
    useFilterStore();

  const selectedEmployeeIds = useMemo(
    () => getSelectedEmployeeIds(employees),
    [teamSelections, employees],
  );

  const stats = useMemo(() => {
    const rawStats: Record<string, any> = {};
    categories.forEach((cat) => {
      rawStats[cat.id] = {
        categoryId: cat.id,
        label: cat.label,
        color: cat.color,
        count: 0,
        days: 0,
        employees: new Set(),
      };
    });

    const rangeStart = startDate
      ? dayjs(startDate)
      : dayjs().subtract(1, "year");
    const rangeEnd = endDate ? dayjs(endDate) : dayjs();

    absences.forEach((abs) => {
      if (
        !selectedEmployeeIds.includes(abs.employeeId) ||
        !selectedStatuses.includes(abs.status)
      )
        return;
      const start = dayjs(abs.startDate);
      const end = dayjs(abs.endDate);
      if (
        !(start.isBefore(rangeEnd) || start.isSame(rangeEnd)) ||
        !(end.isAfter(rangeStart) || end.isSame(rangeStart))
      )
        return;

      const cat = rawStats[abs.absenceCategoryId];
      if (cat) {
        cat.count += 1;
        cat.days += abs.durationDays;
        cat.employees.add(abs.employeeId);
      }
    });

    const chartData = Object.values(rawStats)
      .filter((s: any) => s.count > 0)
      .map((cat: any) => ({
        ...cat,
        employeeCount: cat.employees.size,
        avgDuration: Math.round(cat.days / cat.count),
        trend: cat.count > 5 ? "up" : cat.count < 2 ? "down" : "stable",
      }))
      .sort((a, b) => b.employeeCount - a.employeeCount);

    return {
      categoryStats: chartData,
      totalDays: chartData.reduce((sum, c) => sum + c.days, 0),
      totalInstances: chartData.reduce((sum, c) => sum + c.count, 0),
      totalEmployees: new Set(
        chartData.flatMap((c) => Array.from(rawStats[c.categoryId].employees)),
      ).size,
    };
  }, [
    absences,
    categories,
    selectedEmployeeIds,
    selectedStatuses,
    startDate,
    endDate,
  ]);

  const topCategory = stats.categoryStats[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div style={{ fontWeight: 700, marginBottom: "4px" }}>{data.label}</div>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>
          {data.employeeCount} anställda • {data.days} dagar
          <br />
          Snitt {data.avgDuration} dagar per tillfälle
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Summary Row */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "#2563eb" }}>
            {stats.totalInstances}
          </span>
          <span className={styles.summaryLabel}>Tillfällen</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "#7c3aed" }}>
            {stats.totalDays}
          </span>
          <span className={styles.summaryLabel}>Frånvarodagar</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryValue} style={{ color: "#059669" }}>
            {stats.totalEmployees}
          </span>
          <span className={styles.summaryLabel}>Berörda anställda</span>
        </div>
      </div>

      {/* Insight Banner */}
      {topCategory && (
        <div
          className={styles.insightCard}
          style={{
            backgroundColor: `${topCategory.color}15`,
            borderLeftColor: topCategory.color,
          }}
        >
          <h4 className={styles.insightTitle}>
            Vanligaste orsak: {topCategory.label}
          </h4>
          <p className={styles.insightDesc}>
            Påverkar {topCategory.employeeCount} anställda med{" "}
            {topCategory.days} dagar (
            {Math.round((topCategory.days / (stats.totalDays || 1)) * 100)}% av
            totalen)
          </p>
        </div>
      )}

      {/* Chart Section */}
      <div className={styles.chartCard}>
        <div style={{ width: "100%", height: 300, marginBottom: "32px" }}>
          {stats.categoryStats.length > 0 ? (
            <ResponsiveContainer>
              <BarChart
                data={stats.categoryStats}
                layout="vertical"
                margin={{ left: 80, right: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f3f4f6"
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={100}
                  tick={{ fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "#f9fafb" }}
                />
                <Bar dataKey="employeeCount" radius={[0, 4, 4, 0]} barSize={20}>
                  {stats.categoryStats.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noData}>
              Ingen data hittades för valda filter
            </div>
          )}
        </div>

        {/* Breakdown List */}
        <div className={styles.chartTitle}>Detaljerad breakdown</div>
        <div className={styles.list}>
          {stats.categoryStats.map((cat: any) => {
            const percentage = Math.round(
              (cat.days / (stats.totalDays || 1)) * 100,
            );
            return (
              <div key={cat.categoryId} className={styles.listItem}>
                <div className={styles.itemHeader}>
                  <div
                    className={styles.dot}
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className={styles.itemLabel}>{cat.label}</span>
                  <TrendIcon type={cat.trend} />
                  <div className={styles.badgeGroup}>
                    <span className={styles.badge}>
                      {cat.employeeCount} pers
                    </span>
                    <span
                      className={styles.badge}
                      style={{ borderColor: cat.color, color: cat.color }}
                    >
                      {cat.days} d
                    </span>
                  </div>
                </div>

                <div className={styles.progressWrapper}>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <span className={styles.percentageText}>{percentage}%</span>
                </div>

                <div className={styles.subText}>
                  {cat.count} tillfällen • snitt {cat.avgDuration} dagar
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
