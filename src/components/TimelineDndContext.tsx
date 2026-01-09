import React, { forwardRef, useMemo } from "react";
import { Box, Typography, Collapse, alpha, Tooltip } from "@mui/material";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { Dayjs } from "dayjs";
import { CELL_WIDTH, ROW_HEIGHT } from "../utils";
import { getDateOffset } from "../utils/Helper";
import { LeaveBlock } from "./LeaveBlock";
import { PastDaysOverlay } from "./PastDaysOverlay";
import type { Group, LeaveItem } from "../types";
import { getSwedishHolidays } from "../utils/holidayHelper";

interface TimelineDndContextProps {
  // Data
  days: Dayjs[];
  daysCount: number;
  startDate: Dayjs;
  groups: Group[];
  leaves: LeaveItem[];
  collapsedGroups: string[];
  absenceTypes: any[];
  activeLeave: LeaveItem | null;

  // Settings
  blockPastDays: boolean;
  disabledOverlayWidth: number;
  disableDeletion: boolean;

  // Interaction State
  selection: {
    isSelecting: boolean;
    rowId: string | null;
    startX: number;
  };
  selectionBoxRef: React.RefObject<HTMLDivElement>;
  onGroupMouseDown: (e: React.MouseEvent) => void;
  onGroupMouseMove: (e: React.MouseEvent) => void;
  onGroupMouseUp: () => void;

  // Handlers
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onGridPointerDown: (e: React.PointerEvent, rowId: string) => void;
  onGridPointerMove: (e: React.PointerEvent) => void;
  onGridPointerUp: (e: React.PointerEvent) => void;
  onLeaveEdit: (id: string) => void;
  onLeaveDelete: (id: string) => void;
  onLeaveResizeEnd: (
    id: string,
    newDuration: number,
    daysShifted: number
  ) => void;
  onTooltipOpen: () => void;
  onTooltipClose: () => void;
}

export const TimelineDndContext = forwardRef<
  HTMLDivElement,
  TimelineDndContextProps
