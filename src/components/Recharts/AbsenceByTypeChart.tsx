import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Chip,
  IconButton,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  useEmployees,
  useAbsenceCategories,
  useTeams,
} from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";

// MRT imports
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import type { MRT_ColumnDef } from "material-react-table";

const STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
};

interface AbsenceRow {
  id: string;
  type: "team" | "employee" | "absence";
  name: string;
  statusLabel?: string;
  days: number;
  totalDays?: number;
  subRows?: AbsenceRow[];
  categoryColor?: string;
}

const getOverlapDays = (fS: Date, fE: Date, aS: Date, aE: Date): number => {
  const s = aS < fS ? fS : aS;
  const e = aE < fE ? fE : aE;
  if (s > e) return 0;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

export function AbsenceByTypeChart({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const theme = useTheme();
  const { data: employees = [] } = useEmployees();
  const { data: teams = [] } = useTeams();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();
  const {
    selectedCategoryIds,
    selectedStatuses,
    teamSelections,
    getSelectedEmployeeIds,
  } = useFilterStore();

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
    const treeData: AbsenceRow[] = [];

    filtered.forEach((abs, index) => {
      const aS = new Date(abs.startDate);
      const aE = new Date(abs.endDate);
      let overlap =
        fS && fE ? getOverlapDays(fS, fE, aS, aE) : abs.durationDays || 0;
      if (overlap <= 0) return;

      const cat = categories.find((c) => c.id === abs.absenceCategoryId);
      const emp = employees.find((e) => e.id === abs.employeeId);
      const team = teams.find((t) => t.id === emp?.teamId);

      const teamName = team?.name || "No Team";
      const employeeName = emp?.name || "Unknown";

      if (!categoryMap[abs.absenceCategoryId]) {
        categoryMap[abs.absenceCategoryId] = {
          name: cat?.label,
          value: 0,
          color: cat?.color,
        };
      }
      categoryMap[abs.absenceCategoryId].value += overlap;

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
      let eNode = tNode.subRows?.find((n) => n.name === employeeName);
      if (!eNode) {
        eNode = {
          id: `e-${abs.employeeId}`,
          type: "employee",
          name: employeeName,
          days: 0,
          totalDays: 0,
          subRows: [],
        };
        tNode.subRows!.push(eNode);
      }

      eNode.subRows!.push({
        id: `a-${index}`,
        type: "absence",
        name: cat?.label || "Unknown",
        statusLabel: STATUS_LABELS[abs.status],
        days: overlap,
        categoryColor: cat?.color,
      });
      eNode.totalDays = (eNode.totalDays || 0) + overlap;
      tNode.totalDays = (tNode.totalDays || 0) + overlap;
    });

    return {
      chartData: Object.values(categoryMap).sort(
        (a: any, b: any) => b.value - a.value,
      ),
      tableData: treeData.sort(
        (a, b) => (b.totalDays || 0) - (a.totalDays || 0),
      ),
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

  const columns = useMemo<MRT_ColumnDef<AbsenceRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "NAMN",
        size: 300, // INCREASED SIZE TO PREVENT TEXT CUTOFF
        Cell: ({ row, cell }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              pl: `${row.depth * 1}rem`,
            }}
          >
            {row.getCanExpand() ? (
              <IconButton
                size="small"
                onClick={() => row.toggleExpanded()}
                sx={{ p: 0.1 }}
              >
                {row.getIsExpanded() ? (
                  <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 24 }} />
            )}

            {row.original.type === "absence" ? (
              <Chip
                label={cell.getValue<string>()}
                sx={{
                  height: 20,
                  fontSize: "0.75rem",
                  backgroundColor: alpha(
                    row.original.categoryColor || "#ccc",
                    0.1,
                  ),
                  color: row.original.categoryColor,
                  fontWeight: 600,
                  maxWidth: "200px",
                }}
              />
            ) : (
              <Typography
                noWrap
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: row.depth === 0 ? 700 : 500,
                }}
              >
                {cell.getValue<string>()}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        accessorKey: "statusLabel",
        header: "STATUS",
        size: 100,
        Cell: ({ row }) => {
          const s = row.original.statusLabel;
          if (!s || row.original.type !== "absence") return null;
          let c: any =
            s === "Pending"
              ? "warning"
              : s === "Approved"
                ? "success"
                : "error";
          return (
            <Chip
              label={s}
              color={c}
              variant="outlined"
              sx={{ height: 18, fontSize: "0.65rem" }}
            />
          );
        },
      },
      {
        accessorKey: "days",
        header: "DAG",
        size: 80,
        muiTableHeadCellProps: { align: "right" },
        muiTableBodyCellProps: { align: "right" },
        Cell: ({ row }) => (
          <Typography
            sx={{ fontSize: "0.85rem", fontWeight: row.depth < 2 ? 700 : 400 }}
          >
            {row.original.totalDays ?? row.original.days}
          </Typography>
        ),
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableExpanding: true,
    enableStickyHeader: true, // STICKY HEADER
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    layoutMode: "grid", // CRITICAL: Ensures columns respect 'size' and don't squish
    displayColumnDefOptions: {
      "mrt-row-expand": {
        size: 0,
        muiTableHeadCellProps: { sx: { display: "none" } },
        muiTableBodyCellProps: { sx: { display: "none" } },
      },
    },
    positionExpandColumn: "none" as any,
    initialState: { expanded: true, density: "compact" },

    // SCROLLBAR AND HEIGHT FIX
    muiTableContainerProps: {
      sx: {
        height: "500px", // Fixed height
        overflow: "auto", // Shows both vertical and horizontal scrollbars if needed
        backgroundColor: "#fff",
      },
    },

    muiTablePaperProps: {
      elevation: 0,
      sx: { border: "none", backgroundColor: "#fff" },
    },
    muiTableBodyCellProps: {
      sx: { backgroundColor: "#fff", borderBottom: "1px solid #f0f0f0" },
    },
    muiTableHeadCellProps: { sx: { backgroundColor: "#fff", zIndex: 2 } },
  });

  return (
    <Box sx={{ backgroundColor: "#fff", width: "100%", p: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        FRÅNVARO ANALYS
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" }, // Side-by-side on desktop
          gap: 4,
          width: "100%",
          alignItems: "flex-start",
        }}
      >
        {/* CHART SECTION */}
        <Box
          sx={{
            width: { xs: "100%", lg: "300px" },
            height: 300,
            flexShrink: 0,
            position: { lg: "sticky" },
            top: 20,
          }}
        >
          <ResponsiveContainer>
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
                {chartData.map((e: any, i) => (
                  <Cell key={i} fill={e.color} stroke="#fff" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        {/* TABLE SECTION */}
        <Box sx={{ flex: 1, width: "100%", minWidth: 0 }}>
          <MaterialReactTable table={table} />
        </Box>
      </Box>
    </Box>
  );
}
