import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Paper, Typography, Box } from "@mui/material";
import { CELL_WIDTH, ROW_HEIGHT, type LeaveItem } from "../utils";

interface Props {
  leave: LeaveItem;
  left?: number;
  isOverlay?: boolean;
  // UPDATE: Callback now accepts daysShifted (change in start date)
  onResizeEnd?: (id: string, newDuration: number, daysShifted: number) => void;
}

export const LeaveBlock = ({
  leave,
  left = 0,
  isOverlay = false,
  onResizeEnd,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: leave.id,
      data: leave,
      disabled: isOverlay,
    });

  const [isResizing, setIsResizing] = useState(false);
  const [visualDuration, setVisualDuration] = useState(leave.durationDays);
  // NEW: Track how many days the start date has shifted during resize
  const [visualStartShift, setVisualStartShift] = useState(0);

  // --- GENERIC RESIZE HANDLER ---
  const initResize = (e: React.PointerEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    setIsResizing(true);
    setVisualDuration(leave.durationDays);
    setVisualStartShift(0);

    const startX = e.clientX;
    const startDuration = leave.durationDays;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaDays = Math.round(deltaX / CELL_WIDTH);

      if (direction === "right") {
        // RIGHT: Only duration changes
        const newDuration = Math.max(1, startDuration + deltaDays);
        setVisualDuration(newDuration);
      } else {
        // LEFT: Start shifts, Duration changes inversely
        // Example: Drag left (-1 day) -> Start -1, Duration +1

        // limit: Can't shrink duration below 1
        // (startDuration - deltaDays) >= 1  =>  deltaDays <= startDuration - 1
        const maxShift = startDuration - 1;
        const actualShift = Math.min(deltaDays, maxShift);

        setVisualStartShift(actualShift);
        setVisualDuration(startDuration - actualShift);
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);

      setIsResizing(false);

      // Final Calculation
      const finalDeltaX = upEvent.clientX - startX;
      const deltaDays = Math.round(finalDeltaX / CELL_WIDTH);

      let finalDuration = startDuration;
      let finalShift = 0;

      if (direction === "right") {
        finalDuration = Math.max(1, startDuration + deltaDays);
      } else {
        const maxShift = startDuration - 1;
        finalShift = Math.min(deltaDays, maxShift);
        finalDuration = startDuration - finalShift;
      }

      if (onResizeEnd) {
        // Only fire if something actually changed
        if (finalDuration !== startDuration || finalShift !== 0) {
          onResizeEnd(leave.id, finalDuration, finalShift);
        }
      }

      // Reset visual state
      setVisualStartShift(0);
    };

    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
  };

  // --- CALCULATE STYLE ---

  // 1. Duration (Width)
  const displayDuration = isResizing ? visualDuration : leave.durationDays;
  const currentWidth = displayDuration * CELL_WIDTH - 4;

  // 2. Position (Left)
  // If resizing left, we must visually shift the block's position
  const displayLeft = isResizing ? left + visualStartShift * CELL_WIDTH : left;

  const style: React.CSSProperties = {
    position: isOverlay ? "relative" : "absolute",
    left: isOverlay ? 0 : `${displayLeft}px`,
    transform:
      !isOverlay && transform && !isResizing
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
    width: `${currentWidth}px`,
    height: ROW_HEIGHT - 10,
    backgroundColor: leave.color,
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    zIndex: isOverlay ? 999 : isResizing ? 1000 : transform ? 100 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
    opacity: !isOverlay && isDragging ? 0 : 1,
    boxShadow: isOverlay || isResizing ? "0 8px 16px rgba(0,0,0,0.2)" : "none",
    transition: isResizing ? "none" : "box-shadow 0.2s ease, opacity 0.1s",
  };

  // Common Handle Styles
  const handleStyle = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: "15px",
    zIndex: 10,
    cursor: "col-resize",
    "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
  };

  if (isOverlay) {
    return (
      <Paper style={style} elevation={4}>
        <Typography variant="caption" noWrap fontWeight="bold">
          {leave.name}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      elevation={2}
    >
      {/* LEFT HANDLE */}
      {!isDragging && (
        <Box
          onPointerDown={(e) => initResize(e, "left")}
          sx={{ ...handleStyle, left: 0 }}
        />
      )}

      <Typography
        variant="caption"
        noWrap
        fontWeight="bold"
        sx={{ flex: 1, textAlign: "center" }}
      >
        {leave.name}
      </Typography>

      {/* RIGHT HANDLE */}
      {!isDragging && (
        <Box
          onPointerDown={(e) => initResize(e, "right")}
          sx={{ ...handleStyle, right: 0 }}
        />
      )}
    </Paper>
  );
};
