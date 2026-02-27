import type {
  AbsenceTypeAnalyticsDto,
  EmployeeAnalyticsDto,
  TeamAnalyticsDto,
  TrendDto,
  ZeroAbsenceEmployeeDto,
  UpcomingAbsenceDto,
  DailyLoadDto,
  HolidayAnalyticsDto,
} from "../../models/BackendModels";
import { apiRequest } from "../apiInstance";

export const analyticsApi = {
  getAbsenceTypes: () =>
    apiRequest<AbsenceTypeAnalyticsDto[]>("/analytics/absence-types"),

  getEmployees: () =>
    apiRequest<EmployeeAnalyticsDto[]>("/analytics/employees"),

  getTeams: () => apiRequest<TeamAnalyticsDto[]>("/analytics/teams"),

  getTrends: () => apiRequest<TrendDto[]>("/analytics/trends"),

  getZeroAbsence: () =>
    apiRequest<ZeroAbsenceEmployeeDto[]>("/analytics/zero-absence"),

  getUpcoming: (days = 30) =>
    apiRequest<UpcomingAbsenceDto[]>(`/analytics/upcoming?days=${days}`),

  getDailyLoad: (start: string, end: string) =>
    apiRequest<DailyLoadDto[]>(
      `/analytics/daily-load?start=${start}&end=${end}`,
    ),

  getHoliday: (name: string) =>
    apiRequest<HolidayAnalyticsDto>(`/analytics/holidays/${name}`),
};
export const analyticsKeys = {
  absenceTypes: ["analytics", "absenceTypes"] as const,
  employees: ["analytics", "employees"] as const,
  teams: ["analytics", "teams"] as const,
  trends: ["analytics", "trends"] as const,
  zeroAbsence: ["analytics", "zeroAbsence"] as const,
  upcoming: (days: number) => ["analytics", "upcoming", days] as const,
  dailyLoad: (start: string, end: string) =>
    ["analytics", "dailyLoad", start, end] as const,
  holiday: (name: string) => ["analytics", "holiday", name] as const,
};
