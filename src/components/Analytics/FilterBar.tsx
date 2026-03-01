import { useRef, useState, useLayoutEffect, useMemo, useEffect } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  useTheme,
  alpha,
  TextField,
  Grid,
  Collapse,
  Typography,
  List,
  ListItem,
  ListItemButton,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import useFilterStore, { type TeamSelection } from "../../services/stores/analyticsStore";
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

// Helper to fill empty space with as many chips as possible
const DynamicChips = ({
  selected,
  getLabel,
  color,
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
    return (
      <Chip
        size="small"
        label={allSelectedLabel}
        sx={{
          height: 20,
          fontSize: "0.65rem",
          backgroundColor: alpha(color, 0.1),
          color: color,
          fontWeight: 600,
        }}
      />
    );
  }

  const display = (selected || []).slice(0, limit);
  const extra = (selected || []).length - limit;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        alignItems: "center",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {display.map((id: any) => (
        <Chip
          key={id}
          size="small"
          label={getLabel(id)}
          sx={{
            height: 20,
            fontSize: "0.65rem",
            backgroundColor: alpha(color, 0.1),
            color: color,
            fontWeight: 600,
            flexShrink: 0,
          }}
        />
      ))}
      {extra > 0 && (
        <Chip
          size="small"
          label={`+${extra}`}
          sx={{
            height: 20,
            fontSize: "0.65rem",
            backgroundColor: alpha(color, 0.1),
            color: color,
            fontWeight: 600,
          }}
        />
      )}
    </Box>
  );
};

