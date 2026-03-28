import { useMemo, useState, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFiltersButton,
  type MRT_ColumnDef,
  type MRT_TableOptions,
  type MRT_RowData,
} from "material-react-table";
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
  useAbsenceCategories,
  useEmployees,
  useTeams,
} from "../../hooks/useData";
import { dialog } from "../dialogStore";
import { absence } from "../../stores/absenceDataStore";

const styles: Record<string, CSSProperties> = {
  root: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background:
      "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%)",
  },

  shell: {
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    overflow: "hidden",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
  },

  headerBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid #e2e8f0",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
    flexShrink: 0,
  },

  headerTitle: {
    fontSize: "1rem",
    fontWeight: 800,
    color: "#0f172a",
  },

  closeBtn: {
    height: 34,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fff",
    color: "#475569",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tabsBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.96) 100%)",
    flexShrink: 0,
    flexWrap: "wrap",
  },

  tabBtn: {
    padding: "10px 14px",
    border: "1px solid transparent",
    outline: "none",
    background: "transparent",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
    color: "#475569",
    transition: "all 0.2s ease",
  },

  tabBtnActive: {
    background: "rgba(25,118,210,0.08)",
    border: "1px solid rgba(25,118,210,0.16)",
    color: "#1976d2",
    boxShadow: "inset 0 0 0 1px rgba(25,118,210,0.06)",
  },

  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
  },

  tabPane: {
    height: "100%",
    animation: "fadeSlideIn 0.2s ease-out",
  },

  rowActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  },

  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  },

  iconSquareBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(25,118,210,0.16)",
    background: "rgba(25,118,210,0.08)",
    color: "#1976d2",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s ease",
    flexShrink: 0,
  },

  actionBtnBase: {
    height: 30,
    minWidth: 0,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid #d0d7de",
    background: "#fff",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.18s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    whiteSpace: "nowrap",
  },

  actionBtnPrimary: {
    border: "1px solid rgba(25,118,210,0.22)",
    background: "rgba(25,118,210,0.05)",
    color: "#1976d2",
  },

  actionBtnDanger: {
    border: "1px solid rgba(211,47,47,0.22)",
    background: "#fff",
    color: "#d32f2f",
  },

  actionBtnSuccessContained: {
    border: "none",
    background: "#2A780E",
    color: "#fff",
  },

  actionBtnDangerContained: {
    border: "none",
    background: "#d32f2f",
    color: "#fff",
  },

  actionBtnMuted: {
    opacity: 0.7,
  },

  chip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    whiteSpace: "nowrap",
  },

  statusChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    whiteSpace: "nowrap",
  },

  pickerButton: {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#fff",
    cursor: "pointer",
    fontSize: 12,
  },

  portalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 99998,
  },

  portalDropdown: {
    position: "absolute",
    background: "#fff",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
    zIndex: 99999,
    maxHeight: 220,
    overflowY: "auto",
  },

  portalOption: {
    padding: "8px 10px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.18s ease",
  },
};
const globalContainsFilter = (
  row: any,
  _columnId: string,
  filterValue: string,
) => {
  const search = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!search) return true;

  const original = row.original ?? {};

  const text = Object.values(original)
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");

  return text.includes(search);
};
const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
);

const SearchIcon = () => (
  <span style={{ display: "flex", alignItems: "center", fontSize: 14 }}>
    🔎
  </span>
);

const ActionButton = ({
  children,
  onClick,
  variant = "default",
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?:
    | "default"
    | "primary"
    | "danger"
    | "successContained"
    | "dangerContained"
    | "muted";
  style?: CSSProperties;
}) => {
  const variantStyle =
    variant === "primary"
      ? styles.actionBtnPrimary
      : variant === "danger"
        ? styles.actionBtnDanger
        : variant === "successContained"
          ? styles.actionBtnSuccessContained
          : variant === "dangerContained"
            ? styles.actionBtnDangerContained
            : variant === "muted"
              ? styles.actionBtnMuted
              : {};

  return (
    <button
      onClick={onClick}
      style={{
        ...styles.actionBtnBase,
        ...variantStyle,
        ...style,
      }}
    >
      {children}
    </button>
  );
};

