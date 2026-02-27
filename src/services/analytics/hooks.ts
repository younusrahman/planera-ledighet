// src/domains/analytics/hooks.ts
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, analyticsKeys } from "./api";

export const useAbsenceTypes = () =>
  useQuery({
    queryKey: analyticsKeys.absenceTypes,
    queryFn: analyticsApi.getAbsenceTypes,
  });

export const useEmployeeAnalytics = () =>
  useQuery({
    queryKey: analyticsKeys.employees,
    queryFn: analyticsApi.getEmployees,
  });

export const useTeamAnalytics = () =>
  useQuery({
    queryKey: analyticsKeys.teams,
    queryFn: analyticsApi.getTeams,
  });

export const useTrends = () =>
  useQuery({
    queryKey: analyticsKeys.trends,
    queryFn: analyticsApi.getTrends,
  });

export const useZeroAbsence = () =>
  useQuery({
    queryKey: analyticsKeys.zeroAbsence,
    queryFn: analyticsApi.getZeroAbsence,
  });

export const useUpcomingAbsences = (days: number = 30) =>
  useQuery({
    queryKey: analyticsKeys.upcoming(days),
    queryFn: () => analyticsApi.getUpcoming(days),
  });

export const useDailyLoad = (start: string, end: string) =>
  useQuery({
    queryKey: analyticsKeys.dailyLoad(start, end),
    queryFn: () => analyticsApi.getDailyLoad(start, end),
    enabled: !!start && !!end,
  });

export const useHolidayAnalytics = (holiday: string) =>
  useQuery({
    queryKey: analyticsKeys.holiday(holiday),
    queryFn: () => analyticsApi.getHoliday(holiday),
    enabled: !!holiday,
  });
