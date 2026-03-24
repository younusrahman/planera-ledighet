import { useRef, useState, useLayoutEffect, useMemo, useEffect } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import useFilterStore, {
  type TeamSelection,
} from "../../services/stores/analyticsStore";
import { useTeams, useEmployees } from "../../services/hooks/useData";
import { AbsenceStatus } from "../../types";

interface FilterBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  availableCategories: Array<{ id: string; label: string; color?: string }>;
}

const statusOptions = [
  { value: AbsenceStatus.Pending, label: "Pending" },
  { value: AbsenceStatus.Approved, label: "Godkänd" },
  { value: AbsenceStatus.Rejected, label: "Avvisad" },
];

const colorToBg = (color: string) => {
  if (color.includes("blue")) return "bg-blue-100 text-blue-700";
  if (color.includes("green")) return "bg-green-100 text-green-700";
  if (color.includes("orange") || color.includes("amber"))
    return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-700";
};

const ChipItem = ({
  label,
  colorClass = "bg-gray-100 text-gray-700",
}: {
  label: string;
  colorClass?: string;
}) => (
  <span
    className={`inline-flex h-5 items-center rounded-full px-2 text-[0.65rem] font-semibold ${colorClass}`}
  >
    {label}
  </span>
);

const DynamicChips = ({
  selected,
  getLabel,
  colorClass,
  containerRef,
  allSelectedLabel,
}: any) => {
  const [limit, setLimit] = useState(1);

  useLayoutEffect(() => {
    const calculateFit = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const availableWidth = width - 50;
        const canFit = Math.max(1, Math.floor(availableWidth / 70));
        setLimit(canFit);
      }
    };

    const observer = new ResizeObserver(calculateFit);
    if (containerRef.current) observer.observe(containerRef.current);
    calculateFit();
    return () => observer.disconnect();
  }, [containerRef, selected]);

  if (allSelectedLabel) {
    return <ChipItem label={allSelectedLabel} colorClass={colorClass} />;
  }

  const display = (selected || []).slice(0, limit);
  const extra = (selected || []).length - limit;

  return (
    <div className="flex w-full items-center gap-1 overflow-hidden">
      {display.map((id: any) => (
        <ChipItem key={id} label={getLabel(id)} colorClass={colorClass} />
      ))}
      {extra > 0 && <ChipItem label={`+${extra}`} colorClass={colorClass} />}
    </div>
  );
};

