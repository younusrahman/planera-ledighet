import dayjs from "dayjs";
import type { Group, LeaveItem, Resource } from "../types";
import { CELL_WIDTH } from "../utils";
import { groups } from "../services/entities/groups";
import { resources } from "../services/entities/resources";

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
  timelineStart: dayjs.Dayjs,
) => {
  const start = dayjs(startDate).startOf("day");
  const base = timelineStart.startOf("day");
  return start.diff(base, "day") * CELL_WIDTH;
};

export const checkCollision = (
  items: LeaveItem[],
  targetItem: {
    id: string;
    resourceId: string;
    startDate: string;
    durationDays: number;
  },
) => {
  const targetStart = dayjs(targetItem.startDate).startOf("day");
  const targetEnd = targetStart.add(targetItem.durationDays, "day");

  return items.some((item) => {
    // Skip self and items in other rows
    if (
      item.id === targetItem.id ||
      item.resourceId !== targetItem.resourceId
    ) {
      return false;
    }

    const itemStart = dayjs(item.startDate).startOf("day");
    const itemEnd = itemStart.add(item.durationDays, "day");

    // Standard overlap logic: (StartA < EndB) and (EndA > StartB)
    return targetStart.isBefore(itemEnd) && targetEnd.isAfter(itemStart);
  });
};

export function buildGroupsWithResourcesDirect() {
  const groupState = groups.useStore.getState();
  const resourceState = resources.useStore.getState();
  const groupList = groupState.ids.map((id) => groupState.byId[id]);
  const resourceList = resourceState.ids.map((id) => resourceState.byId[id]);
  return groupList.map((g) => ({
    ...g,
    resources: resourceList.filter((r) => r.groupId === g.id),
  }));
}
