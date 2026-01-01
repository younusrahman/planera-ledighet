import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Paper, Typography } from "@mui/material";
import { CELL_WIDTH, ROW_HEIGHT } from "../utils";
import type { LeaveItem } from "../utils";

interface Props {
  leave: LeaveItem;
  left?: number;        // Optional because Overlay doesn't need it
  isOverlay?: boolean;  // Flag to render in "Overlay Mode"
}

export const LeaveBlock = ({ leave, left = 0, isOverlay = false }: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: leave.id,
      data: leave,
      disabled: isOverlay, // Disable logic if this IS the overlay
    });

  const style: React.CSSProperties = {
    // Positioning Logic
    position: isOverlay ? "relative" : "absolute",
    left: isOverlay ? 0 : `${left}px`,
    
    // Transform Logic: Only apply dnd-kit transform to the original, not overlay
    transform: !isOverlay && transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,

    // Dimensions
    width: `${leave.durationDays * CELL_WIDTH - 4}px`,
    height: ROW_HEIGHT - 10,
    
    // Styling
    backgroundColor: leave.color,
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    
    // Interaction
    zIndex: isOverlay ? 999 : transform ? 100 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
    opacity: !isOverlay && isDragging ? 0 : 1, // Hide original while dragging
    boxShadow: isOverlay ? "0 8px 16px rgba(0,0,0,0.2)" : "none",
    
    // CRITICAL: Never animate 'left' or 'all' during infinite scroll
    transition: "box-shadow 0.2s ease, opacity 0.1s", 
  };

  // If overlay, we strip the dnd-kit refs so it's purely visual
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
      <Typography variant="caption" noWrap fontWeight="bold">
        {leave.name}
      </Typography>
    </Paper>
  );
};