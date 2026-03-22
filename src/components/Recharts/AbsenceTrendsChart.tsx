import React, { useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  useEmployees,
  useAbsenceCategories,
} from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import dayjs from "dayjs";
import styles from "./AbsenceTrendsChart.module.css";

type ViewMode = "daily" | "weekly" | "monthly";
const PRIMARY_COLOR = "#2563eb";

export function AbsenceTrendsChart() {
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();

  const {
    teamSelections,
    getSelectedEmployeeIds,
    selectedStatuses,
    selectedCategoryIds,
  } = useFilterStore();

  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const selectedEmployeeIds = useMemo(() => {
    return getSelectedEmployeeIds(employees);
  }, [teamSelections, employees, getSelectedEmployeeIds]);

  const filteredAbsences = useMemo(() => {
    let filtered = absences.filter(
      (abs) =>
        selectedEmployeeIds.includes(abs.employeeId) &&
        selectedStatuses.includes(abs.status),
    );

    if (!selectedCategoryIds.includes("ALL")) {
      filtered = filtered.filter((abs) =>
        selectedCategoryIds.includes(abs.absenceCategoryId),
      );
    }

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(
        (abs) => abs.absenceCategoryId === selectedCategory,
      );
    }

    return filtered;
  }, [
    absences,
    selectedEmployeeIds,
    selectedStatuses,
    selectedCategoryIds,
    selectedCategory,
  ]);

  const trendData = useMemo(() => {
    if (filteredAbsences.length === 0) return [];
    const data: Record<string, { date: string; count: number; days: number }> =
      {};

    filteredAbsences.forEach((abs) => {
      const start = dayjs(abs.startDate);
      const end = dayjs(abs.endDate);
      let current = start;
      while (current.isBefore(end) || current.isSame(end, "day")) {
        let key =
          viewMode === "daily"
            ? current.format("YYYY-MM-DD")
            : viewMode === "weekly"
              ? current.startOf("week").format("YYYY-MM-DD")
              : current.format("YYYY-MM");

        if (!data[key]) data[key] = { date: key, count: 0, days: 0 };
        data[key].count += 1;
        data[key].days += 1;
        current = current.add(1, "day");
      }
    });
    return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredAbsences, viewMode]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Frånvarotrender över tid</h3>

        {/* CUSTOM TOGGLE BUTTONS */}
        <div className={styles.toggleGroup}>
          {(["daily", "weekly", "monthly"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`${styles.toggleBtn} ${viewMode === mode ? styles.activeToggle : ""}`}
              onClick={() => setViewMode(mode)}
            >
              {mode === "daily"
                ? "Dagligen"
                : mode === "weekly"
                  ? "Veckovis"
                  : "Månadsvis"}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.selectWrapper}>
        <label className={styles.selectLabel}>Filtrera på kategori</label>
        <select
          className={styles.nativeSelect}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="ALL">Alla kategorier</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.chartCard}>
        <div
          style={{ width: "100%", height: 350 }}
          key={`${viewMode}-${selectedCategory}`}
        >
          {trendData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={PRIMARY_COLOR}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={PRIMARY_COLOR}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickFormatter={(value) => {
                    if (viewMode === "monthly")
                      return dayjs(value).format("MMM YYYY");
                    if (viewMode === "weekly")
                      return "v." + dayjs(value).week();
                    return dayjs(value).format("DD MMM");
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value: number) => [
                    `${value} dagar`,
                    "Frånvarodagar",
                  ]}
                  labelFormatter={(label) => {
                    if (viewMode === "monthly")
                      return dayjs(label).format("MMMM YYYY");
                    if (viewMode === "weekly")
                      return `Vecka ${dayjs(label).week()}, ${dayjs(label).year()}`;
                    return dayjs(label).format("D MMMM YYYY");
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="days"
                  stroke={PRIMARY_COLOR}
                  fillOpacity={1}
                  fill="url(#colorDays)"
                  strokeWidth={3}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.noData}>Ingen data för valt intervall</div>
          )}
        </div>
      </div>
    </div>
  );
}
