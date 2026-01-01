// src/types.ts
export interface LeaveItem {
  id: string;
  name: string;
  startDate: string; // ISO string
  durationDays: number;
  color: string;
  rowId: string;
}

export interface Resource {
  id: string;
  name: string;
}
