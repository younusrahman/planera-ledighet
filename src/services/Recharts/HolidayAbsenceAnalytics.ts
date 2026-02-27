// useHolidayAbsenceAnalytics.ts
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../apiInstance";

export interface HolidayAbsenceAnalyticsResponse {
  total: number;
  byCategory: {
    categoryId: string;
    label: string;
    count: number;
  }[];
}

export const useHolidayAbsenceAnalytics = (params: {
  start?: string;
  end?: string;
  teamIds: string[];
  categoryIds: string[];
}) =>
  useQuery({
    queryKey: [
      "analytics",
      "holiday-absences",
      params.start,
      params.end,
      params.teamIds,
      params.categoryIds,
    ],
    queryFn: () =>
      apiRequest<HolidayAbsenceAnalyticsResponse>(
        `/analytics/holiday?${new URLSearchParams({
          start: params.start ?? "",
          end: params.end ?? "",
        }).toString()}&` +
          params.teamIds.map((id) => `teamIds=${id}`).join("&") +
          "&" +
          params.categoryIds.map((id) => `categoryIds=${id}`).join("&"),
      ),
    enabled: Boolean(params.start && params.end),
  });
