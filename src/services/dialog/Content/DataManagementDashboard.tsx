import { useMemo, useState, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  MaterialReactTable,
  useMaterialReactTable,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFiltersButton,
  MRT_ToggleGlobalFilterButton,
  type MRT_ColumnDef,
  type MRT_TableOptions,
  type MRT_RowData,
  type MRT_TableInstance,
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
import { absence } from "../../stores/absenceDataStore";
import { useDialogStore } from "../dialog";
import { ProTooltip } from "../../../components/ProTooltip";

// ─── Styles ─────────────────────────────────────────────────────────
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

    overflow: "hidden",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#fff",
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
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
    display: "flex",
    flexDirection: "column",
  },
  // Right-aligned action container
  rowActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    width: "100%",
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
    height: 40,
  },
  iconSquareBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "1px solid rgba(25,118,210,0.18)",
    background: "rgba(25,118,210,0.07)",
    color: "#1976d2",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s ease",
    flexShrink: 0,
    padding: 0,
  },
  bulkBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 14px",
    background: "rgba(211,47,47,0.06)",
    borderBottom: "1px solid rgba(211,47,47,0.14)",
    flexShrink: 0,
    minHeight: 44,
  },
  bulkBarText: {
    fontSize: 13,
    fontWeight: 600,
    color: "#d32f2f",
    flex: 1,
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
  actionBtnMuted: { opacity: 0.7 },
  actionBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
    pointerEvents: "none" as const,
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
  portalOverlay: { position: "fixed", inset: 0, zIndex: 99998 },
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

// ─── Filter ─────────────────────────────────────────────────────────
const globalContainsFilter = (
  row: any,
  _columnId: string,
  filterValue: string,
) => {
  const search = String(filterValue ?? "")
    .toLowerCase()
    .trim();
  if (!search) return true;
  const text = Object.values(row.original ?? {})
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
  return text.includes(search);
};

// ─── Icons ──────────────────────────────────────────────────────────
const AddIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 3v1H4v2h1v13a2 2 0 002 2h10a2 2 0 002-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z" />
  </svg>
);
const SearchIcon = () => (
  <span style={{ display: "flex", alignItems: "center", fontSize: 14 }}>
    🔎
  </span>
);

