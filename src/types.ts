export interface Absence {
  id: string;
  startDate: string;
  durationDays: number;
  employeeId: string;
  absenceCategoryId: string;
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

export interface Absence {
  id: string;
  startDate: string;
  durationDays: number;
  employeeId: string;
  absenceCategoryId: string;
}
