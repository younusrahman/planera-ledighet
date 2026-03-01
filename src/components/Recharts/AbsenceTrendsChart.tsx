// components/Analytics/AbsenceTrendsChart.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  useEmployees,
  useAbsenceCategories,
} from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import dayjs from "dayjs";

type ViewMode = "daily" | "weekly" | "monthly";

export function AbsenceTrendsChart() {
  const theme = useTheme();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();

  const {
    teamSelections,
    getSelectedEmployeeIds,
    selectedCategoryIds,
    selectedStatuses,
  } = useFilterStore();

  const [viewMode, setViewMode] = useState<ViewMode>("monthly");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const selectedEmployeeIds = useMemo(() => {
    return getSelectedEmployeeIds(employees);
  }, [teamSelections, employees, getSelectedEmployeeIds]);

  // Filter absences
  const filteredAbsences = useMemo(() => {
    let filtered = absences.filter(
      (abs) =>
        selectedEmployeeIds.includes(abs.employeeId) &&
        selectedStatuses.includes(abs.status),
    );

    if (!selectedCategoryIds.includes("ALL")) {
      filtered = filtered.filter((abs) =>
        selectedCategoryIds.includes(abs.absenceCategoryId),
      );
    }

    if (selectedCategory !== "ALL") {
      filtered = filtered.filter(
        (abs) => abs.absenceCategoryId === selectedCategory,
      );
    }

    return filtered;
  }, [
    absences,
    selectedEmployeeIds,
    selectedStatuses,
    selectedCategoryIds,
    selectedCategory,
  ]);

  // Generate trend data
  const trendData = useMemo(() => {
    if (filteredAbsences.length === 0) return [];

    const data: Record<string, { date: string; count: number; days: number }> =
      {};

    filteredAbsences.forEach((abs) => {
      const start = dayjs(abs.startDate);
      const end = dayjs(abs.endDate);

      // Generate data points for each day in the absence
      let current = start;
      while (current.isBefore(end) || current.isSame(end, "day")) {
        let key: string;

        if (viewMode === "daily") {
          key = current.format("YYYY-MM-DD");
        } else if (viewMode === "weekly") {
          key = current.startOf("week").format("YYYY-MM-DD");
        } else {
          key = current.format("YYYY-MM");
        }

        if (!data[key]) {
          data[key] = { date: key, count: 0, days: 0 };
        }

        data[key].count += 1; // Number of absence instances
        data[key].days += 1; // Total absence days

        current = current.add(1, "day");
      }
    });

    // Convert to array and sort
    return Object.values(data).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredAbsences, viewMode]);

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: ViewMode,
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Frånvarotrender över tid
        </Typography>

        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
          sx={{ ml: "auto" }}
        >
          <ToggleButton value="daily">Dagligen</ToggleButton>
          <ToggleButton value="weekly">Veckovis</ToggleButton>
          <ToggleButton value="monthly">Månadsvis</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Filtrera på kategori</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Filtrera på kategori"
          >
            <MenuItem value="ALL">Alla kategorier</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ width: "100%", height: 350 }}>
          {trendData.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={theme.palette.primary.main}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={theme.palette.primary.main}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    if (viewMode === "monthly")
                      return dayjs(value).format("MMM YYYY");
                    if (viewMode === "weekly")
                      return "v." + dayjs(value).week();
                    return dayjs(value).format("DD MMM");
                  }}
                />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "days")
                      return [`${value} dagar`, "Totala frånvarodagar"];
                    return [value, name];
                  }}
                  labelFormatter={(label) => {
                    if (viewMode === "monthly")
                      return dayjs(label).format("MMMM YYYY");
                    if (viewMode === "weekly")
                      return `Vecka ${dayjs(label).week()}, ${dayjs(label).year()}`;
                    return dayjs(label).format("D MMMM YYYY");
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="days"
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill="url(#colorDays)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.secondary">
                Ingen data för valt intervall
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
