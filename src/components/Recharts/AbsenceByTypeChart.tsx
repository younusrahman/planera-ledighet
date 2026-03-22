import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  useEmployees,
  useAbsenceCategories,
  useTeams,
} from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import styles from "./AbsenceByTypeChart.module.css";

const STATUS_CLASSES: Record<string, string> = {
  Pending: styles["status-pending"],
  Approved: styles["status-approved"],
  Rejected: styles["status-rejected"],
};

// --- Logic Helpers ---
const getOverlapDays = (fS: Date, fE: Date, aS: Date, aE: Date): number => {
  const s = aS < fS ? fS : aS;
  const e = aE < fE ? fE : aE;
  if (s > e) return 0;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

// --- Recursive Row Component ---
const TableRow = ({ row, depth = 0 }: { row: any; depth?: number }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSubRows = row.subRows && row.subRows.length > 0;

  return (
    <>
      <div className={styles.row} style={{ paddingLeft: `${depth * 16}px` }}>
        <div className={styles.nameCell}>
          {hasSubRows ? (
            <button
              className={styles.expandBtn}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{
                  transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "0.2s",
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          ) : (
            <div style={{ width: 24 }} />
          )}

          {row.type === "absence" ? (
            <span
              className={styles.badge}
              style={{
                backgroundColor: `${row.categoryColor}20`,
                color: row.categoryColor,
              }}
            >
              {row.name}
            </span>
          ) : (
            <span
              className={`${styles.rowText} ${row.type === "team" ? styles.teamName : styles.employeeName}`}
            >
              {row.name}
            </span>
          )}
        </div>

        <div>
          {row.statusLabel && row.type === "absence" && (
            <span
              className={`${styles.badge} ${styles.statusBadge} ${STATUS_CLASSES[row.statusLabel]}`}
            >
              {row.statusLabel}
            </span>
          )}
        </div>

        <div className={styles.daysCell}>{row.totalDays ?? row.days}</div>
      </div>

      {isExpanded &&
        hasSubRows &&
        row.subRows.map((sub: any) => (
          <TableRow key={sub.id} row={sub} depth={depth + 1} />
        ))}
    </>
  );
};

export function AbsenceByTypeChart({
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
    selectedCategoryIds,
    selectedStatuses,
    getSelectedEmployeeIds,
  } = useFilterStore();

  // Data processing remains identical to your logic
  const { chartData, tableData } = useMemo(() => {
    let targets =
      teamSelections.length === 0
        ? employees.map((e) => e.id)
        : getSelectedEmployeeIds(employees);
    let filtered = absences.filter(
      (abs) =>
        targets.includes(abs.employeeId) &&
        (selectedCategoryIds.includes("ALL") ||
          selectedCategoryIds.includes(abs.absenceCategoryId)) &&
        selectedStatuses.includes(abs.status),
    );

    const fS = startDate ? new Date(startDate) : null;
    const fE = endDate ? new Date(endDate) : null;
    const categoryMap: Record<string, any> = {};
    const treeData: any[] = [];

    filtered.forEach((abs, index) => {
      const aS = new Date(abs.startDate);
      const aE = new Date(abs.endDate);
      let overlap =
        fS && fE ? getOverlapDays(fS, fE, aS, aE) : abs.durationDays || 0;
      if (overlap <= 0) return;

      const cat = categories.find((c) => c.id === abs.absenceCategoryId);
      const emp = employees.find((e) => e.id === abs.employeeId);
      const team = teams.find((t) => t.id === emp?.teamId);

      // Category logic for Chart
      if (!categoryMap[abs.absenceCategoryId]) {
        categoryMap[abs.absenceCategoryId] = {
          name: cat?.label,
          value: 0,
          color: cat?.color,
        };
      }
      categoryMap[abs.absenceCategoryId].value += overlap;

      // Tree logic for Table
      const teamName = team?.name || "No Team";
      let tNode = treeData.find((n) => n.name === teamName);
      if (!tNode) {
        tNode = {
          id: `t-${teamName}`,
          type: "team",
          name: teamName,
          days: 0,
          totalDays: 0,
          subRows: [],
        };
        treeData.push(tNode);
      }
      let eNode = tNode.subRows.find(
        (n: any) => n.name === (emp?.name || "Unknown"),
      );
      if (!eNode) {
        eNode = {
          id: `e-${abs.employeeId}`,
          type: "employee",
          name: emp?.name || "Unknown",
          days: 0,
          totalDays: 0,
          subRows: [],
        };
        tNode.subRows.push(eNode);
      }
      eNode.subRows.push({
        id: `a-${index}`,
        type: "absence",
        name: cat?.label || "Unknown",
        statusLabel:
          abs.status === 0
            ? "Pending"
            : abs.status === 1
              ? "Approved"
              : "Rejected",
        days: overlap,
        categoryColor: cat?.color,
      });
      eNode.totalDays += overlap;
      tNode.totalDays += overlap;
    });

    return {
      chartData: Object.values(categoryMap).sort(
        (a: any, b: any) => b.value - a.value,
      ),
      tableData: treeData.sort((a, b) => b.totalDays - a.totalDays),
    };
  }, [
    teamSelections,
    selectedCategoryIds,
    selectedStatuses,
    startDate,
    endDate,
    employees,
    categories,
    teams,
    absences,
  ]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Frånvaroanalys</h2>

      <div className={styles.layout}>
        {/* CHART SECTION */}
        <div className={styles.chartSection}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={70}
                paddingAngle={2}
              >
                {chartData.map((e: any, i: number) => (
                  <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* TABLE SECTION */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div>NAMN</div>
            <div>STATUS</div>
            <div style={{ textAlign: "right" }}>DAGAR</div>
          </div>
          {tableData.map((team) => (
            <TableRow key={team.id} row={team} />
          ))}
        </div>
      </div>
    </div>
  );
}