export function FilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  availableCategories,
}: FilterBarProps) {
  const theme = useTheme();
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Initialize default state - all teams selected
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

  // Toggle expand/collapse - clicking the expand icon or row background
  const toggleTeamExpand = (teamId: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  // Handle team selection toggle - clicking team name/text or checkbox
  const handleTeamToggle = (teamId: string) => {
    const teamEmployees = employees.filter((e) => e.teamId === teamId);
    const existingIndex = teamSelections.findIndex((s) => s.teamId === teamId);

    if (existingIndex >= 0) {
      // Remove team from selection
      const newSelections = [...teamSelections];
      newSelections.splice(existingIndex, 1);
      setTeamSelections(newSelections);
      setIsAllSelected(false);
    } else {
      // Add team with all employees selected
      setTeamSelections([
        ...teamSelections,
        { teamId, employeeIds: [], isIndeterminate: false },
      ]);
    }
  };

  // Handle individual employee toggle
  const handleEmployeeToggle = (teamId: string, empId: string) => {
    const teamEmployees = employees.filter((e) => e.teamId === teamId);
    const existingIndex = teamSelections.findIndex((s) => s.teamId === teamId);

    if (existingIndex === -1) {
      // Team not selected yet, add with this specific employee
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
      // Was "all selected", switch to specific selection excluding this one
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
        // Remove employee
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
        // Add employee
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
          if (allTeamsNowSelected) {
            setIsAllSelected(true);
          }
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

  const handleCategoryChange = (event: any) => {
    const value = event.target.value as string[];
    if (value.includes("ALL") && !selectedCategoryIds.includes("ALL")) {
      setSelectedCategoryIds(["ALL"]);
    } else if (value.length === 0) {
      setSelectedCategoryIds(["ALL"]);
    } else if (value.includes("ALL") && value.length > 1) {
      setSelectedCategoryIds(value.filter((v) => v !== "ALL"));
    } else {
      setSelectedCategoryIds(value);
    }
  };

  const handleStatusChange = (event: any) => {
    const value = event.target.value as number[];
    if (value.length === 0) {
      setSelectedStatuses(statusOptions.map((s) => s.value));
    } else {
      setSelectedStatuses(value);
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
    <Box sx={{ width: "100%", mb: 2 }}>
      <Grid container spacing={2}>
        {/* ROW 1 - Hierarchical Team/Employee Select */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small" ref={f1}>
            <InputLabel>Team & Anställda</InputLabel>
            <Select
              multiple
              value={selectedEmployeeIds}
              input={<OutlinedInput label="Team & Anställda" />}
              renderValue={(sel) => (
                <DynamicChips
                  selected={sel}
                  getLabel={getEmployeeLabel}
                  color={theme.palette.primary.main}
                  containerRef={f1}
                  allSelectedLabel={allTeamsSelected ? "Alla" : undefined}
                />
              )}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 400,
                    width: 320,
                    p: 0,
                  },
                },
              }}
            >
              <List dense disablePadding sx={{ width: "100%" }}>
                {teams.map((team) => {
                  const teamEmps = employees.filter(
                    (e) => e.teamId === team.id,
                  );
                  const isExpanded = expandedTeams.has(team.id);
                  const isFullySelected = isTeamFullySelected(team.id);
                  const isPartial = isTeamPartiallySelected(team.id);

                  return (
                    <Box key={team.id}>
                      {/* Team Header Row */}
                      <ListItem
                        disablePadding
                        sx={{
                          bgcolor:
                            isFullySelected || isPartial
                              ? alpha(theme.palette.primary.main, 0.08)
                              : "transparent",
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {/* Expand/Collapse Icon Button */}
                        <IconButton
                          size="small"
                          onClick={(e) => toggleTeamExpand(team.id, e)}
                          sx={{
                            p: 0.5,
                            color: "text.secondary",
                          }}
                        >
                          {isExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>

                        {/* Checkbox for selection */}
                        <Checkbox
                          checked={isFullySelected}
                          indeterminate={isPartial}
                          onChange={() => handleTeamToggle(team.id)}
                          size="small"
                          sx={{ mr: 1 }}
                        />

                        {/* Team Name - Click to toggle selection */}
                        <ListItemButton
                          onClick={() => handleTeamToggle(team.id)}
                          dense
                          sx={{
                            flex: 1,
                            pl: 0,
                            "&:hover": {
                              bgcolor: "transparent",
                            },
                          }}
                          disableRipple
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={600}>
                                {team.name}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>

                      {/* Nested Employees */}
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <List dense disablePadding>
                          {teamEmps.map((emp) => (
                            <ListItem
                              key={emp.id}
                              disablePadding
                              sx={{
                                pl: 4,
                                bgcolor: alpha(
                                  theme.palette.background.default,
                                  0.5,
                                ),
                              }}
                            >
                              <ListItemButton
                                onClick={() =>
                                  handleEmployeeToggle(team.id, emp.id)
                                }
                                dense
                              >
                                <Checkbox
                                  checked={isEmployeeSelected(team.id, emp.id)}
                                  size="small"
                                  sx={{ mr: 1 }}
                                  tabIndex={-1}
                                  disableRipple
                                />
                                <ListItemText
                                  primary={
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {emp.name}
                                    </Typography>
                                  }
                                />
                              </ListItemButton>
                            </ListItem>
                          ))}
                        </List>
                      </Collapse>
                    </Box>
                  );
                })}
              </List>
            </Select>
          </FormControl>
        </Grid>

        {/* Categories */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small" ref={f2}>
            <InputLabel>Frånvarotyp</InputLabel>
            <Select
              multiple
              value={selectedCategoryIds}
              onChange={handleCategoryChange}
              input={<OutlinedInput label="Frånvarotyp" />}
              renderValue={(sel) => (
                <DynamicChips
                  selected={sel}
                  getLabel={getCategoryLabel}
                  color={theme.palette.success.main}
                  containerRef={f2}
                />
              )}
            >
              <MenuItem value="ALL">
                <Checkbox checked={selectedCategoryIds.includes("ALL")} />
                <ListItemText primary="Alla" />
              </MenuItem>
              {availableCategories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Checkbox checked={selectedCategoryIds.includes(c.id)} />
                  <ListItemText primary={c.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size="small" ref={f3}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={selectedStatuses}
              onChange={handleStatusChange}
              input={<OutlinedInput label="Status" />}
              renderValue={(sel) => {
                const values = sel as number[];
                return values.length === statusOptions.length ? (
                  <Chip
                    size="small"
                    label="Alla statusar"
                    sx={{
                      height: 20,
                      fontSize: "0.65rem",
                      color: theme.palette.warning.main,
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <DynamicChips
                    selected={values}
                    getLabel={getStatusLabel}
                    color={theme.palette.warning.main}
                    containerRef={f3}
                  />
                );
              }}
            >
              {statusOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  <Checkbox checked={selectedStatuses.includes(o.value)} />
                  <ListItemText primary={o.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* ROW 2 - Dates */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Från"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Till"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
