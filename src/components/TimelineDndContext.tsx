import React, { forwardRef } from "react";
import { Box, Typography, Collapse, alpha } from "@mui/material";
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

  // --- Grid Visual Constants ---
  const weekendOffset = ((startDate.day() - 1 + 7) % 7) * CELL_WIDTH;
  const weekendGrid = `repeating-linear-gradient(
    90deg, 
    transparent 0px, 
    transparent ${5 * CELL_WIDTH}px, 
    rgba(255, 0, 0, 0.05) ${5 * CELL_WIDTH}px, 
    rgba(255, 0, 0, 0.05) ${7 * CELL_WIDTH}px
  )`;

  return (
    <Box
      ref={ref}
      onScroll={onScroll}
      sx={{ flex: 1, overflowX: "auto", position: "relative", bgcolor: "#fff" }}
    >
      <PastDaysOverlay width={disabledOverlayWidth} isVisible={blockPastDays} />

      {/* 2. Sticky Header Area */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          bgcolor: "white",
          width: daysCount * CELL_WIDTH,
        }}
      >
        {/* --- 1. Months/Year Row --- */}
        <Box
          onMouseDown={onGroupMouseDown}
          onMouseMove={onGroupMouseMove}
          onMouseUp={onGroupMouseUp}
          onMouseLeave={onGroupMouseUp}
          sx={{
            display: "flex",
            height: 40,
            borderBottom: "1px solid #eee",
            position: "relative",
            cursor: "grab",
            userSelect: "none",
            "&:active": { cursor: "grabbing" },
            "&:hover": { bgcolor: alpha("#000", 0.02) },
          }}
        >
          {days
            .filter((d, i) => i === 0 || d.date() === 1)
            .map((day) => (
              <Typography
                key={day.toISOString() + "m"}
                variant="subtitle2"
                sx={{
                  position: "absolute",
                  left: getDateOffset(day.format("YYYY-MM-DD"), startDate) + 10,
                  pt: 1,
                  fontWeight: 700,
                  color: "primary.main",
                  pointerEvents: "none",
                }}
              >
                {day.format("MMMM YYYY")}
              </Typography>
            ))}
        </Box>

        {/* --- 2. Weeks Row --- */}
        <Box
          onMouseDown={onGroupMouseDown}
          onMouseMove={onGroupMouseMove}
          onMouseUp={onGroupMouseUp}
          onMouseLeave={onGroupMouseUp}
          sx={{
            display: "flex",
            height: 25,
            bgcolor: "#fafafa",
            borderBottom: "1px solid #eee",
            position: "relative",
            cursor: "grab",
            userSelect: "none",
            "&:active": { cursor: "grabbing" },
            "&:hover": { bgcolor: alpha("#000", 0.02) },
          }}
        >
          {days
            .filter((d) => d.day() === 1)
            .map((day) => (
              <Typography
                key={day.toISOString() + "w"}
                variant="caption"
                sx={{
                  position: "absolute",
                  left: getDateOffset(day.format("YYYY-MM-DD"), startDate) + 5,
                  fontWeight: 700,
                  pointerEvents: "none",
                }}
              >
                v.{day.isoWeek()}
              </Typography>
            ))}
        </Box>

        {/* --- 3. Individual Days Row --- */}
        <Box
          onMouseDown={onGroupMouseDown}
          onMouseMove={onGroupMouseMove}
          onMouseUp={onGroupMouseUp}
          onMouseLeave={onGroupMouseUp}
          sx={{
            display: "flex",
            height: 40,
            cursor: "grab",
            userSelect: "none",
            "&:active": { cursor: "grabbing" },
          }}
        >
          {days.map((day) => {
            const isToday = day.isSame(new Date(), "day");
            const isWeekend = day.day() === 0 || day.day() === 6;
            return (
              <Box
                key={day.toISOString()}
                sx={{
                  width: CELL_WIDTH,
                  minWidth: CELL_WIDTH,
                  textAlign: "center",
                  pt: 0.5,
                  borderRight: "1px solid #eee",
                  borderBottom: "1px solid #ddd",
                  bgcolor: isToday
                    ? "#fff9c4"
                    : isWeekend
                    ? alpha("#f44336", 0.05)
                    : "white",
                  pointerEvents: "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 600,
                    color: isWeekend ? "error.main" : "text.secondary",
                  }}
                >
                  {day.format("ddd").toUpperCase()}
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {day.format("D")}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 3. Drag and Drop Context Area */}
      <DndContext
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        modifiers={[restrictToHorizontalAxis]}
      >
        <Box sx={{ position: "relative", width: daysCount * CELL_WIDTH }}>
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
                        backgroundImage: weekendGrid,
                        backgroundSize: `${7 * CELL_WIDTH}px 100%`,
                        backgroundPosition: `-${weekendOffset}px 0`,
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
