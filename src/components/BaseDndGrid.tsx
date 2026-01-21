import React, { forwardRef, type ReactNode } from "react";
import { Box, Collapse, alpha } from "@mui/material";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { LeaveBlock } from "./ReusebleLeaveBlock";
import type { Group, LeaveItem } from "../types";

interface BaseDndGridProps {
  groups: Group[];
  leaves: LeaveItem[];
  collapsedGroups: string[];
  activeLeave: LeaveItem | null;
  cellWidth: number;
  rowHeight: number;
  totalWidth: number;
  header: ReactNode;
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
    daysShifted: number,
  ) => void;
  renderBackground?: () => ReactNode;
  renderSelectionBox?: (resId: string) => ReactNode;
  onGroupMouseDown: (e: React.MouseEvent) => void;
  onGroupMouseMove: (e: React.MouseEvent) => void;
  onGroupMouseUp: () => void;
  disableDeletion: boolean;
  blockPastDays: boolean;
  leftOffsetCalc: (leave: LeaveItem) => number;
}

export const BaseDndGrid = forwardRef<HTMLDivElement, BaseDndGridProps>(
  (props, ref) => {
    const {
      groups,
      leaves,
      collapsedGroups,
      activeLeave,
      cellWidth,
      rowHeight,
      totalWidth,
      header,
      onScroll,
      onDragStart,
      onDragEnd,
      onGridPointerDown,
      onGridPointerMove,
      onGridPointerUp,
      onLeaveEdit,
      onLeaveDelete,
      onLeaveResizeEnd,
      renderBackground,
      renderSelectionBox,
      onGroupMouseDown,
      onGroupMouseMove,
      onGroupMouseUp,
      disableDeletion,
      blockPastDays,
      leftOffsetCalc,
    } = props;

    return (
      <Box
        ref={ref}
        onScroll={onScroll}
        // FIX: Bind move and up here so drag isn't lost
        onMouseMove={onGroupMouseMove}
        onMouseUp={onGroupMouseUp}
        onMouseLeave={onGroupMouseUp}
        sx={{
          flex: 1,
          overflowX: "auto",
          position: "relative",
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            bgcolor: "white",
            width: totalWidth,
          }}
        >
          {header}
        </Box>

        <DndContext
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <Box sx={{ position: "relative", width: totalWidth }}>
            {renderBackground?.()}

            {groups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.id);
              return (
                <Box key={group.id}>
                  {/* Visual Separator for Group */}
                  <Box
                    onMouseDown={onGroupMouseDown}
                    sx={{
                      height: 40,
                      bgcolor: alpha("#000", 0.04),
                      borderBottom: "1px solid #eee",
                      cursor: "grab",
                      userSelect: "none",
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
                          height: rowHeight,
                          borderBottom: "1px solid #eee",
                          position: "relative",
                          backgroundImage: `linear-gradient(to right, #eee 1px, transparent 1px)`,
                          backgroundSize: `${cellWidth}px 100%`,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {renderSelectionBox?.(res.id)}

                        {leaves
                          .filter((l) => l.rowId === res.id)
                          .map((l) => (
                            <LeaveBlock
                              key={l.id}
                              leave={l}
                              cellWidth={cellWidth}
                              left={leftOffsetCalc(l)}
                              resourceName={res.name}
                              onResizeEnd={onLeaveResizeEnd}
                              onEdit={onLeaveEdit}
                              onDelete={onLeaveDelete}
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

          <DragOverlay adjustScale={false}>
            {activeLeave && (
              <LeaveBlock
                leave={activeLeave}
                isOverlay
                cellWidth={cellWidth}
                left={leftOffsetCalc(activeLeave)}
              />
            )}
          </DragOverlay>
        </DndContext>
      </Box>
    );
  },
);
