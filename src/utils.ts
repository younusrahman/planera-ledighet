import dayjs from "dayjs";
import "dayjs/locale/sv";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import updateLocale from "dayjs/plugin/updateLocale";

// --- PLUGINS ---
dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);

// LOCALE SETTINGS
dayjs.locale("sv");
dayjs.updateLocale("sv", {
  weekStart: 1,
});

// CONSTANTS
export const CELL_WIDTH = 60;
export const ROW_HEIGHT = 65;

// TYPES
export interface LeaveItem {
  id: string;
  name: string;
  startDate: string; // ISO YYYY-MM-DD
  durationDays: number;
  color: string;
  rowId: string;
}

export interface Resource {
  id: string;
  name: string;
}

// HELPERS
export const getDaysArray = (start: dayjs.Dayjs, count: number) => {
  const arr = [];
  // Ensure we iterate from the exact start of the requested day
  const base = start.startOf("day");
  for (let i = 0; i < count; i++) {
    arr.push(base.add(i, "day"));
  }
  return arr;
};

export const getDateOffset = (
  startDate: string,
  timelineStart: dayjs.Dayjs
) => {
  // CRITICAL: Normalize both to midnight to ensure integer results
  const start = dayjs(startDate).startOf("day");
  const base = timelineStart.startOf("day");
  return start.diff(base, "day") * CELL_WIDTH;
};
