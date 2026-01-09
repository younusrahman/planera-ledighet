import { predefinedColors } from "./components/forms/AbsenceTypeForm";
import type { Group } from "./types";

export const ABSENCE_TYPES = [
  // Added 'export' here
  { id: "conf", color: predefinedColors[0], label: "Konferens" },
  { id: "vac", color: predefinedColors[4], label: "Semester" },
  { id: "sick", color: predefinedColors[8], label: "Sjuk" },
  { id: "vab", color: predefinedColors[11], label: "VAB" },
];


export const INITIAL_LEAVE_ITEMS = [
  {
    id: "l1",
    name: "Nyårskonferens",
    startDate: "2026-01-01",
    durationDays: 4,
    color: "#1976d2",
    rowId: "1",
  },
  {
    id: "l3",
    name: "Möte (Test)",
    startDate: "2026-01-08",
    durationDays: 3,
    color: "#d32f2f",
    rowId: "1",
  },
  {
    id: "l2",
    name: "Vinterledigt",
    startDate: "2026-01-10",
    durationDays: 14,
    color: "#2e7d32",
    rowId: "2",
  },
  {
    id: "l4",
    name: "Vinterledigt",
    startDate: "2025-12-12",
    durationDays: 14,
    color: "#2e7d32",
    rowId: "2",
  },
];
