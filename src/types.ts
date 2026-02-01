// src/types.ts
export interface Absence {
  id: string;
  name: string;
  startDate: string; // ISO string
  durationDays: number;
  color: string;
  rowId: string;
  absenceTypeId: string; // <--- MAKE SURE THIS IS SENT
}

export interface Team {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  resources?: Team[];
}
export interface AbsenceType {
  id: string;
  color: string;
  label: string;
}
