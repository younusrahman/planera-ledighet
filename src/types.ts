// src/types.ts
export interface LeaveItem {
  id: string;
  name: string;
  startDate: string; // ISO string
  durationDays: number;
  color: string;
  rowId: string;
  absenceTypeId: string; // <--- MAKE SURE THIS IS SENT
}

export interface Resource {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  resources?: Resource[];
}
export interface AbsenceType {
  id: string;
  color: string;
  label: string;
}
