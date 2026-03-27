export const AbsenceStatus = { Pending: 0, Approved: 1, Rejected: 2 } as const;
export type AbsenceStatus = (typeof AbsenceStatus)[keyof typeof AbsenceStatus];

export interface Absence {
  id: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  employeeId: string;
  absenceCategoryId: string;
  status: AbsenceStatus;
  rejectionReason?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  teamId: string;
}

export interface AbsenceCategory {
  id: string;
  color: string;
  label: string;
}
export interface TeamWithEmployees extends Team {
  employees: Employee[];
}

export interface AbsencePerTeam {
  teamName: string;
  count: number;
}

export interface AbsencePerCategory {
  label: string; // kategori
  color: string;
  count: number;
  team: string; // lägg till detta
}

export interface AbsencePerTeamCategory {
  teamName: string;
  categories: AbsencePerCategory[];
}

export interface HolidayAbsence {
  holiday: string;
  count: number;
  group: string;
}

export interface SemesterAbsence {
  semester: string;
  count: number;
}

export interface QuarterAbsence {
  quarter: string;
  count: number;
}

export interface MonthAbsence {
  month: string;
  count: number;
}

export interface OverlapAbsence {
  date: string;
  count: number;
}

export interface TeamAvailability {
  teamName: string;
  available: number;
  absent: number;
}

export interface EmployeeRanking {
  employeeName: string;
  daysAbsent: number;
}

export type ChangeAbsenceStatusPayload = {
  id: string;
  status: AbsenceStatus;
  rejectionReason?: string | null;
};
export type SidebarMode = "full" | "compact" | "hidden";
export type UiConfig = {
  blockPastDays: boolean;
  disableDeletion: boolean;
  cellWidth: number;
  rowHeight: number;
  sidebarWidthFull: number;
  sidebarWidthCompact: number;
  sidebarWidthHidden: number;
};
