import React, { useState, useMemo } from "react";
import { useEmployees, useAbsenceCategories } from "../services/hooks/useData";
import { absence } from "../services/stores/absenceDataStore";
import useFilterStore from "../services/stores/analyticsStore";
import { FilterBar } from "./Analytics/FilterBar";
import { AbsenceByTypeChart } from "./Recharts/AbsenceByTypeChart";
import { TeamAbsenceStackedChart } from "./Recharts/TeamAbsenceStackedChart";
import { TopAbsenceReasonsChart } from "./Recharts/TopAbsenceReasonsChart";
import styles from "./AnalyticsDashboard.module.css";
import { AbsenceTrendsChart } from "./Recharts/AbsenceTrendsChart";

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today = new Date();
const sixMonthsFromNow = new Date(today);
sixMonthsFromNow.setMonth(today.getMonth() + 6);
const defaultStartDate = formatDate(today);
const defaultEndDate = formatDate(sixMonthsFromNow);

export function AnalyticsDashboard() {
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();
  const { selectedTeamIds, selectedEmployeeIds, selectedStatuses } =
    useFilterStore();

  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);

  const availableCategories = useMemo(() => {
    let targetEmployeeIds: string[];
    if (!selectedEmployeeIds.includes("ALL")) {
      targetEmployeeIds = selectedEmployeeIds;
    } else {
      targetEmployeeIds = selectedTeamIds.includes("ALL")
        ? employees.map((e) => e.id)
        : employees
            .filter((emp) => selectedTeamIds.includes(emp.teamId))
            .map((emp) => emp.id);
    }

    let filteredAbsences = absences.filter((abs) =>
      targetEmployeeIds.includes(abs.employeeId),
    );

    filteredAbsences = filteredAbsences.filter((abs) =>
      selectedStatuses.includes(abs.status),
    );

    if (startDate && endDate) {
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd.setHours(23, 59, 59, 999);

      filteredAbsences = filteredAbsences.filter((abs) => {
        const absStart = new Date(abs.startDate);
        const absEnd = new Date(abs.endDate);
        absEnd.setHours(23, 59, 59, 999);
        return absStart <= filterEnd && absEnd >= filterStart;
      });
    }

    const uniqueCatIds = new Set(
      filteredAbsences.map((abs) => abs.absenceCategoryId),
    );
    return categories
      .filter((cat) => uniqueCatIds.has(cat.id))
      .map((cat) => ({ id: cat.id, label: cat.label, color: cat.color }));
  }, [
    selectedTeamIds,
    selectedEmployeeIds,
    selectedStatuses,
    startDate,
    endDate,
    employees,
    absences,
    categories,
  ]);

  const tabs = [
    "Frånvarofördelning",
    "Närvaro per team på helgdag",
    "Frånvaroanalys – Orsaker & Påverkan",
    "Frånvarotrender",
  ];

  return (
    <div className={styles.container}>
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        availableCategories={availableCategories}
      />

      {/* CUSTOM TABS */}
      <div className={styles.tabsHeader}>
        {tabs.map((label, index) => (
          <button
            key={label}
            className={`${styles.tab} ${activeTab === index ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(index)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className={styles.chartContainer}>
        {activeTab === 0 && (
          <AbsenceByTypeChart startDate={startDate} endDate={endDate} />
        )}

        {activeTab === 1 && <TeamAbsenceStackedChart />}

        {activeTab === 2 && (
          <TopAbsenceReasonsChart startDate={startDate} endDate={endDate} />
        )}
        {activeTab === 3 && <AbsenceTrendsChart />}
      </div>
    </div>
  );
}
