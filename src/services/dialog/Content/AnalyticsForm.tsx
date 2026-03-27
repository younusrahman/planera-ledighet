import { useMemo, useState } from "react";
import { AbsenceAnalyticsDashboard } from "../../../components/AnalyticsDashboard";
import { FilterBar } from "../../../components/Analytics/FilterBar";
import {
  useEmployees,
  useAbsenceCategories,
} from "../../../services/hooks/useData";
import { absence } from "../../../services/stores/absenceDataStore";
import useFilterStore from "../../../services/stores/analyticsStore";

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function AnalyticsForm() {
  const today = new Date();
  const future = new Date(today);
  future.setMonth(today.getMonth() + 3);

  const [startDate, setStartDate] = useState(formatDate(today));
  const [endDate, setEndDate] = useState(formatDate(future));

  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();

  const { selectedTeamIds, selectedEmployeeIds, selectedStatuses } =
    useFilterStore();

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
      .map((cat) => ({
        id: cat.id,
        label: cat.label,
        color: cat.color,
      }));
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
    <div className="space-y-6">
      <FilterBar
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        availableCategories={availableCategories}
      />

      <AbsenceAnalyticsDashboard startDate={startDate} endDate={endDate} />
    </div>
  );
}
