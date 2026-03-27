import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../../services/apiInstance";


export type RiskLevel = "safe" | "warning" | "critical";

export interface WorkforceCoverageAnalyticsParams {
  start: string;
  end: string;
  teamIds?: string[];
  employeeIds?: string[];
  categoryIds?: string[];
  statuses?: number[];
}

export interface WorkforceCoverageAnalyticsDto {
  start: string;
  end: string;
  totals: {
    totalAbsenceRequests: number;
    approvedAbsences: number;
    distinctEmployeesAbsent: number;
    criticalDays: number;
    warningDays: number;
    peakAbsenceDate?: string;
    peakAbsenceCount: number;
    avgDailyAbsences: number;
  };
  daily: {
    date: string;
    totalEmployees: number;
    absentEmployees: number;
    availableEmployees: number;
    absenceRate: number;
    riskLevel: RiskLevel;
  }[];
  byCategory: {
    categoryId: string;
    label: string;
    count: number;
  }[];
  byTeam: {
    teamId: string;
    teamName: string;
    totalEmployees: number;
    totalAbsentOccurrences: number;
    avgAbsenceRate: number;
    peakAbsenceRate: number;
    criticalDays: number;
    warningDays: number;
    riskLevel: RiskLevel;
    minRequiredWorking?: number;
    lowestAvailable?: number;
  }[];
  alerts: {
    date: string;
    severity: RiskLevel;
    message: string;
    teamId?: string;
    teamName?: string;
  }[];
}

export const useWorkforceCoverageAnalytics = (
  params: WorkforceCoverageAnalyticsParams,
) =>
  useQuery({
    queryKey: [
      "analytics",
      "workforce-coverage",
      params.start,
      params.end,
      params.teamIds,
      params.employeeIds,
      params.categoryIds,
      params.statuses,
    ],
    queryFn: async () => {
      const search = new URLSearchParams({
        start: params.start,
        end: params.end,
      });

      params.teamIds?.forEach((id) => search.append("teamIds", id));
      params.employeeIds?.forEach((id) => search.append("employeeIds", id));
      params.categoryIds?.forEach((id) => search.append("categoryIds", id));
      params.statuses?.forEach((s) => search.append("statuses", String(s)));

      return apiRequest<WorkforceCoverageAnalyticsDto>(
        `/analytics/workforce-coverage?${search.toString()}`,
      );
    },
    enabled: !!params.start && !!params.end,
  });