const TabButton = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      ...styles.tabBtn,
      ...(active ? styles.tabBtnActive : {}),
    }}
  >
    {label}
  </button>
);

const CategoryChip = ({
  label,
  bgColor,
}: {
  label: string;
  bgColor: string;
}) => <span style={{ ...styles.chip, backgroundColor: bgColor }}>{label}</span>;

const StatusChip = ({ label, color }: { label: string; color: string }) => (
  <span style={{ ...styles.statusChip, backgroundColor: color }}>{label}</span>
);

interface AbsenceView extends Absence {
  employeeName: string;
  teamName: string;
  categoryLabel: string;
  color: string;
  statusText: string;
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

const getLeftAlignedColumn = <T extends MRT_RowData>(
  col: MRT_ColumnDef<T>,
): MRT_ColumnDef<T> => ({
  ...col,
  muiTableHeadCellProps: {
    sx: {
      textAlign: "left",
      "& .Mui-TableHeadCell-Content": {
        justifyContent: "flex-start",
      },
    },
  },
  muiTableBodyCellProps: {
    sx: {
      textAlign: "left",
    },
  },
});

const getCenterAlignedColumn = <T extends MRT_RowData>(
  col: MRT_ColumnDef<T>,
): MRT_ColumnDef<T> => ({
  ...col,
  muiTableHeadCellProps: {
    sx: {
      textAlign: "center",
      "& .Mui-TableHeadCell-Content": {
        justifyContent: "center",
      },
    },
  },
  muiTableBodyCellProps: {
    sx: {
      textAlign: "center",
    },
  },
});

const PureColorPicker = ({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (c: string) => void;
  colors: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setIsOpen((prev) => !prev);
  };
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        style={styles.pickerButton}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: value,
            border: "1px solid #eee",
          }}
        />
        <span style={{ fontSize: 12, fontFamily: "monospace" }}>{value}</span>
        <span style={{ marginLeft: "auto", fontSize: 10 }}>▼</span>
      </button>

      {isOpen &&
        createPortal(
          <>
            <div
              style={styles.portalOverlay}
              onClick={() => setIsOpen(false)}
            />
            <div
              style={{
                ...styles.portalDropdown,
                top: pos.top,
                left: pos.left,
                minWidth: pos.width,
              }}
            >
              {colors.map((c) => (
                <div
                  key={c}
                  onClick={() => {
                    onChange(c);
                    setIsOpen(false);
                  }}
                  style={styles.portalOption}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f8fafc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: c,
                      border: "1px solid #ddd",
                    }}
                  />
                  <span style={{ fontSize: 13, fontFamily: "monospace" }}>
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
};

const DataManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState<
    "absences" | "employees" | "teams" | "categories"
  >("absences");
  const byId = absence.useStore((state) => state.byId);
  const absences = useMemo(() => Object.values(byId), [byId]);
  const { data: teams = [] } = useTeams();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
const absen = loadall()
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
        borderBottom: "1px solid #eef2f7",
        minHeight: "56px",
        overflowX: "hidden",
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
      sx: {
        backgroundColor: "#ffffff",
        fontWeight: "bold",
      },
    },
    muiSearchTextFieldProps: {
      size: "small" as const,
      variant: "outlined" as const,
      placeholder: "Sök namn, team, kategori, status, datum...",
      sx: {
        m: "8px",
        minWidth: 0,
        width: { xs: "100%", sm: "360px" },
        "& .MuiOutlinedInput-root": {
          borderRadius: "14px",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow: "0 2px 10px rgba(15,23,42,0.04)",
          transition: "all 0.2s ease",
        },
        "& .MuiOutlinedInput-root:hover": {
          boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
        },
        "& .MuiOutlinedInput-root.Mui-focused": {
          boxShadow: "0 0 0 4px rgba(25,118,210,0.08)",
        },
      },
      InputProps: {
        startAdornment: <SearchIcon />,
      },
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
      sx: { overflow: "auto" },
    },
    filterFns: {
      globalContains: globalContainsFilter,
    },
    globalFilterFn: "globalContains" as const,
    enableGlobalFilterModes: false,
    enableFilterMatchHighlighting: true,
    enableColumnFilters: true,
    enableFilters: true,
    displayColumnDefOptions: {
      "mrt-row-actions": {
        muiTableHeadCellProps: {
          sx: {
            textAlign: "right",
            "& .Mui-TableHeadCell-Content": {
              justifyContent: "flex-end",
            },
          },
        },
        muiTableBodyCellProps: {
          sx: {
            textAlign: "right",
          },
        },
      },
    },
  };

  const renderToolbarInternalActions = (
    table: any,
    addFn: () => void,
    tooltip: string,
  ) => (
    <div style={styles.toolbarActions}>
      <button title={tooltip} onClick={addFn} style={styles.iconSquareBtn}>
        <AddIcon />
      </button>
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleDensePaddingButton table={table} />
    </div>
  );

  const sharedIcons = {
    SaveIcon: () => (
      <ActionButton variant="successContained">Spara</ActionButton>
    ),
    CancelIcon: () => <ActionButton variant="danger">Avbryt</ActionButton>,
  };

  const handleSaveEmployee: MRT_TableOptions<Employee>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      await updateEmployee(row.original.id, values.name, values.teamId);
      table.setEditingRow(null);
    };

  const employeeTable = useMaterialReactTable<Employee>({
    columns: useMemo<MRT_ColumnDef<Employee>[]>(
      () => [
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({
          accessorKey: "name",
          header: "Namn",
        }),
        getCenterAlignedColumn({
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
        }),
        getCenterAlignedColumn({
          accessorKey: "teamName",
          header: "Team (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
          Cell: ({ row }) => {
            const team = teams.find((t) => t.id === row.original.teamId);
            return team?.name ?? "Inget team";
          },
        }),
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
      <div style={styles.rowActions}>
        <ActionButton
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={() => deleteEmployee(row.original.id)}
        >
          Ta bort
        </ActionButton>
      </div>
    ),
    renderToolbarInternalActions: ({ table }) =>
      renderToolbarInternalActions(
        table,
        handleAddEmployee,
        "Lägg till anställd",
      ),
    ...whiteTableConfig,
    initialState: {
      showGlobalFilter: true,
      density: "compact",
      columnVisibility: { id: false, teamName: false },
      grouping: [],
    },
  });

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
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({
          accessorKey: "name",
          header: "Gruppnamn",
        }),
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
      <div style={styles.rowActions}>
        <ActionButton
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={() => deleteTeam(row.original.id)}
        >
          Ta bort
        </ActionButton>
      </div>
    ),
    renderToolbarInternalActions: ({ table }) =>
      renderToolbarInternalActions(table, handleAddTeam, "Lägg till grupp"),
    ...whiteTableConfig,
    initialState: {
      columnVisibility: { id: false },
      density: "compact",
      showGlobalFilter: true,
    },
  });

  const handleSaveCategory: MRT_TableOptions<AbsenceCategory>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      await updateAbsenceCategory(row.original.id, values.label, values.color);
      table.setEditingRow(null);
    };

  const categoryTable = useMaterialReactTable<AbsenceCategory>({
    columns: useMemo<MRT_ColumnDef<AbsenceCategory>[]>(
      () => [
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({
          accessorKey: "label",
          header: "Benämning",
        }),
        getCenterAlignedColumn({
          accessorKey: "color",
          header: "Färg",
          Edit: ({ cell, row, table }) => {
            const currentColor = cell.getValue<string>();

            const takenColors = categories
              .filter((c) => c.id !== row.original.id)
              .map((c) => c.color);

            const availableColors = PREDEFINED_COLORS.filter(
              (color) => color === currentColor || !takenColors.includes(color),
            );

            return (
              <PureColorPicker
                value={currentColor}
                colors={availableColors}
                onChange={(newColor) => {
                  row._valuesCache.color = newColor;
                  table.setEditingRow({ ...row });
                }}
              />
            );
          },
          Cell: ({ cell }) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: cell.getValue<string>(),
                  border: "1px solid #ddd",
                }}
              />
              <span style={{ fontSize: "0.9rem" }}>
                {cell.getValue<string>()}
              </span>
            </div>
          ),
        }),
      ],
      [],
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
      <div style={styles.rowActions}>
        <ActionButton
          onClick={() => {
            table.setEditingRow(null);
            setTimeout(() => table.setEditingRow(row), 0);
          }}
        >
          Redigera
        </ActionButton>
        <ActionButton
          variant="danger"
          onClick={() => {
            if (window.confirm("Ta bort?"))
              deleteAbsenceCategory(row.original.id);
          }}
        >
          Ta bort
        </ActionButton>
      </div>
    ),
    renderToolbarInternalActions: ({ table }) =>
      renderToolbarInternalActions(
        table,
        handleAddCategory,
        "Skapa frånvarotyp",
      ),
    ...whiteTableConfig,
    initialState: {
      columnVisibility: { id: false },
      density: "compact",
      showGlobalFilter: true,
    },
  });

