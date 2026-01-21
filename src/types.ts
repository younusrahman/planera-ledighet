export interface AbsenceType {
  id: string;
  label: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  resources?: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  groupId: string;
}

export interface AbsenceItem {
  id: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  absenceTypeId: string;
}