>((props, ref) => {
  const {
    days,
    daysCount,
    startDate,
    groups,
    leaves,
    collapsedGroups,
    absenceTypes,
    activeLeave,
    blockPastDays,
    disabledOverlayWidth,
    disableDeletion,
    selection,
    selectionBoxRef,
    onScroll,
    onDragStart,
    onDragEnd,
    onGridPointerDown,
    onGridPointerMove,
    onGridPointerUp,
    onLeaveEdit,
    onLeaveDelete,
    onLeaveResizeEnd,
    onTooltipOpen,
    onTooltipClose,
    onGroupMouseDown,
    onGroupMouseMove,
    onGroupMouseUp,
  } = props;
  // 1. Hämta helgdagar för de år som visas
  const holidays = useMemo(() => {
    const years = Array.from(new Set(days.map((d) => d.year())));
    let allHolidays: Record<string, any> = {};
    years.forEach((y) => {
      allHolidays = { ...allHolidays, ...getSwedishHolidays(y) };
    });
    return allHolidays;
  }, [days]);

  const isRedDay = (day: Dayjs) => {
    const dateStr = day.format("YYYY-MM-DD");
    // 0 = Sunday, 6 = Saturday
    return day.day() === 0 || day.day() === 6 || holidays[dateStr]?.isRedDay;
  };
  // 1. Gruppera dagar per månad en gång
  const monthBlocks = useMemo(() => {
    const months: { key: string; days: Dayjs[]; label: string }[] = [];
    const uniqueMonths = Array.from(
      new Set(days.map((d) => d.format("YYYY-MM")))
    );

    uniqueMonths.forEach((monthKey) => {
      const mDays = days.filter((d) => d.format("YYYY-MM") === monthKey);
      months.push({
        key: monthKey,
        days: mDays,
        label: mDays[0].format("MMMM YYYY"),
      });
    });
    return months;
  }, [days]);

  // 2. Gruppera dagar per vecka en gång
  const weekBlocks = useMemo(() => {
    const weeks: { key: string; days: Dayjs[]; label: string }[] = [];
    const uniqueWeeks = Array.from(
      new Set(days.map((d) => `${d.isoWeekYear()}-${d.isoWeek()}`))
    );

    uniqueWeeks.forEach((weekKey) => {
      const wDays = days.filter(
        (d) => `${d.isoWeekYear()}-${d.isoWeek()}` === weekKey
      );
      weeks.push({
        key: weekKey,
        days: wDays,
        label: `v.${wDays[0].isoWeek()}`,
      });
    });
    return weeks;
  }, [days]);

  // 3. Cacha hela Header-blocket (Detta stoppar lagget!)
  const MemoizedHeader = useMemo(
    () => (
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "white",
          width: daysCount * CELL_WIDTH,
        }}
      >
        {/* --- 1. Months Row --- */}
        <Box
          sx={{ display: "flex", height: 40, borderBottom: "1px solid #eee" }}
        >
          {monthBlocks.map((m) => (
            <Box
              key={m.key}
              sx={{
                position: "relative", // Denna box är "gränsen" för texten
                width: m.days.length * CELL_WIDTH,
                height: "100%",
                flexShrink: 0,
                borderRight: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  position: "sticky",
                  left: 0, // Fastnar vid sidebaren
                  paddingLeft: "10px",
                  paddingTop: "8px",
                  fontWeight: 700,
                  color: "primary.main",
                  whiteSpace: "nowrap",
                  width: "fit-content", // Gör att den kan knuffas
                  display: "block",
                }}
              >
                {m.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* --- 2. Weeks Row --- */}
        <Box
          sx={{
            display: "flex",
            height: 25,
            bgcolor: "#fafafa",
            borderBottom: "1px solid #eee",
          }}
        >
          {weekBlocks.map((w) => (
            <Box
              key={w.key}
              sx={{
                position: "relative",
                width: w.days.length * CELL_WIDTH,
                height: "100%",
                borderRight: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: "sticky",
                  left: 0,
                  pl: "8px",
                  lineHeight: "25px",
                  fontWeight: 700,
                  color: "text.secondary",
                }}
              >
                {w.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* --- 3. Individual Days Row --- */}
        <Box sx={{ display: "flex", height: 40 }}>
          {days.map((day) => {
            const isRed = isRedDay(day);
            return (
              <Tooltip
                key={day.format("YYYY-MM-DD")}
                title={holidays[day.format("YYYY-MM-DD")]?.name || ""}
              >
                <Box
                  sx={{
                    width: CELL_WIDTH,
                    minWidth: CELL_WIDTH,
                    textAlign: "center",
                    pt: 0.5,
                    borderRight: "1px solid #eee",
                    borderBottom: "1px solid #ddd",
                    bgcolor: day.isSame(new Date(), "day")
                      ? "#fff9c4"
                      : isRed
                      ? "rgba(244, 67, 54, 0.15)"
                      : "white",
                    color: isRed ? "error.main" : "text.primary",
                  }}
                >
                  <Typography
                    sx={{ fontSize: "0.6rem", fontWeight: isRed ? 700 : 500 }}
                  >
                    {day.format("ddd").toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    {day.format("D")}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    ),
    [days, monthBlocks, weekBlocks, holidays]
  ); // Rubriken ritas om ENDAST om dagarna ändras
  // --- Grid Visual Constants ---
  return (
    <Box
      ref={ref}
      onScroll={onScroll}
      sx={{ flex: 1, overflowX: "auto", position: "relative", bgcolor: "#fff" }}
    >
      <PastDaysOverlay width={disabledOverlayWidth} isVisible={blockPastDays} />

      {/* 2. Sticky Header Area */}
      {MemoizedHeader}

      {/* 3. Drag and Drop Context Area */}
      <DndContext
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <Box sx={{ position: "relative", width: daysCount * CELL_WIDTH }}>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {days.map(
              (day, i) =>
                isRedDay(day) && (
                  <Box
                    key={`bg-${i}`}
                    sx={{
                      position: "absolute",
                      left: i * CELL_WIDTH,
                      width: CELL_WIDTH,
                      height: "100%",
                      bgcolor: "rgba(244, 67, 54, 0.04)",
                      borderRight: "1px solid rgba(0, 0, 0, 0.02)",
                    }}
                  />
                )
            )}
          </Box>

          {/* No Groups Watermark */}
          {groups.length === 0 && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                zIndex: 1,
                pointerEvents: "none",
                opacity: 0.3,
                width: "100%",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "text.secondary",
                  fontWeight: 300,
                  fontSize: "2rem",
                  mb: 1,
                }}
              >
                No Groups Exist
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: "text.secondary", fontWeight: 300 }}
              >
                Add a group to start managing leaves
              </Typography>
              {/* Optional: Add an icon */}
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: "4rem" }}>📅</Typography>
              </Box>
            </Box>
          )}

          {groups.map((group) => {
            const isCollapsed = collapsedGroups.includes(group.id);
            return (
              <Box key={group.id}>
                {/* Visual Separator for Group */}
                <Box
                  onMouseDown={onGroupMouseDown}
                  onMouseMove={onGroupMouseMove}
                  onMouseUp={onGroupMouseUp}
                  onMouseLeave={onGroupMouseUp}
                  sx={{
                    height: 40,
                    bgcolor: alpha("#000", 0.04),
                    borderBottom: "1px solid #eee",
                    cursor: "grab",
                    userSelect: "none",
                    "&:hover": { bgcolor: alpha("#000", 0.08) },
                    "&:active": { cursor: "grabbing" },
                  }}
                />

                <Collapse in={!isCollapsed}>
                  {(group.resources || []).map((res) => (
                    <Box
                      key={res.id}
                      onPointerDown={(e) => onGridPointerDown(e, res.id)}
                      onPointerMove={onGridPointerMove}
                      onPointerUp={onGridPointerUp}
                      sx={{
                        height: ROW_HEIGHT,
                        borderBottom: "1px solid #eee",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {/* Drag-to-Select Box (Ghost block during creation) */}
                      {selection.isSelecting && selection.rowId === res.id && (
                        <Box
                          ref={selectionBoxRef}
                          style={{
                            left: selection.startX,
                            width: CELL_WIDTH,
                          }}
                          sx={{
                            position: "absolute",
                            top: 5,
                            height: ROW_HEIGHT - 10,
                            bgcolor: alpha("#1976d2", 0.15),
                            border: "2px dashed #1976d2",
                            borderRadius: 1,
                            zIndex: 10,
                            pointerEvents: "none",
                          }}
                        />
                      )}

                      {/* Render Leave Blocks for this Resource */}
                      {leaves
                        .filter((l) => l.rowId === res.id)
                        .map((l) => (
                          <LeaveBlock
                            key={l.id}
                            leave={l}
                            resourceName={res.name}
                            left={getDateOffset(l.startDate, startDate)}
                            onEdit={onLeaveEdit}
                            onDelete={onLeaveDelete}
                            onResizeEnd={onLeaveResizeEnd}
                            onTooltipOpen={onTooltipOpen}
                            onTooltipClose={onTooltipClose}
                            isDeletionDisabled={disableDeletion}
                            isPastDaysBlocked={blockPastDays}
                            scrollContainerRef={
                              ref as React.RefObject<HTMLDivElement>
                            }
                          />
                        ))}
                    </Box>
                  ))}
                </Collapse>
              </Box>
            );
          })}
        </Box>

        {/* Drag Visual Ghost */}
        <DragOverlay adjustScale={false}>
          {activeLeave && (
            <LeaveBlock
              leave={activeLeave}
              isOverlay
              resourceName=""
              left={0}
              onEdit={() => {}}
              onDelete={() => {}}
              onResizeEnd={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>
    </Box>
  );
});
