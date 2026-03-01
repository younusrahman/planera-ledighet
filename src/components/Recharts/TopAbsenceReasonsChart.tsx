// components/Analytics/TopAbsenceReasonsChart.tsx
import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  List,
  ListItem,
  Chip,
  Grid,
  LinearProgress,
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import PeopleIcon from "@mui/icons-material/People";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import {
  useEmployees,
  useAbsenceCategories,
} from "../../services/hooks/useData";
import { absence } from "../../services/stores/absenceDataStore";
import useFilterStore from "../../services/stores/analyticsStore";
import dayjs from "dayjs";

interface TopAbsenceReasonsChartProps {
  startDate?: string;
  endDate?: string;
}

// Chart data item with primitive values only
interface ChartDataItem {
  categoryId: string;
  label: string;
  color: string;
  count: number;
  days: number;
  employeeCount: number; // Changed from Set to number
  avgDuration: number;
  trend: "up" | "down" | "stable";
}

export function TopAbsenceReasonsChart({
  startDate,
  endDate,
}: TopAbsenceReasonsChartProps) {
  const theme = useTheme();
  const { data: employees = [] } = useEmployees();
  const { data: categories = [] } = useAbsenceCategories();
  const absences = absence.useItems();

  const { teamSelections, getSelectedEmployeeIds, selectedStatuses } =
    useFilterStore();

  const selectedEmployeeIds = useMemo(() => {
    return getSelectedEmployeeIds(employees);
  }, [teamSelections, employees, getSelectedEmployeeIds]);

  // Calculate stats and transform to chart-friendly format
  const { categoryStats, totalDays, totalInstances, totalEmployees } =
    useMemo(() => {
      // First pass: collect data with Sets
      const rawStats: Record<
        string,
        {
          categoryId: string;
          label: string;
          color: string;
          count: number;
          days: number;
          employees: Set<string>;
          avgDuration: number;
          trend: "up" | "down" | "stable";
        }
      > = {};

      // Initialize all categories
      categories.forEach((cat) => {
        rawStats[cat.id] = {
          categoryId: cat.id,
          label: cat.label,
          color: cat.color,
          count: 0,
          days: 0,
          employees: new Set(),
          avgDuration: 0,
          trend: "stable",
        };
      });

      // Filter date range
      const rangeStart = startDate
        ? dayjs(startDate)
        : dayjs().subtract(1, "year");
      const rangeEnd = endDate ? dayjs(endDate) : dayjs();

      console.log("Date range:", rangeStart.format(), "to", rangeEnd.format());
      console.log("Selected employees:", selectedEmployeeIds.length);
      console.log("Selected statuses:", selectedStatuses);
      console.log("Total absences:", absences.length);

      // Calculate stats
      let matchedAbsences = 0;
      absences.forEach((abs) => {
        // Check employee
        if (!selectedEmployeeIds.includes(abs.employeeId)) {
          return;
        }

        // Check status
        if (!selectedStatuses.includes(abs.status)) {
          return;
        }

        const absStart = dayjs(abs.startDate);
        const absEnd = dayjs(abs.endDate);

        // Check date range
        const startsBeforeEnd =
          absStart.isBefore(rangeEnd) || absStart.isSame(rangeEnd);
        const endsAfterStart =
          absEnd.isAfter(rangeStart) || absEnd.isSame(rangeStart);

        if (!startsBeforeEnd || !endsAfterStart) {
          return;
        }

        matchedAbsences++;

        const cat = rawStats[abs.absenceCategoryId];
        if (cat) {
          cat.count += 1;
          cat.days += abs.durationDays;
          cat.employees.add(abs.employeeId);
        }
      });

      console.log("Matched absences:", matchedAbsences);
      console.log("Raw stats:", rawStats);

      // Calculate averages and transform to chart data
      const chartData: ChartDataItem[] = Object.values(rawStats)
        .filter((s) => s.count > 0)
        .map((cat) => ({
          categoryId: cat.categoryId,
          label: cat.label,
          color: cat.color,
          count: cat.count,
          days: cat.days,
          employeeCount: cat.employees.size, // Convert Set to number
          avgDuration: cat.count > 0 ? Math.round(cat.days / cat.count) : 0,
          trend: cat.count > 5 ? "up" : cat.count < 2 ? "down" : "stable",
        }))
        .sort((a, b) => b.employeeCount - a.employeeCount || b.days - a.days);

      const totals = {
        totalDays: chartData.reduce((sum, cat) => sum + cat.days, 0),
        totalInstances: chartData.reduce((sum, cat) => sum + cat.count, 0),
        totalEmployees: new Set(
          chartData.flatMap((c) => {
            // Reconstruct employee set for total calculation
            const cat = rawStats[c.categoryId];
            return cat ? Array.from(cat.employees) : [];
          }),
        ).size,
      };

      console.log("Chart data:", chartData);
      console.log("Totals:", totals);

      return {
        categoryStats: chartData,
        ...totals,
      };
    }, [
      absences,
      categories,
      selectedEmployeeIds,
      selectedStatuses,
      startDate,
      endDate,
    ]);

  const topCategory = categoryStats[0];

  // Custom tooltip content component
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data: ChartDataItem = payload[0].payload;

    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          bgcolor: "background.paper",
          boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.15)}`,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {data.label}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {data.employeeCount} unika anställda drabbade
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.days} totala dagar • {data.count} tillfällen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Snitt {data.avgDuration} dagar per tillfälle
          </Typography>
        </Box>
      </Paper>
    );
  };

  // Debug output
  console.log("Rendering with stats:", categoryStats.length, "categories");

  return (
    <Box sx={{ mt: 4 }}>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="primary.main" fontWeight={700}>
              {totalInstances}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totalt antal tillfällen
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="secondary.main" fontWeight={700}>
              {totalDays}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Totala frånvarodagar
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h4" color="success.main" fontWeight={700}>
              {totalEmployees}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Berörda anställda
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Insight */}
      {topCategory && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            bgcolor: alpha(topCategory.color, 0.1),
            borderLeft: `4px solid ${topCategory.color}`,
          }}
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Vanligaste orsak: {topCategory.label}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Påverkar {topCategory.employeeCount} anställda med{" "}
            {topCategory.days} dagar (
            {Math.round((topCategory.days / (totalDays || 1)) * 100)}% av total
            frånvaro)
          </Typography>
        </Paper>
      )}

      {/* Chart */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ width: "100%", height: 300, mb: 3 }}>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer>
              <BarChart
                data={categoryStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Use employeeCount which is a number, not a Set */}
                <Bar
                  dataKey="employeeCount"
                  fill={theme.palette.primary.main}
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
              }}
            >
              <Typography color="text.secondary">
                Ingen data för valda filter
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Prova att ändra datumintervall eller filter
              </Typography>
            </Box>
          )}
        </Box>

        {/* Detailed Breakdown List */}
        {categoryStats.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Detaljerad breakdown
            </Typography>
            <List dense>
              {categoryStats.map((cat) => {
                const percentageOfTotal = Math.round(
                  (cat.days / (totalDays || 1)) * 100,
                );
                const employeeRate =
                  selectedEmployeeIds.length > 0
                    ? Math.round(
                        (cat.employeeCount / selectedEmployeeIds.length) * 100,
                      )
                    : 0;

                return (
                  <ListItem key={cat.categoryId} sx={{ py: 1, px: 0 }}>
                    <Box sx={{ width: "100%" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          mb: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: 1,
                            backgroundColor: cat.color,
                          }}
                        />
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ flex: 1 }}
                        >
                          {cat.label}
                        </Typography>

                        <MuiTooltip title="Trend jämfört med föregående period">
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {cat.trend === "up" && (
                              <TrendingUpIcon color="error" fontSize="small" />
                            )}
                            {cat.trend === "down" && (
                              <TrendingDownIcon
                                color="success"
                                fontSize="small"
                              />
                            )}
                            {cat.trend === "stable" && (
                              <TrendingFlatIcon
                                color="disabled"
                                fontSize="small"
                              />
                            )}
                          </Box>
                        </MuiTooltip>

                        <Chip
                          size="small"
                          icon={<PeopleIcon fontSize="small" />}
                          label={`${cat.employeeCount} pers`}
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                        <Chip
                          size="small"
                          icon={<CalendarTodayIcon fontSize="small" />}
                          label={`${cat.days} d`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontSize: "0.75rem" }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          ml: 4,
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={percentageOfTotal}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: alpha(cat.color, 0.2),
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: cat.color,
                            },
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 40 }}
                        >
                          {percentageOfTotal}%
                        </Typography>
                      </Box>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 4 }}
                      >
                        {cat.count} tillfällen • snitt {cat.avgDuration} dagar •
                        {employeeRate}% av personalen drabbad
                      </Typography>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </Paper>
    </Box>
  );
}
