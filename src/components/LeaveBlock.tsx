import React, { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Paper, Typography, Box } from "@mui/material";
import { CELL_WIDTH, ROW_HEIGHT, type LeaveItem } from "../utils";

interface Props {
  leave: LeaveItem;
  left?: number;
  isOverlay?: boolean;
  onResizeEnd?: (id: string, newDuration: number) => void; // New prop
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
      disabled: isOverlay, // Disable drag if overlay
    });

  // Local state for resizing visual feedback
  const [isResizing, setIsResizing] = useState(false);
  const [resizeWidth, setResizeWidth] = useState(0);

  // --- RESIZE LOGIC ---
  const handleResizeStart = (e: React.MouseEvent) => {
    // CRITICAL: Stop dnd-kit from picking this up as a drag
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    setResizeWidth(leave.durationDays * CELL_WIDTH);

    const startX = e.clientX;
    const startWidth = leave.durationDays * CELL_WIDTH;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      // Snap to grid visually
      const rawWidth = startWidth + deltaX;
      const snappedWidth = Math.max(
        CELL_WIDTH, // Minimum 1 day
        Math.round(rawWidth / CELL_WIDTH) * CELL_WIDTH
      );
      setResizeWidth(snappedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Calculate final days
      // We use the last 'resizeWidth' stored in state (or recalculate)
      // Actually, relying on state inside an event listener closure is tricky.
      // Let's recalculate based on the final visual width logic.
      // Better approach: calculate final days here.
    };

    // Better MouseUp specifically for calculating result
    const handleMouseUpLogic = (upEvent: MouseEvent) => {
      const deltaX = upEvent.clientX - startX;
      const rawWidth = startWidth + deltaX;
      const days = Math.max(1, Math.round(rawWidth / CELL_WIDTH));
      if (onResizeEnd) onResizeEnd(leave.id, days);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseup", handleMouseUpLogic, { once: true });
  };

  // Determine width: dragging/overlay? fixed. resizing? dynamic. normal? fixed.
  const currentWidth = isResizing
    ? resizeWidth
    : leave.durationDays * CELL_WIDTH - 4;

  const style: React.CSSProperties = {
    position: isOverlay ? "relative" : "absolute",
    left: isOverlay ? 0 : `${left}px`,
    transform:
      !isOverlay && transform
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
    zIndex: isOverlay ? 999 : isResizing ? 100 : transform ? 100 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
    opacity: !isOverlay && isDragging ? 0 : 1,
    boxShadow: isOverlay || isResizing ? "0 8px 16px rgba(0,0,0,0.2)" : "none",
    transition: isResizing ? "none" : "box-shadow 0.2s ease, opacity 0.1s",
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
      {...listeners} // Drag listeners on the main body
      {...attributes}
      elevation={2}
    >
      <Typography variant="caption" noWrap fontWeight="bold">
        {leave.name}
      </Typography>

      {/* RESIZE HANDLE */}
      {!isDragging && (
        <Box
          onPointerDown={handleResizeStart} // Use PointerDown for better touch/mouse support
          sx={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: "10px",
            cursor: "col-resize",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.1)",
            },
          }}
        />
      )}
    </Paper>
  );
};
