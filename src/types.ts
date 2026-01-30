// src/types.ts
export interface AbsenceBlockData {
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

export interface Person {
  id: string;
  name: string;
  resources?: Team[];
}
export interface AbsenceReason {
  id: string;
  color: string;
  label: string;
}
