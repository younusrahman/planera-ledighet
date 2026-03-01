// components/Analytics/TeamAbsenceStackedChart.tsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemText,
  Divider,
  Checkbox,
  FormControlLabel,
  Tooltip as MuiTooltip,
  IconButton,
  Chip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTeams, useEmployees } from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import dayjs from "dayjs";
import { getSwedishHolidays } from "../../utils/holidayHelper";

export function TeamAbsenceStackedChart() {
  const theme = useTheme();
  const { data: teams = [] } = useTeams();
  const { data: employees = [] } = useEmployees();
  const absences = absence.useItems();

  const { teamSelections, getSelectedEmployeeIds, selectedStatuses } =
    useFilterStore();

  const currentYear = dayjs().year();
  const today = dayjs().format("YYYY-MM-DD");

  // Generate only upcoming holidays (not past)
  const upcomingHolidays = useMemo(() => {
    const years = [currentYear, currentYear + 1];
    const allHolidays: Array<{ date: string; name: string }> = [];

    years.forEach((year) => {
      const h = getSwedishHolidays(year);
      Object.entries(h).forEach(([date, holiday]) => {
        if (date >= today) {
          allHolidays.push({ date, name: holiday.name });
        }
      });
    });

    return allHolidays.sort((a, b) => a.date.localeCompare(b.date));
  }, [currentYear, today]);

  const defaultHoliday = useMemo(() => {
    return upcomingHolidays[0]?.date || "";
  }, [upcomingHolidays]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultHoliday);
  // NEW: State for showing only employees without any absence
  const [showOnlyWithoutAbsence, setShowOnlyWithoutAbsence] = useState(false);

  // Get selected employees from hierarchical selection
  const selectedEmployeeIds = useMemo(() => {
    return getSelectedEmployeeIds(employees);
  }, [teamSelections, employees, getSelectedEmployeeIds]);

  // Get employees who have absences on the selected date (any status)
  const employeesWithAnyAbsence = useMemo(() => {
    if (!selectedDate) return new Set<string>();

    const checkDate = dayjs(selectedDate).startOf("day");
    const employeeIds = new Set<string>();

    absences.forEach((abs) => {
      const absStart = dayjs(abs.startDate).startOf("day");
      const absEnd = dayjs(abs.endDate).endOf("day");

      const isWithinAbsence =
        (checkDate.isAfter(absStart) || checkDate.isSame(absStart, "day")) &&
        (checkDate.isBefore(absEnd) || checkDate.isSame(absEnd, "day"));

      if (isWithinAbsence && selectedEmployeeIds.includes(abs.employeeId)) {
        employeeIds.add(abs.employeeId);
      }
    });

    return employeeIds;
  }, [selectedDate, absences, selectedEmployeeIds]);

  // Get employees who have absences matching selected statuses on the selected date
  const employeesWithMatchingAbsences = useMemo(() => {
    if (!selectedDate) return new Set<string>();

    const checkDate = dayjs(selectedDate).startOf("day");
    const employeeIds = new Set<string>();

    absences.forEach((abs) => {
      if (!selectedStatuses.includes(abs.status)) return;

      const absStart = dayjs(abs.startDate).startOf("day");
      const absEnd = dayjs(abs.endDate).endOf("day");

      const isWithinAbsence =
        (checkDate.isAfter(absStart) || checkDate.isSame(absStart, "day")) &&
        (checkDate.isBefore(absEnd) || checkDate.isSame(absEnd, "day"));

      if (isWithinAbsence && selectedEmployeeIds.includes(abs.employeeId)) {
        employeeIds.add(abs.employeeId);
      }
    });

    return employeeIds;
  }, [selectedDate, absences, selectedStatuses, selectedEmployeeIds]);

  // Filter employees based on mode
  const filteredEmployees = useMemo(() => {
    if (teamSelections.length === 0) {
      return employees;
    }

    // NEW: If showing only employees without absence
    if (showOnlyWithoutAbsence) {
      // Show employees who have NO absences at all on this date
      return employees.filter(
        (emp) =>
          selectedEmployeeIds.includes(emp.id) &&
          !employeesWithAnyAbsence.has(emp.id),
      );
    }

    // Normal mode: show based on status filter
    const isShowingAllStatuses = selectedStatuses.length === 3;

    if (!isShowingAllStatuses) {
      return employees.filter(
        (emp) =>
          selectedEmployeeIds.includes(emp.id) &&
          employeesWithMatchingAbsences.has(emp.id),
      );
    }

    return employees.filter((emp) => selectedEmployeeIds.includes(emp.id));
  }, [
    employees,
    teamSelections,
    selectedEmployeeIds,
    employeesWithMatchingAbsences,
    selectedStatuses.length,
    showOnlyWithoutAbsence,
    employeesWithAnyAbsence,
  ]);

  // Group filtered employees by team
  const employeesByTeam = useMemo(() => {
    const map: Record<string, typeof employees> = {};
    filteredEmployees.forEach((emp) => {
      if (!map[emp.teamId]) map[emp.teamId] = [];
      map[emp.teamId].push(emp);
    });
    return map;
  }, [filteredEmployees]);

  // Calculate attendance - when showing "without absence", all are working
  const attendanceByTeam = useMemo(() => {
    if (!selectedDate) return {};

    const checkDate = dayjs(selectedDate).startOf("day");

    const result: Record<
      string,
      {
        absent: typeof employees;
        working: typeof employees;
      }
    > = {};

    // Initialize all teams with all employees as working
    Object.entries(employeesByTeam).forEach(([teamId, teamEmployees]) => {
      result[teamId] = {
        absent: [],
        working: [...teamEmployees],
      };
    });

    // NEW: If showing only without absence, skip absence checking (all are working)
    if (showOnlyWithoutAbsence) {
      return result;
    }

    // Normal mode: check absences by selected statuses
    absences.forEach((abs) => {
      if (!selectedStatuses.includes(abs.status)) return;

      const absStart = dayjs(abs.startDate).startOf("day");
      const absEnd = dayjs(abs.endDate).endOf("day");

      const isWithinAbsence =
        (checkDate.isAfter(absStart) || checkDate.isSame(absStart, "day")) &&
        (checkDate.isBefore(absEnd) || checkDate.isSame(absEnd, "day"));

      if (isWithinAbsence) {
        const emp = employees.find((e) => e.id === abs.employeeId);
        if (emp && result[emp.teamId]) {
          const workingIndex = result[emp.teamId].working.findIndex(
            (e) => e.id === emp.id,
          );
          if (workingIndex >= 0) {
            result[emp.teamId].working.splice(workingIndex, 1);
          }
          if (!result[emp.teamId].absent.find((e) => e.id === emp.id)) {
            result[emp.teamId].absent.push(emp);
          }
        }
      }
    });

    return result;
  }, [
    selectedDate,
    employeesByTeam,
    absences,
    employees,
    selectedStatuses,
    showOnlyWithoutAbsence,
  ]);

  // Chart data
  const chartData = useMemo(() => {
    if (!selectedDate) return [];

    return teams
      .filter(
        (team) =>
          employeesByTeam[team.id] && employeesByTeam[team.id].length > 0,
      )
      .map((team) => {
        const attendance = attendanceByTeam[team.id];
        const working = attendance?.working.length || 0;
        const absent = attendance?.absent.length || 0;
        const total = working + absent;

        return {
          teamName: team.name,
          Arbetar: working,
          Ledig: absent,
          total,
          teamId: team.id,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [selectedDate, teams, employeesByTeam, attendanceByTeam]);

  const selectedHolidayName = upcomingHolidays.find(
    (h) => h.date === selectedDate,
  )?.name;

  // Custom tooltip
  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const teamId = data.teamId;
    const attendance = attendanceByTeam[teamId];

    if (!attendance) return null;

    const { working, absent } = attendance;

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.15)}`,
          backgroundColor: theme.palette.background.paper,
          minWidth: 320,
          maxWidth: 450,
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {data.teamName} – {selectedDate}
          {showOnlyWithoutAbsence && (
            <Chip
              size="small"
              label="Endast utan frånvaro"
              color="success"
              sx={{ ml: 1, fontSize: "0.7rem" }}
            />
          )}
        </Typography>

        <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
          <Typography variant="body2" color="success.main" fontWeight={600}>
            Arbetar: {working.length}
          </Typography>
          {!showOnlyWithoutAbsence && (
            <Typography variant="body2" color="error.main" fontWeight={600}>
              Ledig: {absent.length}
            </Typography>
          )}
        </Box>

        {/* Absent Employees - only show in normal mode */}
        {!showOnlyWithoutAbsence && absent.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              sx={{
                color: "error.main",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
              }}
            >
              Lediga anställda:
            </Typography>
            <List
              dense
              sx={{
                bgcolor: alpha(theme.palette.error.main, 0.05),
                borderRadius: 1,
              }}
            >
              {absent.map((emp) => (
                <ListItem key={emp.id} disablePadding sx={{ py: 0.25, px: 1 }}>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.8rem", color: "error.dark" }}
                      >
                        {emp.name}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {!showOnlyWithoutAbsence && absent.length > 0 && (
          <Divider sx={{ my: 1 }} />
        )}

        {/* Working Employees */}
        {working.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "success.main",
                fontWeight: 600,
                display: "block",
                mb: 0.5,
              }}
            >
              {showOnlyWithoutAbsence
                ? "Anställda utan frånvaro:"
                : "Arbetande anställda:"}
            </Typography>
            <List
              dense
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.05),
                borderRadius: 1,
              }}
            >
              {working.map((emp) => (
                <ListItem key={emp.id} disablePadding sx={{ py: 0.25, px: 1 }}>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.8rem", color: "success.dark" }}
                      >
                        {emp.name}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <FormControl sx={{ minWidth: 250 }} size="small">
          <InputLabel id="holiday-select-label">Välj helgdag</InputLabel>
          <Select
            labelId="holiday-select-label"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            label="Välj helgdag"
          >
            {upcomingHolidays.map((holiday) => (
              <MenuItem key={holiday.date} value={holiday.date}>
                {holiday.date} – {holiday.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* NEW: Checkbox for showing only employees without absence */}
        <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showOnlyWithoutAbsence}
                onChange={(e) => setShowOnlyWithoutAbsence(e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography variant="body2">
                  Visa endast anställda utan frånvaro
                </Typography>
                <MuiTooltip
                  title="När denna är ikryssad ignoreras statusfiltret och endast anställda som inte har någon frånvaro alls visas"
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <InfoIcon fontSize="small" color="action" />
                  </IconButton>
                </MuiTooltip>
              </Box>
            }
          />
          {showOnlyWithoutAbsence && (
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              label="Åsidosätter statusfilter"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ width: "100%", height: 400 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="teamName" />
              <Tooltip content={renderTooltip} />
              <Legend />
              <Bar
                dataKey="Arbetar"
                stackId="a"
                fill={theme.palette.success.main}
              />
              {!showOnlyWithoutAbsence && (
                <Bar
                  dataKey="Ledig"
                  stackId="a"
                  fill={theme.palette.error.main}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
