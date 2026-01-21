import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Box, Typography, alpha, useTheme } from "@mui/material";
import dayjs from "dayjs";
import { BaseDndGrid } from "./BaseDndGrid";
import type { Group, LeaveItem, AbsenceType } from "../types";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import isLeapYear from "dayjs/plugin/isLeapYear";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isLeapYear);
dayjs.extend(isoWeek);

const YEAR_DAY_WIDTH = 5;
const SIDEBAR_TOP_HEIGHT = 105;
const HEADER_ROW_HEIGHT = 35;

export const YearOverview: React.FC<{
  groups: Group[];
  leaves: LeaveItem[];
  collapsedGroups: string[];
  absenceTypes: AbsenceType[];
  activeLeave: LeaveItem | null;
  onDragStart: (e: DragStartEvent) => void;
  onDragEnd: (e: DragEndEvent) => void;
  onLeaveEdit: (id: string) => void;
  onLeaveDelete: (id: string) => void;
  onLeaveResizeEnd: (id: string, d: number, s: number) => void;
  disableDeletion: boolean;
  blockPastDays: boolean;
}> = (props) => {
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Background Drag State
  const isDraggingBg = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeftStart = useRef(0);

  const [renderedYears, setRenderedYears] = useState<number[]>([
    dayjs().year() - 1,
    dayjs().year(),
    dayjs().year() + 1,
  ]);
  const timelineStart = useMemo(
    () => dayjs().year(renderedYears[0]).startOf("year"),
    [renderedYears],
  );
  const totalWidth = useMemo(
    () =>
      renderedYears.reduce((acc, y) => acc + (y % 4 === 0 ? 366 : 365), 0) *
      YEAR_DAY_WIDTH,
    [renderedYears],
  );

  const checkBoundaries = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollLeft + el.clientWidth > el.scrollWidth - 1200)
      setRenderedYears((p) => [...p, p[p.length - 1] + 1]);
    if (el.scrollLeft < 1200) {
      const prevYear = renderedYears[0] - 1;
      setRenderedYears((p) => [prevYear, ...p]);
      if (el)
        el.scrollLeft += (prevYear % 4 === 0 ? 366 : 365) * YEAR_DAY_WIDTH;
    }
  }, [renderedYears]);

  // DRAG SCROLL LOGIC
  const onBgDragStart = (e: React.MouseEvent) => {
    isDraggingBg.current = true;
    dragStartX.current = e.pageX;
    dragScrollLeftStart.current = scrollRef.current?.scrollLeft || 0;
    document.body.style.cursor = "grabbing";
  };

  const onBgDragMove = (e: React.MouseEvent) => {
    if (!isDraggingBg.current || !scrollRef.current) return;
    const x = e.pageX;
    const walk = (x - dragStartX.current) * 1.5;
    scrollRef.current.scrollLeft = dragScrollLeftStart.current - walk;
    checkBoundaries();
  };

  const onBgDragEnd = () => {
    isDraggingBg.current = false;
    document.body.style.cursor = "default";
  };

  useEffect(() => {
    if (!isInitialLoad.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft =
      dayjs().startOf("month").diff(timelineStart, "day") * YEAR_DAY_WIDTH;
    isInitialLoad.current = false;
  }, [timelineStart]);

  const getWeekRanges = (year: number) => {
    const ranges = [];
    let curr = dayjs().year(year).startOf("year");
    const end = dayjs().year(year).endOf("year");
    while (curr.isBefore(end)) {
      const startW = curr.isoWeek();
      let dCount = 0;
      for (let i = 0; i < 4; i++) {
        if (curr.isAfter(end)) break;
        const eow = curr.endOf("isoWeek");
        const actEnd = eow.isAfter(end) ? end : eow;
        dCount += actEnd.diff(curr, "day") + 1;
        curr = actEnd.add(1, "day").startOf("day");
      }
      ranges.push({
        label: `v.${startW}-${curr.subtract(1, "day").isoWeek()}`,
        width: dCount * YEAR_DAY_WIDTH,
      });
    }
    return ranges;
  };

  const YearHeader = (
    <Box sx={{ height: SIDEBAR_TOP_HEIGHT, overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          height: HEADER_ROW_HEIGHT,
          borderBottom: "1px solid #ddd",
        }}
      >
        {renderedYears.map((y) => (
          <Box
            key={y}
            sx={{
              width: (y % 4 === 0 ? 366 : 365) * YEAR_DAY_WIDTH,
              borderRight: "2px solid #bbb",
              pl: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {y}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          height: HEADER_ROW_HEIGHT,
          borderBottom: "1px solid #eee",
        }}
      >
        {renderedYears.map((y) =>
          Array.from({ length: 12 }).map((_, i) => (
            <Box
              key={`${y}-${i}`}
              sx={{
                width: dayjs().year(y).month(i).daysInMonth() * YEAR_DAY_WIDTH,
                borderRight: "1px solid #f0f0f0",
                textAlign: "center",
              }}
            >
              <Typography
                sx={{ fontSize: "0.6rem", fontWeight: 700, lineHeight: "35px" }}
              >
                {dayjs().year(y).month(i).format("MMM").toUpperCase()}
              </Typography>
            </Box>
          )),
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          height: HEADER_ROW_HEIGHT,
          borderBottom: "1px solid #eee",
        }}
      >
        {renderedYears.map((y) =>
          getWeekRanges(y).map((range, idx) => (
            <Box
              key={`${y}-${idx}`}
              sx={{
                width: range.width,
                borderRight: "1px solid #e0e0e0",
                textAlign: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.03),
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  color: "text.secondary",
                  lineHeight: "35px",
                  whiteSpace: "nowrap",
                }}
              >
                {range.label}
              </Typography>
            </Box>
          )),
        )}
      </Box>
    </Box>
  );

  return (
    <BaseDndGrid
      {...props}
      ref={scrollRef}
      onScroll={checkBoundaries}
      cellWidth={YEAR_DAY_WIDTH}
      rowHeight={35}
      totalWidth={totalWidth}
      header={YearHeader}
      leftOffsetCalc={(l) =>
        dayjs(l.startDate).diff(timelineStart, "day") * YEAR_DAY_WIDTH
      }
      onGroupMouseDown={onBgDragStart}
      onGroupMouseMove={onBgDragMove}
      onGroupMouseUp={onBgDragEnd}
      onGridPointerDown={() => {}}
      onGridPointerMove={() => {}}
      onGridPointerUp={() => {}}
    />
  );
};