const handleSaveAbsence: MRT_TableOptions<AbsenceView>["onEditingRowSave"] =
  async ({ values, table, row }) => {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    const diffTime = end.getTime() - start.getTime();
    const calculatedDuration = Math.max(
      1,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
    );

    const originalEnd = new Date(row.original.endDate)
      .toISOString()
      .split("T")[0];
    const newEnd = new Date(values.endDate).toISOString().split("T")[0];
    const originalStart = new Date(row.original.startDate)
      .toISOString()
      .split("T")[0];
    const newStart = new Date(values.startDate).toISOString().split("T")[0];

    const datesChanged =
      originalStart !== newStart || originalEnd !== newEnd;

    const nextStatus =
      row.original.status === AbsenceStatus.Rejected && datesChanged
        ? AbsenceStatus.Pending
        : (Number(values.status) as AbsenceStatus);

    const updatePayload = {
      id: row.original.id,
      employeeId: row.original.employeeId,
      startDate: values.startDate,
      durationDays: Number(calculatedDuration),
      absenceCategoryId: values.absenceCategoryId,
      status: nextStatus,
      rejectionReason:
        nextStatus === AbsenceStatus.Rejected
          ? row.original.rejectionReason
          : undefined,
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
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({
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
        }),
        getLeftAlignedColumn({
          accessorKey: "employeeId",
          header: "Anställd",
          enableGrouping: true,
          enableEditing: false,
          Cell: ({ row }) => row.original.employeeName,
        }),
        getCenterAlignedColumn({
          accessorKey: "absenceCategoryId",
          header: "Kategori",
          enableGrouping: true,
          Cell: ({ row }) => (
            <CategoryChip
              label={row.original.categoryLabel}
              bgColor={row.original.color}
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
        }),
        getCenterAlignedColumn({
          accessorKey: "startDate",
          header: "Start",
          Edit: ({ cell, row }) => {
            const value = cell.getValue<string>();
            const [dateValue, setDateValue] = useState(() =>
              value ? new Date(value).toISOString().split("T")[0] : "",
            );

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split("T")[0];

            const startDate = new Date(value);
            startDate.setHours(0, 0, 0, 0);
            const hasPassed = startDate < today;

            if (hasPassed) {
              return (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <span
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      color: "#666",
                      fontSize: 14,
                    }}
                  >
                    {new Date(value).toLocaleDateString()}
                  </span>
                  <span style={{ fontSize: 11, color: "#d32f2f" }}>
                    Kan inte ändra passerat datum
                  </span>
                </div>
              );
            }

            return (
              <input
                type="date"
                value={dateValue}
                min={todayStr}
                onChange={(e) => {
                  setDateValue(e.target.value);
                  row._valuesCache.startDate = e.target.value;
                  const currentEndDate =
                    row._valuesCache.endDate || row.original.endDate;
                  if (
                    currentEndDate &&
                    new Date(currentEndDate) < new Date(e.target.value)
                  ) {
                    row._valuesCache.endDate = e.target.value;
                  }
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  fontSize: 14,
                  width: "100%",
                }}
              />
            );
          },
          Cell: ({ cell }) =>
            new Date(cell.getValue<string>()).toLocaleDateString(),
          filterVariant: "date-range",
        }),
        getCenterAlignedColumn({
          accessorKey: "endDate",
          header: "Slut",
          Edit: ({ cell, row }) => {
            const value = cell.getValue<string>();
            const [dateValue, setDateValue] = useState(() =>
              value ? new Date(value).toISOString().split("T")[0] : "",
            );

            const startDateValue =
              row._valuesCache?.startDate || row.original.startDate;
            const startDateStr = startDateValue
              ? new Date(startDateValue).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0];

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const originalStartDate = new Date(row.original.startDate);
            originalStartDate.setHours(0, 0, 0, 0);

            const minDate =
              originalStartDate < today
                ? today.toISOString().split("T")[0]
                : startDateStr;

            return (
              <input
                type="date"
                value={dateValue}
                min={minDate}
                onChange={(e) => {
                  const newEndDate = new Date(e.target.value);
                  const startDate = new Date(startDateValue);
                  if (newEndDate < startDate) {
                    alert("Slutdatum kan inte vara före startdatum");
                    return;
                  }
                  setDateValue(e.target.value);
                  row._valuesCache.endDate = e.target.value;
                }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  fontSize: 14,
                  width: "100%",
                }}
              />
            );
          },
          Cell: ({ cell }) =>
            new Date(cell.getValue<string>()).toLocaleDateString(),
          filterVariant: "date-range",
        }),
        getCenterAlignedColumn({
          accessorKey: "durationDays",
          header: "Dagar",
          enableEditing: false,
        }),
        getCenterAlignedColumn({
          id: "daysRemaining",
          header: "Tid kvar",
          enableEditing: false,
          enableSorting: true,
          enableColumnFilter: false,
          Cell: ({ row }) => {
            const startDate = new Date(row.original.startDate);
            const endDate = new Date(row.original.endDate);
            const today = new Date();

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            const msPerDay = 1000 * 60 * 60 * 24;

            if (today > endDate) {
              return <StatusChip label="Avslutad" color="#94a3b8" />;
            } else if (today >= startDate && today <= endDate) {
              const daysLeft = Math.ceil(
                (endDate.getTime() - today.getTime()) / msPerDay,
              );
              return (
                <StatusChip
                  label={
                    daysLeft === 0
                      ? "Sista dagen"
                      : daysLeft === 1
                        ? "1 dag kvar"
                        : `${daysLeft} dagar kvar`
                  }
                  color="#ed6c02"
                />
              );
            } else {
              const daysUntilStart = Math.ceil(
                (startDate.getTime() - today.getTime()) / msPerDay,
              );
              return (
                <StatusChip
                  label={
                    daysUntilStart === 1
                      ? "Startar imorgon"
                      : `Startar om ${daysUntilStart} dagar`
                  }
                  color="#1976d2"
                />
              );
            }
          },
          sortingFn: (rowA, rowB) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const msPerDay = 1000 * 60 * 60 * 24;

            const getScore = (row: any) => {
              const startDate = new Date(row.original.startDate);
              const endDate = new Date(row.original.endDate);
              startDate.setHours(0, 0, 0, 0);
              endDate.setHours(0, 0, 0, 0);

              if (today > endDate) {
                return (
                  10000 +
                  Math.ceil((today.getTime() - endDate.getTime()) / msPerDay)
                );
              } else if (today >= startDate && today <= endDate) {
                return Math.ceil(
                  (endDate.getTime() - today.getTime()) / msPerDay,
                );
              } else {
                return (
                  5000 +
                  Math.ceil((startDate.getTime() - today.getTime()) / msPerDay)
                );
              }
            };

            return getScore(rowA) - getScore(rowB);
          },
        }),
        getCenterAlignedColumn({
          accessorKey: "status",
          header: "Status",
          enableGrouping: true,
          editVariant: "select",
          editSelectOptions: [
            { value: AbsenceStatus.Pending, label: "Väntande" },
            { value: AbsenceStatus.Approved, label: "Godkänd" },
            { value: AbsenceStatus.Rejected, label: "Avvisad" },
          ],
          Cell: ({ cell }) => {
            const status = cell.getValue<number>();
            const statusConfig: Record<
              number,
              { label: string; color: string }
            > = {
              [AbsenceStatus.Pending]: { label: "Väntande", color: "#ed6c02" },
              [AbsenceStatus.Approved]: { label: "Godkänd", color: "#2e7d32" },
              [AbsenceStatus.Rejected]: { label: "Avvisad", color: "#d32f2f" },
            };
            const config = statusConfig[status] ?? {
              label: "Okänd",
              color: "#666",
            };
            return <StatusChip label={config.label} color={config.color} />;
          },
          filterVariant: "select",
          filterSelectOptions: [
            { value: AbsenceStatus.Pending, label: "Väntande" },
            { value: AbsenceStatus.Approved, label: "Godkänd" },
            { value: AbsenceStatus.Rejected, label: "Avvisad" },
          ],
        }),
        getCenterAlignedColumn({
          accessorKey: "teamName",
          header: "Team (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        }),
        getCenterAlignedColumn({
          accessorKey: "employeeName",
          header: "Anställd (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        }),
        getCenterAlignedColumn({
          accessorKey: "categoryLabel",
          header: "Kategori (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        }),
        getCenterAlignedColumn({
          accessorKey: "statusText",
          header: "Status (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
        }),
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
    renderRowActions: ({ row, table }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(row.original.startDate);
      startDate.setHours(0, 0, 0, 0);
      const canEdit = startDate >= today;

      return (
        <div style={styles.rowActions}>
          <ActionButton
            variant={!canEdit ? "muted" : "default"}
            onClick={() => {
              table.setEditingRow(null);
              setTimeout(() => table.setEditingRow(row), 0);
            }}
          >
            {canEdit ? "Redigera" : "Visa/Ändra"}
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => {
              if (window.confirm("Ta bort frånvaro?")) {
                absence.removeOne(row.original.id);
              }
            }}
          >
            Ta bort
          </ActionButton>
        </div>
      );
    },
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
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={styles.root}>
        <div style={styles.shell}>
          <div style={styles.headerBar}>
            <div style={styles.headerTitle}>Data Management</div>
            <button style={styles.closeBtn} onClick={() => dialog.close()}>
              Stäng
            </button>
          </div>

          <div style={styles.tabsBar}>
            <TabButton
              active={activeTab === "absences"}
              label="Frånvaro"
              onClick={() => setActiveTab("absences")}
            />
            <TabButton
              active={activeTab === "employees"}
              label="Anställda"
              onClick={() => setActiveTab("employees")}
            />
            <TabButton
              active={activeTab === "teams"}
              label="Grupper"
              onClick={() => setActiveTab("teams")}
            />
            <TabButton
              active={activeTab === "categories"}
              label="Kategorier"
              onClick={() => setActiveTab("categories")}
            />
          </div>

          <div style={styles.content}>
            {activeTab === "absences" && (
              <div style={styles.tabPane}>
                <MaterialReactTable table={absenceTable} />
              </div>
            )}
            {activeTab === "employees" && (
              <div style={styles.tabPane}>
                <MaterialReactTable table={employeeTable} />
              </div>
            )}
            {activeTab === "teams" && (
              <div style={styles.tabPane}>
                <MaterialReactTable table={teamTable} />
              </div>
            )}
            {activeTab === "categories" && (
              <div style={styles.tabPane}>
                <MaterialReactTable table={categoryTable} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DataManagementDashboard;