// ─── ActionButton ───────────────────────────────────────────────────
const ActionButton = ({
  children,
  onClick,
  variant = "default",
  disabled = false,
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
  disabled?: boolean;
  style?: CSSProperties;
}) => {
  const v =
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
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...styles.actionBtnBase,
        ...v,
        ...(disabled ? styles.actionBtnDisabled : {}),
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
    style={{ ...styles.tabBtn, ...(active ? styles.tabBtnActive : {}) }}
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

// ─── BulkDeleteBar ──────────────────────────────────────────────────
const BulkDeleteBar = ({
  count,
  onDelete,
  onClear,
  entityLabel,
}: {
  count: number;
  onDelete: () => void;
  onClear: () => void;
  entityLabel: string;
}) => {
  if (count === 0) return null;
  return (
    <div style={styles.bulkBar}>
      <span style={styles.bulkBarText}>
        {count} {entityLabel} vald{count !== 1 ? "a" : ""}
      </span>
      <ActionButton variant="default" onClick={onClear}>
        Avmarkera alla
      </ActionButton>
      <ActionButton variant="dangerContained" onClick={onDelete}>
        <TrashIcon />
        &nbsp;Ta bort valda
      </ActionButton>
    </div>
  );
};

// ─── RowDeleteButton ────────────────────────────────────────────────
const RowDeleteButton = ({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) => {
  const button = (
    <ActionButton variant="danger" disabled={disabled} onClick={onClick}>
      Ta bort
    </ActionButton>
  );
  if (disabled) {
    return (
      <ProTooltip
        title="Använd 'Ta bort valda' ovan för att radera markerade rader"
        placement="left"
        color="#d32f2f"
      >
        <span style={{ display: "inline-flex" }}>{button}</span>
      </ProTooltip>
    );
  }
  return button;
};

// ─── Types ──────────────────────────────────────────────────────────
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

// ─── Column helpers ─────────────────────────────────────────────────
const getLeftAlignedColumn = <T extends MRT_RowData>(
  col: MRT_ColumnDef<T>,
): MRT_ColumnDef<T> => ({
  ...col,
  muiTableHeadCellProps: {
    sx: {
      textAlign: "left",
      "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start" },
    },
  },
  muiTableBodyCellProps: { sx: { textAlign: "left" } },
});

const getCenterAlignedColumn = <T extends MRT_RowData>(
  col: MRT_ColumnDef<T>,
): MRT_ColumnDef<T> => ({
  ...col,
  muiTableHeadCellProps: {
    sx: {
      textAlign: "left",
      "& .Mui-TableHeadCell-Content": { justifyContent: "left" },
    },
  },
  muiTableBodyCellProps: { sx: { textAlign: "left" } },
});

// ─── Actions column config (Right Alignment) ────────────────────────
const actionsColumnConfig = {
  "mrt-row-actions": {
    header: "Åtgärder",
    size: 200,
    minSize: 160,
    muiTableHeadCellProps: {
      sx: {
        textAlign: "right",
        paddingRight: "16px",
        "& .Mui-TableHeadCell-Content": { justifyContent: "flex-end" },
      },
    },
    muiTableBodyCellProps: {
      sx: {
        textAlign: "right",
        paddingRight: "8px",
        // Force internal MRT wrapper to align right
        "& > div": {
          justifyContent: "flex-end",
        },
      },
    },
  },
};

// ─── Color picker ───────────────────────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const DataManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState<
    "absences" | "employees" | "teams" | "categories"
  >("absences");

  const [absenceSelection, setAbsenceSelection] = useState<
    Record<string, boolean>
  >({});
  const [employeeSelection, setEmployeeSelection] = useState<
    Record<string, boolean>
  >({});
  const [teamSelection, setTeamSelection] = useState<Record<string, boolean>>(
    {},
  );
  const [categorySelection, setCategorySelection] = useState<
    Record<string, boolean>
  >({});

  const byId = absence.useStore((state) => state.byId);
  const absences = useMemo(() => Object.values(byId), [byId]);

  const { data: teams = [] } = useTeams();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();

  const { createTeam, updateTeam, deleteTeam } = useTeamMutation();
  const { createEmployee, updateEmployee, deleteEmployee } =
    useEmployeeMutation();
  const {
    createAbsenceCategory,
    updateAbsenceCategory,
    deleteAbsenceCategory,
  } = useAbsenceCategoryMutation();
  useAbsenceStatusMutation();
  const dialog = useDialogStore();

  // ── Selected IDs ──
  const selectedAbsenceIds = Object.keys(absenceSelection).filter(
    (k) => absenceSelection[k],
  );
  const selectedEmployeeIds = Object.keys(employeeSelection).filter(
    (k) => employeeSelection[k],
  );
  const selectedTeamIds = Object.keys(teamSelection).filter(
    (k) => teamSelection[k],
  );
  const selectedCategoryIds = Object.keys(categorySelection).filter(
    (k) => categorySelection[k],
  );

  const isAbsenceBulk = selectedAbsenceIds.length >= 2;
  const isEmployeeBulk = selectedEmployeeIds.length >= 2;
  const isTeamBulk = selectedTeamIds.length >= 2;
  const isCategoryBulk = selectedCategoryIds.length >= 2;

  // ── Dialog triggers ──
  const handleAddTeam = () =>
    dialog.open("team", {
      title: "Skapa ny grupp",
      onSave: (name: string) => {
        createTeam(name);
        dialog.close();
      },
    });

  const handleAddEmployee = () =>
    dialog.open("employee", {
      title: "Lägg till anställd",
      groups: teams,
      onSave: (name: string, teamId: string) => {
        createEmployee(name, teamId);
        dialog.close();
      },
    });

  const handleAddCategory = () =>
    dialog.open("absenceCategory", {
      title: "Ny frånvarotyp",
      absenceTypes: categories,
      onSave: (label: string, color: string) => {
        createAbsenceCategory(label, color);
        dialog.close();
      },
    });

  // ── Enriched absences ──
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

  // ── Shared MRT config ──
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
        "& .MuiBox-root": { alignItems: "center" },
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
      InputProps: { startAdornment: <SearchIcon /> },
    },
    enableStickyHeader: true,
    muiTableContainerProps: {
      sx: { flex: 1, overflow: "auto", maxHeight: "unset" },
    },
    muiTableBodyProps: { sx: { overflow: "auto" } },
    filterFns: { globalContains: globalContainsFilter },
    globalFilterFn: "globalContains" as const,
    enableGlobalFilterModes: false,
    enableFilterMatchHighlighting: true,
    enableColumnFilters: true,
    enableFilters: true,
    displayColumnDefOptions: actionsColumnConfig,
  };

  // ── Custom icons for Save/Cancel (Built-in customization) ──
  const sharedIcons = {
    SaveIcon: () => (
      <ActionButton variant="successContained">Spara</ActionButton>
    ),
    CancelIcon: () => <ActionButton variant="danger">Avbryt</ActionButton>,
  };

  // ── Toolbar ──
  const renderToolbarInternalActions = (
    table: MRT_TableInstance<any>,
    addFn: () => void,
    tooltip: string,
  ) => (
    <div style={styles.toolbarActions}>
      <ProTooltip title={tooltip} placement="bottom">
        <button onClick={addFn} style={styles.iconSquareBtn} type="button">
          <AddIcon />
        </button>
      </ProTooltip>
      <MRT_ToggleGlobalFilterButton table={table} />
      <MRT_ToggleFiltersButton table={table} />
      <MRT_ShowHideColumnsButton table={table} />
      <MRT_ToggleDensePaddingButton table={table} />
    </div>
  );

  // ═════════════════════════════════════════════════════════════════
  // EMPLOYEE TABLE
  // ═════════════════════════════════════════════════════════════════
  const handleSaveEmployee: MRT_TableOptions<Employee>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      await updateEmployee(row.original.id, values.name, values.teamId);
      table.setEditingRow(null);
    };

  const employeeTable = useMaterialReactTable<Employee>({
    positionToolbarAlertBanner: "none",
    columns: useMemo<MRT_ColumnDef<Employee>[]>(
      () => [
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({ accessorKey: "name", header: "Namn" }),
        getCenterAlignedColumn({
          accessorKey: "teamId",
          header: "Grupp",
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
          header: "Grupp (sök)",
          enableEditing: false,
          enableHiding: true,
          enableGlobalFilter: true,
          Cell: ({ row }) =>
            teams.find((t) => t.id === row.original.teamId)?.name ??
            "Inget team",
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
    enableRowSelection: true,
    onRowSelectionChange: setEmployeeSelection,
    state: { rowSelection: employeeSelection },
    // CLEAN: Standard renderRowActions
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
        <RowDeleteButton
          disabled={isEmployeeBulk}
          onClick={() => deleteEmployee(row.original.id)}
        />
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

  // ═════════════════════════════════════════════════════════════════
  // TEAM TABLE
  // ═════════════════════════════════════════════════════════════════
  const handleSaveTeam: MRT_TableOptions<Team>["onEditingRowSave"] = async ({
    values,
    table,
    row,
  }) => {
    await updateTeam(row.original.id, values.name);
    table.setEditingRow(null);
  };

  const teamTable = useMaterialReactTable<Team>({
    positionToolbarAlertBanner: "none",
    columns: useMemo<MRT_ColumnDef<Team>[]>(
      () => [
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({ accessorKey: "name", header: "Gruppnamn" }),
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
    enableRowSelection: true,
    onRowSelectionChange: setTeamSelection,
    state: { rowSelection: teamSelection },
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
        <RowDeleteButton
          disabled={isTeamBulk}
          onClick={() => deleteTeam(row.original.id)}
        />
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

  // ═════════════════════════════════════════════════════════════════
  // CATEGORY TABLE
  // ═════════════════════════════════════════════════════════════════
  const handleSaveCategory: MRT_TableOptions<AbsenceCategory>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      await updateAbsenceCategory(row.original.id, values.label, values.color);
      table.setEditingRow(null);
    };

  const categoryTable = useMaterialReactTable<AbsenceCategory>({
    positionToolbarAlertBanner: "none",
    columns: useMemo<MRT_ColumnDef<AbsenceCategory>[]>(
      () => [
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({ accessorKey: "label", header: "Benämning" }),
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
    enableRowSelection: true,
    onRowSelectionChange: setCategorySelection,
    state: { rowSelection: categorySelection },
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
        <RowDeleteButton
          disabled={isCategoryBulk}
          onClick={() => {
            if (window.confirm("Ta bort kategori?"))
              deleteAbsenceCategory(row.original.id);
          }}
        />
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

  // ═════════════════════════════════════════════════════════════════
  // ABSENCE TABLE
  // ═════════════════════════════════════════════════════════════════
  const handleSaveAbsence: MRT_TableOptions<AbsenceView>["onEditingRowSave"] =
    async ({ values, table, row }) => {
      const start = new Date(values.startDate);
      const end = new Date(values.endDate);
      const calculatedDuration = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / 86400000),
      );
      const originalStart = new Date(row.original.startDate)
        .toISOString()
        .split("T")[0];
      const originalEnd = new Date(row.original.endDate)
        .toISOString()
        .split("T")[0];
      const newStart = new Date(values.startDate).toISOString().split("T")[0];
      const newEnd = new Date(values.endDate).toISOString().split("T")[0];
      const datesChanged = originalStart !== newStart || originalEnd !== newEnd;

      const nextStatus =
        row.original.status === AbsenceStatus.Rejected && datesChanged
          ? AbsenceStatus.Pending
          : (Number(values.status) as AbsenceStatus);
      try {
        await absence.updateOne(row.original.id, {
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
        });
        table.setEditingRow(null);
      } catch (error) {
        console.error("Kunde inte spara:", error);
      }
    };

  const absenceTable = useMaterialReactTable<AbsenceView>({
    positionToolbarAlertBanner: "none",
    columns: useMemo<MRT_ColumnDef<AbsenceView>[]>(
      () => [
        getLeftAlignedColumn({
          accessorKey: "id",
          header: "ID",
          enableEditing: false,
        }),
        getLeftAlignedColumn({
          accessorKey: "teamId",
          header: "Grupp",
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
          header: "Startdatum",
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
            if (startDate < today) {
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
                    {new Date(value).toLocaleDateString("sv-SE")}
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
                  const currentEnd =
                    row._valuesCache.endDate || row.original.endDate;
                  if (
                    currentEnd &&
                    new Date(currentEnd) < new Date(e.target.value)
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
            new Date(cell.getValue<string>()).toLocaleDateString("sv-SE"),
          filterVariant: "date-range",
        }),
        getCenterAlignedColumn({
          accessorKey: "endDate",
          header: "Slutdatum",
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
            const originalStart = new Date(row.original.startDate);
            originalStart.setHours(0, 0, 0, 0);
            const minDate =
              originalStart < today
                ? today.toISOString().split("T")[0]
                : startDateStr;
            return (
              <input
                type="date"
                value={dateValue}
                min={minDate}
                onChange={(e) => {
                  if (new Date(e.target.value) < new Date(startDateValue)) {
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
            new Date(cell.getValue<string>()).toLocaleDateString("sv-SE"),
          filterVariant: "date-range",
        }),
        getCenterAlignedColumn({
          accessorKey: "durationDays",
          header: "Antal dagar",
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
            [startDate, endDate, today].forEach((d) => d.setHours(0, 0, 0, 0));
            const msPerDay = 86400000;
            if (today > endDate)
              return <StatusChip label="Avslutad" color="#94a3b8" />;
            if (today >= startDate && today <= endDate) {
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
            }
            const daysUntil = Math.ceil(
              (startDate.getTime() - today.getTime()) / msPerDay,
            );
            return (
              <StatusChip
                label={
                  daysUntil === 1
                    ? "Startar imorgon"
                    : `Startar om ${daysUntil} dagar`
                }
                color="#1976d2"
              />
            );
          },
          sortingFn: (rowA, rowB) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const msPerDay = 86400000;
            const getScore = (row: any) => {
              const s = new Date(row.original.startDate);
              const e = new Date(row.original.endDate);
              [s, e].forEach((d) => d.setHours(0, 0, 0, 0));
              if (today > e)
                return (
                  10000 + Math.ceil((today.getTime() - e.getTime()) / msPerDay)
                );
              if (today >= s)
                return Math.ceil((e.getTime() - today.getTime()) / msPerDay);
              return (
                5000 + Math.ceil((s.getTime() - today.getTime()) / msPerDay)
              );
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
            const map: Record<number, { label: string; color: string }> = {
              [AbsenceStatus.Pending]: { label: "Väntande", color: "#ed6c02" },
              [AbsenceStatus.Approved]: { label: "Godkänd", color: "#2e7d32" },
              [AbsenceStatus.Rejected]: { label: "Avvisad", color: "#d32f2f" },
            };
            const cfg = map[status] ?? { label: "Okänd", color: "#666" };
            return <StatusChip label={cfg.label} color={cfg.color} />;
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
          header: "Grupp (sök)",
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
    icons: sharedIcons,
    enableGrouping: true,
    enableColumnDragging: true,
    enableColumnOrdering: true,
    enableEditing: true,
    editDisplayMode: "row",
    getRowId: (row) => row.id,
    onEditingRowSave: handleSaveAbsence,
    enableRowActions: true,
    positionActionsColumn: "last",
    enableRowSelection: true,
    onRowSelectionChange: setAbsenceSelection,
    state: { rowSelection: absenceSelection },
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
          <RowDeleteButton
            disabled={isAbsenceBulk}
            onClick={() => {
              if (window.confirm("Ta bort frånvaro?"))
                absence.removeOne(row.original.id);
            }}
          />
        </div>
      );
    },
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

  // ── Bulk delete handlers ──
  const handleBulkDeleteAbsences = () => {
    if (!window.confirm(`Ta bort ${selectedAbsenceIds.length} frånvaro?`))
      return;
    selectedAbsenceIds.forEach((id) => absence.removeOne(id));
    setAbsenceSelection({});
  };
  const handleBulkDeleteEmployees = () => {
    if (!window.confirm(`Ta bort ${selectedEmployeeIds.length} anställda?`))
      return;
    selectedEmployeeIds.forEach((id) => deleteEmployee(id));
    setEmployeeSelection({});
  };
  const handleBulkDeleteTeams = () => {
    if (!window.confirm(`Ta bort ${selectedTeamIds.length} grupper?`)) return;
    selectedTeamIds.forEach((id) => deleteTeam(id));
    setTeamSelection({});
  };
  const handleBulkDeleteCategories = () => {
    if (!window.confirm(`Ta bort ${selectedCategoryIds.length} kategorier?`))
      return;
    selectedCategoryIds.forEach((id) => deleteAbsenceCategory(id));
    setCategorySelection({});
  };

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>

      <div style={styles.root}>
        <div style={styles.shell}>
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
                <BulkDeleteBar
                  count={selectedAbsenceIds.length}
                  entityLabel="frånvaro"
                  onDelete={handleBulkDeleteAbsences}
                  onClear={() => setAbsenceSelection({})}
                />
                <MaterialReactTable table={absenceTable} />
              </div>
            )}
            {activeTab === "employees" && (
              <div style={styles.tabPane}>
                <BulkDeleteBar
                  count={selectedEmployeeIds.length}
                  entityLabel="anställda"
                  onDelete={handleBulkDeleteEmployees}
                  onClear={() => setEmployeeSelection({})}
                />
                <MaterialReactTable table={employeeTable} />
              </div>
            )}
            {activeTab === "teams" && (
              <div style={styles.tabPane}>
                <BulkDeleteBar
                  count={selectedTeamIds.length}
                  entityLabel="grupper"
                  onDelete={handleBulkDeleteTeams}
                  onClear={() => setTeamSelection({})}
                />
                <MaterialReactTable table={teamTable} />
              </div>
            )}
            {activeTab === "categories" && (
              <div style={styles.tabPane}>
                <BulkDeleteBar
                  count={selectedCategoryIds.length}
                  entityLabel="kategorier"
                  onDelete={handleBulkDeleteCategories}
                  onClear={() => setCategorySelection({})}
                />
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
