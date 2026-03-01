import { useMemo, useState } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFiltersButton,
  type MRT_ColumnDef,
  type MRT_TableOptions,
} from "material-react-table";
import {
  Box,
  Tabs,
  Tab,
  Tooltip,
  Typography,
  Paper,
  MenuItem,
  Select,
  IconButton,
  Chip,
  Button,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import {
  type Team,
  type Employee,
  type AbsenceCategory,
  AbsenceStatus,
  type Absence,
} from "../../../types";
import {
  useTeamMutation,
  useEmployeeMutation,
  useAbsenceCategoryMutation,
  useAbsenceStatusMutation,
} from "../../hooks/useData";
import { dialog } from "../dialogStore";
import { absence } from "../../stores/absenceDataStore";

interface AbsenceView extends Absence {
  employeeName: string;
  teamName: string;
  categoryLabel: string;
  color: string;
  statusText: string; // for searching
}

interface DataManagementDashboardProps {
  absences: Absence[];
  employees: Employee[];
  categories: AbsenceCategory[];
  teams: Team[];
}

const PREDEFINED_COLORS: string[] = [
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

const DataManagementDashboard = ({
  absences,
  employees,
  categories,
  teams,
}: DataManagementDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    "absences" | "employees" | "teams" | "categories"
  >("absences");

  const { createTeam, updateTeam, deleteTeam } = useTeamMutation();
  const { createEmployee, updateEmployee, deleteEmployee } =
    useEmployeeMutation();
  const {
    createAbsenceCategory,
    updateAbsenceCategory,
    deleteAbsenceCategory,
  } = useAbsenceCategoryMutation();
  useAbsenceStatusMutation();

  const handleAddTeam = () =>
    dialog.open("group", {
      title: "Skapa ny grupp",
      onSave: (name: string) => {
        createTeam(name);
        dialog.close();
      },
      onClose: () => dialog.close(),
    });

  const handleAddEmployee = () =>
    dialog.open("resource", {
      title: "Lägg till anställd",
      groups: teams,
      onSave: (name: string, teamId: string) => {
        createEmployee(name, teamId);
        dialog.close();
      },
      onClose: () => dialog.close(),
    });

  const handleAddCategory = () =>
    dialog.open("absenceType", {
      title: "Skapa frånvarotyp",
      absenceTypes: categories,
      onSave: (label: string, color: string) => {
        createAbsenceCategory(label, color);
        dialog.close();
      },
      onClose: () => dialog.close(),
    });

  const enrichedAbsences = useMemo<AbsenceView[]>(() => {
    return (absences ?? []).map((abs) => {
      const emp = employees.find((e) => e.id === abs.employeeId);
      const team = teams.find((t) => t.id === emp?.teamId);
      const cat = categories.find((c) => c.id === abs.absenceCategoryId);
      const end = new Date(abs.startDate);
      end.setDate(end.getDate() + abs.durationDays);

      // Status text for searching
      const statusText =
        abs.status === AbsenceStatus.Pending
          ? "Väntande"
          : abs.status === AbsenceStatus.Approved
            ? "Godkänd"
            : abs.status === AbsenceStatus.Rejected
              ? "Avvisad"
              : "Okänd";

      return {
        ...abs,
        employeeName: emp?.name ?? "Okänd",
        teamName: team?.name ?? "Inget team",
        teamId: emp?.teamId ?? "",
        categoryLabel: cat?.label ?? "Okänd kategori",
        color: cat?.color ?? "#333",
        endDate: end.toISOString().split("T")[0],
        statusText,
      };
    });
  }, [absences, employees, teams, categories]);

  // Base table configuration with sticky header and full height
  const whiteTableConfig = {
    mrtTheme: { baseBackgroundColor: "#ffffff" },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        backgroundColor: "#ffffff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "#ffffff",
        boxShadow: "none",
        flexShrink: 0,
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        flexShrink: 0,
      },
    },
    muiTableHeadCellProps: {
      sx: { backgroundColor: "#ffffff", fontWeight: "bold" },
    },
    muiSearchTextFieldProps: {
      size: "small" as const,
      variant: "outlined" as const,
      sx: { m: "8px" },
      placeholder: "Sök...",
    },
    enableStickyHeader: true,
    muiTableContainerProps: {
      sx: {
        flex: 1,
        overflow: "auto",
        maxHeight: "unset",
      },
    },
    muiTableBodyProps: {
      sx: {
        overflow: "auto",
      },
    },
    // Powerful search & filter enhancements
    globalFilterFn: "fuzzy",
    enableGlobalFilterModes: true,
    enableFilterMatchHighlighting: true,
    enableColumnFilters: true,
    enableFilters: true,
  };

  const renderActions = (table: any, addFn: () => void, tooltip: string) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
      <Tooltip title={tooltip} arrow>
        <IconButton onClick={addFn} color="primary" size="small">
          <AddCircleOutlineIcon />
        </IconButton>
      </Tooltip>
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleDensePaddingButton table={table} />
    </Box>
  );

  const sharedIcons = {
    SaveIcon: () => (
      <Button
        variant="contained"
        sx={{
          fontSize: "10px",
          height: 24,
          backgroundColor: "#2A780E",
          color: "white",
        }}
      >
        Spara
      </Button>
    ),
    CancelIcon: () => (
      <Button
        variant="contained"
        color="error"
        sx={{ fontSize: "10px", height: 24, color: "white" }}
      >
        Avbryt
      </Button>
    ),
  };

  // --- EMPLOYEES TABLE ---
  const handleSaveEmployee: MRT_TableOptions<Employee>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      await updateEmployee(row.original.id, values.name, values.teamId);
      table.setEditingRow(null);
    };

  const employeeTable = useMaterialReactTable<Employee>({
    columns: useMemo<MRT_ColumnDef<Employee>[]>(
      () => [
        { accessorKey: "id", header: "ID", enableEditing: false },
        { accessorKey: "name", header: "Namn" },
        {
          accessorKey: "teamId",
          header: "Team",
          enableGrouping: true,
          Cell: ({ cell }) =>
            teams.find((t) => t.id === cell.getValue<string>())?.name ??
            "Inget team",
          editVariant: "select",
          editSelectOptions: teams.map((t) => ({ value: t.id, label: t.name })),
          muiEditTextFieldProps: { select: true },
          filterVariant: "select",
          filterSelectOptions: teams.map((t) => ({
            value: t.id,
            label: t.name,
          })),
        },
        // Hidden column for team name to enable global search
        {
          accessorKey: "teamName",
          header: "Team (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
          Cell: ({ row }) => {
            const team = teams.find((t) => t.id === row.original.teamId);
            return team?.name ?? "Inget team";
          },
        },
      ],
      [teams],
    ),
    data: employees,
    icons: sharedIcons,
    enableGrouping: true,
    enableColumnDragging: true,
    enableEditing: true,
    editDisplayMode: "row",
    getRowId: (row) => row.id,
    onEditingRowSave: handleSaveEmployee,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="outlined"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </Button>
        <Button
          variant="outlined"
          color="error"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => deleteEmployee(row.original.id)}
        >
          Ta bort
        </Button>
      </Box>
    ),
    renderToolbarInternalActions: ({ table }) =>
      renderActions(table, handleAddEmployee, "Lägg till anställd"),
    ...whiteTableConfig,
    initialState: {
      showGlobalFilter: true,
      density: "compact",
      columnVisibility: { id: false, teamName: false }, // hide the search column
      grouping: [],
    },
  });

  // --- TEAMS TABLE ---
  const handleSaveTeam: MRT_TableOptions<Team>["onEditingRowSave"] = async ({
    values,
    table,
    row,
  }) => {
    await updateTeam(row.original.id, values.name);
    table.setEditingRow(null);
  };

  const teamTable = useMaterialReactTable<Team>({
    columns: useMemo<MRT_ColumnDef<Team>[]>(
      () => [
        { accessorKey: "id", header: "ID", enableEditing: false },
        { accessorKey: "name", header: "Gruppnamn" },
      ],
      [],
    ),
    data: teams,
    icons: sharedIcons,
    enableEditing: true,
    editDisplayMode: "row",
    getRowId: (row) => row.id,
    onEditingRowSave: handleSaveTeam,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="outlined"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </Button>
        <Button
          variant="outlined"
          color="error"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => deleteTeam(row.original.id)}
        >
          Ta bort
        </Button>
      </Box>
    ),
    renderToolbarInternalActions: ({ table }) =>
      renderActions(table, handleAddTeam, "Lägg till grupp"),
    ...whiteTableConfig,
    initialState: {
      columnVisibility: { id: false },
      density: "compact",
      showGlobalFilter: true,
    },
  });

  // --- CATEGORIES TABLE ---
  const handleSaveCategory: MRT_TableOptions<AbsenceCategory>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      await updateAbsenceCategory(row.original.id, values.label, values.color);
      table.setEditingRow(null);
    };

  const categoryTable = useMaterialReactTable<AbsenceCategory>({
    columns: useMemo<MRT_ColumnDef<AbsenceCategory>[]>(
      () => [
        { accessorKey: "id", header: "ID", enableEditing: false },
        { accessorKey: "label", header: "Benämning" },
        {
          accessorKey: "color",
          header: "Färg",
          Edit: ({ cell, row, table }) => (
            <Select
              value={cell.getValue<string>()}
              onChange={(e) => {
                row._valuesCache.color = e.target.value;
                table.setEditingRow({ ...row });
              }}
              fullWidth
              size="small"
            >
              {PREDEFINED_COLORS.map((c) => (
                <MenuItem key={c} value={c}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        bgcolor: c,
                        borderRadius: "50%",
                      }}
                    />
                    {c}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          ),
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
      [categories],
    ),
    data: categories,
    icons: sharedIcons,
    enableEditing: true,
    editDisplayMode: "row",
    getRowId: (row) => row.id,
    onEditingRowSave: handleSaveCategory,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="outlined"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </Button>
        <Button
          variant="outlined"
          color="error"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => deleteAbsenceCategory(row.original.id)}
        >
          Ta bort
        </Button>
      </Box>
    ),
    renderToolbarInternalActions: ({ table }) =>
      renderActions(table, handleAddCategory, "Skapa frånvarotyp"),
    ...whiteTableConfig,
    initialState: {
      columnVisibility: { id: false },
      density: "compact",
      showGlobalFilter: true,
    },
  });

  // --- ABSENCES TABLE ---
  const handleSaveAbsence: MRT_TableOptions<AbsenceView>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      const start = new Date(values.startDate);
      const end = new Date(values.endDate);
      const diffTime = end.getTime() - start.getTime();
      const calculatedDuration = Math.max(
        1,
        Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
      );
      const updatePayload = {
        id: row.original.id,
        employeeId: row.original.employeeId,
        startDate: values.startDate,
        durationDays: Number(calculatedDuration),
        absenceCategoryId: values.absenceCategoryId,
        status: Number(values.status) as AbsenceStatus,
      };
      try {
        await absence.updateOne(row.original.id, updatePayload);
        table.setEditingRow(null);
      } catch (error) {
        console.error("Save failed:", error);
      }
    };

  const absenceTable = useMaterialReactTable<AbsenceView>({
    columns: useMemo<MRT_ColumnDef<AbsenceView>[]>(
      () => [
        { accessorKey: "id", header: "ID", enableEditing: false },
        {
          accessorKey: "teamId",
          header: "Team",
          enableGrouping: true,
          Cell: ({ row }) => row.original.teamName,
          editVariant: "select",
          editSelectOptions: teams.map((t) => ({ value: t.id, label: t.name })),
          filterVariant: "select",
          filterSelectOptions: teams.map((t) => ({
            value: t.id,
            label: t.name,
          })),
        },
        {
          accessorKey: "employeeId",
          header: "Anställd",
          enableGrouping: true,
          enableEditing: false,
          Cell: ({ row }) => row.original.employeeName,
        },
        {
          accessorKey: "absenceCategoryId",
          header: "Kategori",
          enableGrouping: true,
          Cell: ({ row }) => (
            <Chip
              label={row.original.categoryLabel}
              sx={{ bgcolor: row.original.color, color: "#fff" }}
              size="small"
            />
          ),
          editVariant: "select",
          editSelectOptions: categories.map((c) => ({
            value: c.id,
            label: c.label,
          })),
          filterVariant: "select",
          filterSelectOptions: categories.map((c) => ({
            value: c.id,
            label: c.label,
          })),
        },
        {
          accessorKey: "startDate",
          header: "Start",
          muiEditTextFieldProps: { type: "date" },
          Cell: ({ cell }) =>
            new Date(cell.getValue<string>()).toLocaleDateString(),
          filterVariant: "date-range",
        },
        {
          accessorKey: "endDate",
          header: "Slut",
          muiEditTextFieldProps: { type: "date" },
          Cell: ({ cell }) =>
            new Date(cell.getValue<string>()).toLocaleDateString(),
          filterVariant: "date-range",
        },
        { accessorKey: "durationDays", header: "Dagar", enableEditing: false },
        {
          accessorKey: "status",
          header: "Status",
          enableGrouping: true,
          editVariant: "select",
          editSelectOptions: [
            { value: AbsenceStatus.Pending, label: "Väntande" },
            { value: AbsenceStatus.Approved, label: "Godkänd" },
            { value: AbsenceStatus.Rejected, label: "Avvisad" },
          ],
          Cell: ({ cell }) =>
            ["Väntande", "Godkänd", "Avvisad"][cell.getValue<number>()] ??
            "Okänd",
          filterVariant: "select",
          filterSelectOptions: [
            { value: AbsenceStatus.Pending, label: "Väntande" },
            { value: AbsenceStatus.Approved, label: "Godkänd" },
            { value: AbsenceStatus.Rejected, label: "Avvisad" },
          ],
        },
        // Hidden columns for global search on displayed text
        {
          accessorKey: "teamName",
          header: "Team (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "employeeName",
          header: "Anställd (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "categoryLabel",
          header: "Kategori (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        },
        {
          accessorKey: "statusText",
          header: "Status (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        },
      ],
      [teams, categories],
    ),
    data: enrichedAbsences,
    enableGrouping: true,
    enableColumnDragging: true,
    enableColumnOrdering: true,
    enableEditing: true,
    editDisplayMode: "row",
    getRowId: (row) => row.id,
    onEditingRowSave: handleSaveAbsence,
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="outlined"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </Button>
        <Button
          variant="outlined"
          color="error"
          sx={{ fontSize: "10px", height: 24 }}
          onClick={() => {
            if (window.confirm("Ta bort frånvaro?"))
              absence.removeOne(row.original.id);
          }}
        >
          Ta bort
        </Button>
      </Box>
    ),
    icons: sharedIcons,
    ...whiteTableConfig,
    initialState: {
      columnVisibility: {
        id: false,
        teamName: false,
        employeeName: false,
        categoryLabel: false,
        statusText: false,
      },
      density: "compact",
      showGlobalFilter: true,
      grouping: [],
    },
  });

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid #e2e8f0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
            bgcolor: "background.paper",
          }}
        >
          <Tab label="Frånvaro" value="absences" />
          <Tab label="Anställda" value="employees" />
          <Tab label="Grupper" value="teams" />
          <Tab label="Kategorier" value="categories" />
        </Tabs>

        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
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
