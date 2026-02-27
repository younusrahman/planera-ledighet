export interface AbsenceTypeTeamDto {
  teamId: string;
  teamName: string;
  employees: number;
  totalDays: number;
}

export interface AbsenceTypeAnalyticsDto {
  absenceType: string;
  color: string;
  uniqueEmployees: number;
  totalEvents: number;
  totalDays: number;
  teams: AbsenceTypeTeamDto[];
}

export interface EmployeeAbsenceTypeDto {
  type: string;
  color: string;
  days: number;
  events: number;
}

export interface EmployeeAnalyticsDto {
  employeeId: string;
  employeeName: string;
  teamId: string;
  teamName: string;
  totalDays: number;
  totalEvents: number;
  types: EmployeeAbsenceTypeDto[];
  longestStreakDays: number;
}

export interface HolidayTeamDto {
  teamId: string;
  teamName: string;
  count: number;
}

export interface HolidayAnalyticsDto {
  holidayName: string;
  absentEmployees: number;
  absentPerTeam: HolidayTeamDto[];
  notAbsentEmployees: number;
  totalHolidayAbsenceDays: number;
}

export interface HighAbsenceEmployeeDto {
  employeeId: string;
  employeeName: string;
  days: number;
}

export interface TeamAnalyticsDto {
  teamId: string;
  teamName: string;
  teamSize: number;
  totalDays: number;
  averageDaysPerEmployee: number;
  mostCommonType: string;
  highAbsenceEmployees: HighAbsenceEmployeeDto[];
}

export interface DailyLoadTeamDto {
  teamId: string;
  teamName: string;
  absentCount: number;
}

export interface DailyLoadDto {
  date: string;
  absentEmployees: number;
  availableEmployees: number;
  teams: DailyLoadTeamDto[];
}

export interface TrendTypeDto {
  type: string;
  color: string;
  days: number;
}

export interface TrendDto {
  year: number;
  month: number;
  totalDays: number;
  totalEvents: number;
  types: TrendTypeDto[];
}

export interface ZeroAbsenceEmployeeDto {
  employeeId: string;
  employeeName: string;
  teamId: string;
  teamName: string;
}

export interface UpcomingEmployeeDto {
  employeeId: string;
  employeeName: string;
  teamId: string;
  teamName: string;
}

export interface UpcomingTeamDto {
  teamId: string;
  teamName: string;
  absentCount: number;
}

export interface UpcomingAbsenceDto {
  date: string;
  employees: UpcomingEmployeeDto[];
  teams: UpcomingTeamDto[];
}
