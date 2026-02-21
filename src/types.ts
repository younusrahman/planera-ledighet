export interface Absence {
  id: string;
  name: string;
  startDate: string;
  durationDays: number;
  color: string;
  employeeId: string;
  absenceCategoryId: string;
}

export interface Team {
  id: string;
  name: string;
  employees: Employee[];
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
