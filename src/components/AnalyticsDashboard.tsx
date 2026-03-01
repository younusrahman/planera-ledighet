import { useState, useMemo } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { useEmployees, useAbsenceCategories } from "../services/hooks/useData";
import { absence } from "../services/stores/absenceDataStore";
import useFilterStore from "../services/stores/analyticsStore";
import { FilterBar } from "./Analytics/FilterBar";
import { AbsenceByTypeChart } from "./Recharts/AbsenceByTypeChart";
import { TeamAbsenceStackedChart } from "./Recharts/TeamAbsenceStackedChart";
import { TopAbsenceReasonsChart } from "./Recharts/TopAbsenceReasonsChart";

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
    // 1. Which employees to consider (team/employee filter)
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

    // 2. Start with absences of those employees
    let filteredAbsences = absences.filter((abs) =>
      targetEmployeeIds.includes(abs.employeeId),
    );

    // 3. Apply status filter
    filteredAbsences = filteredAbsences.filter((abs) =>
      selectedStatuses.includes(abs.status),
    );

    // 4. Apply date range filter (interval overlap)
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

    // 5. Unique category ids from the filtered absences
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

  return (
    <Box>
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        availableCategories={availableCategories}
      />

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
        <Tab label="Frånvarofördelning" />
        <Tab label="Närvaro per team på helgdag" />
        <Tab label="Frånvaroanalys – Orsaker & Påverkan" />
      </Tabs>

      {activeTab === 0 && (
        <Box>
          <AbsenceByTypeChart
            startDate={startDate}
            endDate={endDate}
          />
        </Box>
      )}

      {activeTab === 1 && <TeamAbsenceStackedChart />}
      {activeTab === 2 && (
        <TopAbsenceReasonsChart startDate={startDate} endDate={endDate} />
      )}
    </Box>
  );
}