function DropdownContainer({
  label,
  open,
  setOpen,
  trigger,
  children,
}: {
  label: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        <div className="min-w-0 flex-1 overflow-hidden">{trigger}</div>
        <span className="ml-2 text-gray-500">
          {open ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-[400px] w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  availableCategories,
}: FilterBarProps) {
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

  const [teamOpen, setTeamOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const f1 = useRef<HTMLDivElement>(null);
  const f2 = useRef<HTMLDivElement>(null);
  const f3 = useRef<HTMLDivElement>(null);

  const { data: teams = [] } = useTeams();
  const { data: employees = [] } = useEmployees();

  const {
    selectedCategoryIds,
    selectedStatuses,
    setSelectedCategoryIds,
    setSelectedStatuses,
    teamSelections,
    setTeamSelections,
    getSelectedEmployeeIds,
    setIsAllSelected,
  } = useFilterStore();

  useEffect(() => {
    if (!isInitialized && teams.length > 0 && teamSelections.length === 0) {
      const allTeamsSelected: TeamSelection[] = teams.map((team) => ({
        teamId: team.id,
        employeeIds: [],
        isIndeterminate: false,
      }));
      setTeamSelections(allTeamsSelected);
      setIsAllSelected(true);
      setIsInitialized(true);
    }
  }, [
    teams,
    teamSelections.length,
    setTeamSelections,
    setIsAllSelected,
    isInitialized,
  ]);

  const selectedEmployeeIds = useMemo(() => {
    return getSelectedEmployeeIds(employees);
  }, [teamSelections, employees, getSelectedEmployeeIds]);

  const allTeamsSelected = useMemo(() => {
    if (teams.length === 0) return false;
    return (
      teamSelections.length === teams.length &&
      teamSelections.every((s) => s.employeeIds.length === 0)
    );
  }, [teamSelections, teams.length]);

  const getEmployeeLabel = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    return emp?.name || "";
  };

  const isTeamFullySelected = (teamId: string) => {
    const selection = teamSelections.find((s) => s.teamId === teamId);
    if (!selection) return false;
    const teamEmployees = employees.filter((e) => e.teamId === teamId);
    return (
      selection.employeeIds.length === 0 ||
      selection.employeeIds.length === teamEmployees.length
    );
  };

  const isTeamPartiallySelected = (teamId: string) => {
    const selection = teamSelections.find((s) => s.teamId === teamId);
    if (!selection) return false;
    if (selection.employeeIds.length === 0) return false;
    const teamEmployees = employees.filter((e) => e.teamId === teamId);
    return (
      selection.employeeIds.length > 0 &&
      selection.employeeIds.length < teamEmployees.length
    );
  };

  const isEmployeeSelected = (teamId: string, empId: string) => {
    const selection = teamSelections.find((s) => s.teamId === teamId);
    if (!selection) return false;
    if (selection.employeeIds.length === 0) return true;
    return selection.employeeIds.includes(empId);
  };

  const toggleTeamExpand = (teamId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) newExpanded.delete(teamId);
    else newExpanded.add(teamId);
    setExpandedTeams(newExpanded);
  };

  const handleTeamToggle = (teamId: string) => {
    const existingIndex = teamSelections.findIndex((s) => s.teamId === teamId);

    if (existingIndex >= 0) {
      const newSelections = [...teamSelections];
      newSelections.splice(existingIndex, 1);
      setTeamSelections(newSelections);
      setIsAllSelected(false);
    } else {
      setTeamSelections([
        ...teamSelections,
        { teamId, employeeIds: [], isIndeterminate: false },
      ]);
    }
  };

  const handleEmployeeToggle = (teamId: string, empId: string) => {
    const teamEmployees = employees.filter((e) => e.teamId === teamId);
    const existingIndex = teamSelections.findIndex((s) => s.teamId === teamId);

    if (existingIndex === -1) {
      setTeamSelections([
        ...teamSelections,
        { teamId, employeeIds: [empId], isIndeterminate: true },
      ]);
      setIsAllSelected(false);
      return;
    }

    const selection = teamSelections[existingIndex];
    const newSelections = [...teamSelections];

    if (selection.employeeIds.length === 0) {
      const allOtherEmps = teamEmployees
        .filter((e) => e.id !== empId)
        .map((e) => e.id);

      newSelections[existingIndex] = {
        teamId,
        employeeIds: allOtherEmps,
        isIndeterminate: true,
      };
      setIsAllSelected(false);
    } else {
      const currentEmps = selection.employeeIds;

      if (currentEmps.includes(empId)) {
        const newEmps = currentEmps.filter((id) => id !== empId);
        if (newEmps.length === 0) {
          newSelections.splice(existingIndex, 1);
        } else {
          newSelections[existingIndex] = {
            teamId,
            employeeIds: newEmps,
            isIndeterminate: true,
          };
        }
        setIsAllSelected(false);
      } else {
        const newEmps = [...currentEmps, empId];
        if (newEmps.length === teamEmployees.length) {
          newSelections[existingIndex] = {
            teamId,
            employeeIds: [],
            isIndeterminate: false,
          };
          const allTeamsNowSelected =
            newSelections.length === teams.length &&
            newSelections.every((s) => s.employeeIds.length === 0);
          if (allTeamsNowSelected) setIsAllSelected(true);
        } else {
          newSelections[existingIndex] = {
            teamId,
            employeeIds: newEmps,
            isIndeterminate: true,
          };
          setIsAllSelected(false);
        }
      }
    }

    setTeamSelections(newSelections);
  };

  const handleCategoryToggle = (id: string) => {
    if (id === "ALL") {
      setSelectedCategoryIds(["ALL"]);
      return;
    }

    let next = selectedCategoryIds.includes("ALL")
      ? [id]
      : selectedCategoryIds.includes(id)
        ? selectedCategoryIds.filter((v) => v !== id)
        : [...selectedCategoryIds, id];

    if (next.length === 0) next = ["ALL"];
    setSelectedCategoryIds(next);
  };

  const handleStatusToggle = (value: number) => {
    const exists = selectedStatuses.includes(value);
    const next = exists
      ? selectedStatuses.filter((s) => s !== value)
      : [...selectedStatuses, value];

    if (next.length === 0) {
      setSelectedStatuses(statusOptions.map((s) => s.value));
    } else {
      setSelectedStatuses(next);
    }
  };

  const getCategoryLabel = (id: string) => {
    if (id === "ALL") return "Alla";
    return availableCategories.find((c) => c.id === id)?.label || "";
  };

  const getStatusLabel = (id: number) => {
    return statusOptions.find((opt) => opt.value === id)?.label || "";
  };

  return (
    <div className="mb-2 w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {/* Team & Employees */}
        <div ref={f1}>
          <DropdownContainer
            label="Team & Anställda"
            open={teamOpen}
            setOpen={setTeamOpen}
            trigger={
              <DynamicChips
                selected={selectedEmployeeIds}
                getLabel={getEmployeeLabel}
                colorClass={colorToBg("blue")}
                containerRef={f1}
                allSelectedLabel={allTeamsSelected ? "Alla" : undefined}
              />
            }
          >
            <div className="w-full">
              {teams.map((team) => {
                const teamEmps = employees.filter((e) => e.teamId === team.id);
                const isExpanded = expandedTeams.has(team.id);
                const isFullySelected = isTeamFullySelected(team.id);
                const isPartial = isTeamPartiallySelected(team.id);

                return (
                  <div key={team.id} className="border-b border-gray-200">
                    <div
                      className={`flex items-center ${
                        isFullySelected || isPartial ? "bg-blue-50" : "bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleTeamExpand(team.id, e)}
                        className="p-2 text-gray-500"
                      >
                        {isExpanded ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </button>

                      <input
                        type="checkbox"
                        checked={isFullySelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartial;
                        }}
                        onChange={() => handleTeamToggle(team.id)}
                        className="mr-2 h-4 w-4"
                      />

                      <button
                        type="button"
                        onClick={() => handleTeamToggle(team.id)}
                        className="flex-1 px-2 py-2 text-left text-sm font-semibold text-gray-800"
                      >
                        {team.name}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="bg-gray-50">
                        {teamEmps.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() =>
                              handleEmployeeToggle(team.id, emp.id)
                            }
                            className="flex w-full items-center pl-10 pr-3 py-2 text-left hover:bg-gray-100"
                          >
                            <input
                              type="checkbox"
                              checked={isEmployeeSelected(team.id, emp.id)}
                              readOnly
                              className="mr-2 h-4 w-4"
                            />
                            <span className="text-sm text-gray-600">
                              {emp.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DropdownContainer>
        </div>

        {/* Categories */}
        <div ref={f2}>
          <DropdownContainer
            label="Frånvarotyp"
            open={categoryOpen}
            setOpen={setCategoryOpen}
            trigger={
              <DynamicChips
                selected={selectedCategoryIds}
                getLabel={getCategoryLabel}
                colorClass={colorToBg("green")}
                containerRef={f2}
              />
            }
          >
            <div>
              <button
                type="button"
                onClick={() => handleCategoryToggle("ALL")}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCategoryIds.includes("ALL")}
                  readOnly
                  className="h-4 w-4"
                />
                <span className="text-sm">Alla</span>
              </button>

              {availableCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryToggle(c.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(c.id)}
                    readOnly
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{c.label}</span>
                </button>
              ))}
            </div>
          </DropdownContainer>
        </div>

        {/* Status */}
        <div ref={f3}>
          <DropdownContainer
            label="Status"
            open={statusOpen}
            setOpen={setStatusOpen}
            trigger={
              selectedStatuses.length === statusOptions.length ? (
                <ChipItem
                  label="Alla statusar"
                  colorClass={colorToBg("amber")}
                />
              ) : (
                <DynamicChips
                  selected={selectedStatuses}
                  getLabel={getStatusLabel}
                  colorClass={colorToBg("amber")}
                  containerRef={f3}
                />
              )
            }
          >
            <div>
              {statusOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleStatusToggle(o.value)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(o.value)}
                    readOnly
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{o.label}</span>
                </button>
              ))}
            </div>
          </DropdownContainer>
        </div>

        {/* Start date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Från
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* End date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Till
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
    </div>
  );
}
