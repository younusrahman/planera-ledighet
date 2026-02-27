import React, { useMemo, useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  type MRT_ColumnDef,
  type MRT_Cell,
  type MRT_GroupingState,
  type MRT_Row,
} from "material-react-table";
import {
  Box,
  Tabs,
  Tab,
  Tooltip,
  Typography,
  Paper,
  Chip,
  MenuItem,
  Select,
  IconButton,
  CircularProgress,
  type SelectChangeEvent,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// --- DINA IMPORTER ---
import {
  type Team,
  type Employee,
  type AbsenceCategory,
  AbsenceStatus,
  type Absence,
  type ChangeAbsenceStatusPayload,
} from "../../../types";
import {
  useTeams,
  useEmployees,
  useAbsenceCategories,
  useTeamMutation,
  useEmployeeMutation,
  useAbsenceCategoryMutation,
  useAbsenceStatusMutation,
} from "../../hooks/useData";
import { absence } from "../../stores/absenceDataStore";
import { dialog } from "../dialogStore";

// --- GRÄNSSNITT ---
interface AbsenceView extends Absence {
  employeeName: string;
  teamName: string;
  categoryLabel: string;
  color: string;
}

const PREDEFINED_COLORS = [
  "#1976d2",
  "#0288d1",
  "#7b1fa2",
  "#512da8",
  "#1e21ed",
  "#00796b",
  "#689f38",
  "#d32f2f",
  "#c2185b",
  "#ad1457",
  "#ed6c02",
  "#f57c00",
  "#ffa000",
  "#afb42b",
  "#616161",
  "#455a64",
  "#5d4037",
  "#00acc1",
  "#e64a19",
  "#303f9f",
];

const DataManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState("absences");
  const [grouping, setGrouping] = useState<MRT_GroupingState>(["teamName"]);

  // --- DATA QUERIES ---
  const { data: teams = [], isLoading: isLoadingTeams } = useTeams();
  const { data: employees = [], isLoading: isLoadingEmployees } =
    useEmployees();
  const { data: categories = [], isLoading: isLoadingCategories } =
    useAbsenceCategories();
  const absencesRaw = absence.useItems();

  // --- MUTATIONS ---
  const { createTeam, updateTeam } = useTeamMutation();
  const { createEmployee, updateEmployee } = useEmployeeMutation();
  const { createAbsenceCategory, updateAbsenceCategory } =
    useAbsenceCategoryMutation();
  const { mutateAsync: updateAbsenceStatus } = useAbsenceStatusMutation();

  // --- DIALOG TRIGGERS ---
  const handleAddTeam = () =>
    dialog.open("group", {
      title: "Skapa ny grupp",
      onSave: (name: string) => {
        createTeam(name);
        dialog.close();
      },
    });

  const handleAddEmployee = () =>
    dialog.open("resource", {
      title: "Lägg till anställd",
      groups: teams,
      onSave: (name: string, tid: string) => {
        createEmployee(name, tid);
        dialog.close();
      },
    });

  const handleAddCategory = () =>
    dialog.open("absenceType", {
      title: "Skapa frånvarotyp",
      absenceTypes: categories,
      onSave: (l: string, c: string) => {
        createAbsenceCategory(l, c);
        dialog.close();
      },
    });

  // --- JOIN LOGIC ---
  const enrichedAbsences = useMemo<AbsenceView[]>(() => {
    if (!absencesRaw.length) return [];
    return absencesRaw.map((abs) => {
      const emp = employees.find((e) => e.id === abs.employeeId);
      const team = teams.find((t) => t.id === emp?.teamId);
      const cat = categories.find((c) => c.id === abs.absenceCategoryId);
      return {
        ...abs,
        employeeName: emp?.name || "Okänd",
        teamName: team?.name || "Inget Team",
        categoryLabel: cat?.label || "Okänd Kategori",
        color: (abs as any).color || cat?.color || "#333",
      };
    });
  }, [absencesRaw, employees, teams, categories]);

  // --- WHITE THEME CONFIG ---
  const whiteTableConfig = {
    mrtTheme: { baseBackgroundColor: "#ffffff" },
    muiTablePaperProps: { elevation: 0, sx: { backgroundColor: "#ffffff" } },
    muiTopToolbarProps: {
      sx: { backgroundColor: "#ffffff", boxShadow: "none" },
    },
    muiBottomToolbarProps: {
      sx: { backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" },
    },
    muiTableHeadCellProps: {
      sx: { backgroundColor: "#ffffff", fontWeight: "bold", borderTop: "none" },
    },
    muiTableBodyCellProps: { sx: { backgroundColor: "#ffffff" } },
    muiSearchTextFieldProps: {
      size: "small" as const,
      variant: "outlined" as const,
      sx: { m: "8px" },
      placeholder: "Sök på vad som helst...",
    },
    enableStickyHeader: true,
    muiTableContainerProps: {
      sx: { maxHeight: "calc(100vh - 350px)", overflowY: "auto" },
    },
    globalFilterFn: "contains" as const,
    enableGlobalFilterRankedResults: false,
  };

  // UPPDATERAD HJÄLPFUNKTION MED TOOLTIP
  const renderActions = (
    table: any,
    addFn: () => void,
    tooltipText: string,
  ) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
      <Tooltip title={tooltipText} arrow>
        <IconButton onClick={addFn} color="primary" size="small">
          <AddCircleOutlineIcon />
        </IconButton>
      </Tooltip>
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleDensePaddingButton table={table} />
    </Box>
  );

  // --- TABLES DEFINITIONS ---

  // 1. FRÅNVARO (Ingen lägg till-knapp här enligt önskemål)
  const absenceTable = useMaterialReactTable({
    columns: useMemo<MRT_ColumnDef<AbsenceView>[]>(
      () => [
        {
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "teamName",
          header: "Team",
          enableGrouping: true,
          enableEditing: false,
        },
        {
          accessorKey: "employeeName",
          header: "Anställd",
          enableGrouping: true,
          enableEditing: false,
          Cell: ({ row }) => (
            <Tooltip title={`ID: ${row.original.employeeId}`} arrow>
              <span>{row.original.employeeName}</span>
            </Tooltip>
          ),
        },
        {
          accessorKey: "categoryLabel",
          header: "Kategori",
          enableGrouping: true,
          enableEditing: false,
          Cell: ({ row }) => (
            <Tooltip title={`ID: ${row.original.absenceCategoryId}`} arrow>
              <Chip
                label={row.original.categoryLabel}
                sx={{ bgcolor: row.original.color, color: "#fff" }}
                size="small"
              />
            </Tooltip>
          ),
        },
        {
          accessorKey: "startDate",
          header: "Start",
          Cell: ({ cell }) =>
            new Date(cell.getValue<string>()).toLocaleDateString(),
        },
        { accessorKey: "durationDays", header: "Dagar" },
        {
          id: "status",
          header: "Status",
          accessorFn: (row) => ["Väntande", "Godkänd", "Avvisad"][row.status],
          editVariant: "select",
          editSelectOptions: [
            { value: 0, label: "Väntande" },
            { value: 1, label: "Godkänd" },
            { value: 2, label: "Avvisad" },
          ],
          muiTableBodyCellEditSelectProps: ({
            cell,
          }: {
            cell: MRT_Cell<AbsenceView>;
          }) => ({
            value: cell.row.original.status,
            onChange: (event: SelectChangeEvent<number>) =>
              updateAbsenceStatus({
                id: cell.row.original.id,
                status: event.target.value as AbsenceStatus,
                rejectionReason: null,
              }),
          }),
        },
      ],
      [updateAbsenceStatus],
    ),
    data: enrichedAbsences,
    enableGrouping: true,
    enableColumnDragging: true,
    enableEditing: true,
    editDisplayMode: "cell",
    state: { grouping },
    onGroupingChange: setGrouping,
    initialState: {
      showGlobalFilter: true,
      expanded: true,
      density: "compact",
      columnVisibility: { id: false },
    },
    ...whiteTableConfig,
  });

  // 2. ANSTÄLLDA
  const employeeTable = useMaterialReactTable({
    columns: useMemo<MRT_ColumnDef<Employee>[]>(
      () => [
        {
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "name",
          header: "Namn",
          muiTableBodyCellEditTextFieldProps: ({
            cell,
          }: {
            cell: MRT_Cell<Employee>;
          }) => ({
            onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
              updateEmployee(
                cell.row.original.id,
                e.target.value,
                cell.row.original.teamId,
              ),
          }),
        },
        {
          id: "teamId",
          header: "Team",
          accessorFn: (row) =>
            teams.find((t) => t.id === row.teamId)?.name || "Inget Team",
          editVariant: "select",
          editSelectOptions: teams.map((t) => ({ value: t.id, label: t.name })),
          muiTableBodyCellEditSelectProps: ({
            cell,
          }: {
            cell: MRT_Cell<Employee>;
          }) => ({
            value: cell.row.original.teamId,
            onChange: (e: SelectChangeEvent<string>) =>
              updateEmployee(
                cell.row.original.id,
                cell.row.original.name,
                e.target.value,
              ),
          }),
        },
      ],
      [teams, updateEmployee],
    ),
    data: employees,
    enableEditing: true,
    editDisplayMode: "cell",
    renderToolbarInternalActions: ({ table }) =>
      renderActions(table, handleAddEmployee, "Lägg till anställd"),
    initialState: {
      showGlobalFilter: true,
      density: "compact",
      columnVisibility: { id: false },
    },
    ...whiteTableConfig,
  });

  // 3. GRUPPER
  const teamTable = useMaterialReactTable({
    columns: useMemo<MRT_ColumnDef<Team>[]>(
      () => [
        {
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "name",
          header: "Gruppnamn",
          muiTableBodyCellEditTextFieldProps: ({
            cell,
          }: {
            cell: MRT_Cell<Team>;
          }) => ({
            onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
              updateTeam(cell.row.original.id, e.target.value),
          }),
        },
      ],
      [updateTeam],
    ),
    data: teams,
    enableEditing: true,
    editDisplayMode: "cell",
    renderToolbarInternalActions: ({ table }) =>
      renderActions(table, handleAddTeam, "Lägg till grupp"),
    initialState: {
      showGlobalFilter: true,
      density: "compact",
      columnVisibility: { id: false },
    },
    ...whiteTableConfig,
  });

  // 4. KATEGORIER
  const categoryTable = useMaterialReactTable({
    columns: useMemo<MRT_ColumnDef<AbsenceCategory>[]>(
      () => [
        {
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "label",
          header: "Benämning",
          muiTableBodyCellEditTextFieldProps: ({
            cell,
          }: {
            cell: MRT_Cell<AbsenceCategory>;
          }) => ({
            onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
              updateAbsenceCategory(
                cell.row.original.id,
                e.target.value,
                cell.row.original.color,
              ),
          }),
        },
        {
          accessorKey: "color",
          header: "Färg",
          Edit: ({
            cell,
            row,
          }: {
            cell: MRT_Cell<AbsenceCategory>;
            row: MRT_Row<AbsenceCategory>;
          }) => {
            const usedColors = categories.map((c) => c.color);
            const available = PREDEFINED_COLORS.filter(
              (c) => c === cell.getValue<string>() || !usedColors.includes(c),
            );
            return (
              <Select
                value={cell.getValue<string>()}
                onChange={(e: SelectChangeEvent<string>) =>
                  updateAbsenceCategory(
                    row.original.id,
                    row.original.label,
                    e.target.value,
                  )
                }
                fullWidth
                size="small"
              >
                {available.map((c) => (
                  <MenuItem key={c} value={c}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          bgcolor: c,
                          borderRadius: "50%",
                        }}
                      />{" "}
                      {c}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            );
          },
          Cell: ({ cell }) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  bgcolor: cell.getValue<string>(),
                  borderRadius: "50%",
                  border: "1px solid #ddd",
                }}
              />
              {cell.getValue<string>()}
            </Box>
          ),
        },
      ],
      [categories, updateAbsenceCategory],
    ),
    data: categories,
    enableEditing: true,
    editDisplayMode: "cell",
    renderToolbarInternalActions: ({ table }) =>
      renderActions(table, handleAddCategory, "Lägg till kategori"),
    initialState: {
      showGlobalFilter: true,
      density: "compact",
      columnVisibility: { id: false },
    },
    ...whiteTableConfig,
  });

  if (isLoadingTeams || isLoadingEmployees || isLoadingCategories) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 2, fontWeight: "bold", color: "#334155" }}
      >
        Datahantering
      </Typography>
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          bgcolor: "#ffffff",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Frånvaro" value="absences" />
          <Tab label="Anställda" value="employees" />
          <Tab label="Grupper" value="teams" />
          <Tab label="Kategorier" value="categories" />
        </Tabs>
        <Box sx={{ flex: 1, overflow: "hidden", p: 0 }}>
          {activeTab === "absences" && (
            <MaterialReactTable table={absenceTable} />
          )}
          {activeTab === "employees" && (
            <MaterialReactTable table={employeeTable} />
          )}
          {activeTab === "teams" && <MaterialReactTable table={teamTable} />}
          {activeTab === "categories" && (
            <MaterialReactTable table={categoryTable} />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DataManagementDashboard;
