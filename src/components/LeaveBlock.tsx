import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Paper, Typography, Box } from "@mui/material";
import { CELL_WIDTH, ROW_HEIGHT, type LeaveItem } from "../utils";

interface Props {
  leave: LeaveItem;
  left?: number;
  isOverlay?: boolean;
  onResizeEnd?: (id: string, newDuration: number, daysShifted: number) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export const LeaveBlock = ({
  leave,
  left = 0,
  isOverlay = false,
  onResizeEnd,
  scrollContainerRef,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: leave.id,
      data: leave,
      disabled: isOverlay,
    });

  const [isResizing, setIsResizing] = useState(false);
  const [visualDuration, setVisualDuration] = useState(leave.durationDays);
  const [visualStartShift, setVisualStartShift] = useState(0);

  const mouseXRef = useRef(0);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const isResizingRef = useRef(false);
  const directionRef = useRef<"left" | "right">("right");
  const requestRef = useRef<number>(0);
  const prevLeftRef = useRef(left);

  useLayoutEffect(() => {
    const jump = left - prevLeftRef.current;
    if (jump !== 0 && isResizingRef.current) {
      startScrollLeftRef.current += jump;
    }
    prevLeftRef.current = left;
  }, [left]);

  const animate = () => {
    if (!isResizingRef.current || !scrollContainerRef?.current) return;

    const container = scrollContainerRef.current;
    const { left: containerLeft, width: containerWidth } =
      container.getBoundingClientRect();
    const currentX = mouseXRef.current;

    const edgeThreshold = 50;
    const scrollSpeed = 15;

    if (currentX < containerLeft + edgeThreshold) {
      container.scrollLeft -= scrollSpeed;
    } else if (currentX > containerLeft + containerWidth - edgeThreshold) {
      container.scrollLeft += scrollSpeed;
    }

    const currentScrollLeft = container.scrollLeft;
    const scrollDiff = currentScrollLeft - startScrollLeftRef.current;
    const mouseDiff = currentX - startXRef.current;

    const totalDeltaX = mouseDiff + scrollDiff;
    const deltaDays = Math.round(totalDeltaX / CELL_WIDTH);

    const startDuration = leave.durationDays;

    if (directionRef.current === "right") {
      const newDuration = Math.max(1, startDuration + deltaDays);
      setVisualDuration(newDuration);
    } else {
      const maxShift = startDuration - 1;
      const actualShift = Math.min(deltaDays, maxShift);
      setVisualStartShift(actualShift);
      setVisualDuration(startDuration - actualShift);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  const initResize = (e: React.PointerEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);

    setIsResizing(true);
    setVisualDuration(leave.durationDays);
    setVisualStartShift(0);

    isResizingRef.current = true;
    directionRef.current = direction;
    startXRef.current = e.clientX;
    mouseXRef.current = e.clientX;
    prevLeftRef.current = left;

    if (scrollContainerRef?.current) {
      startScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      mouseXRef.current = moveEvent.clientX;
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);

      isResizingRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      setIsResizing(false);

      if (scrollContainerRef?.current) {
        const finalScrollLeft = scrollContainerRef.current.scrollLeft;
        const scrollDiff = finalScrollLeft - startScrollLeftRef.current;
        const mouseDiff = upEvent.clientX - startXRef.current;
        const totalDeltaX = mouseDiff + scrollDiff;
        const deltaDays = Math.round(totalDeltaX / CELL_WIDTH);

        const startDuration = leave.durationDays;
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
          if (finalDuration !== startDuration || finalShift !== 0) {
            onResizeEnd(leave.id, finalDuration, finalShift);
          }
        }
      }
      setVisualStartShift(0);
    };

    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // --- STYLES ---
  const displayDuration = isResizing ? visualDuration : leave.durationDays;
  const currentWidth = displayDuration * CELL_WIDTH - 4;
  const displayLeft = isResizing ? left + visualStartShift * CELL_WIDTH : left;

  // CONSTANTS FOR CENTERING
  const blockHeight = ROW_HEIGHT - 10;
  const topOffset = (ROW_HEIGHT - blockHeight) / 2; // Centers the block

  const style: React.CSSProperties = {
    position: isOverlay ? "relative" : "absolute",
    left: isOverlay ? 0 : `${displayLeft}px`,
    top: `${topOffset}px`, // <--- ADDED VERTICAL CENTERING

    transform:
      !isOverlay && transform && !isResizing
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,

    width: `${currentWidth}px`,
    height: `${blockHeight}px`,

    backgroundColor: leave.color,
    color: "white",
    padding: "4px 8px",
    borderRadius: "28px",
    display: "flex",
    alignItems: "center",
    zIndex: isOverlay ? 999 : isResizing ? 1000 : transform ? 100 : 1,
    cursor: isOverlay ? "grabbing" : "grab",
    opacity: !isOverlay && isDragging ? 0 : 1,
    boxShadow: isOverlay || isResizing ? "0 8px 16px rgba(0,0,0,0.2)" : "none",
    transition: isResizing ? "none" : "box-shadow 0.2s ease, opacity 0.1s",
  };

  const handleStyle = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: "20px",
    zIndex: 10,
    cursor: "col-resize",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
      {!isDragging && (
        <Box
          onPointerDown={(e) => initResize(e, "left")}
          sx={{ ...handleStyle, left: 0 }}
        >
          <Box
            sx={{
              width: "4px",
              height: "50%",
              bgcolor: "rgba(255,255,255,0.5)",
              borderRadius: 1,
            }}
          />
        </Box>
      )}

      <Typography
        variant="caption"
        noWrap
        fontWeight="bold"
        sx={{ flex: 1, textAlign: "center" }}
      >
        {leave.name}
      </Typography>

      {!isDragging && (
        <Box
          onPointerDown={(e) => initResize(e, "right")}
          sx={{ ...handleStyle, right: 0 }}
        >
          <Box
            sx={{
              width: "4px",
              height: "50%",
              bgcolor: "rgba(255,255,255,0.5)",
              borderRadius: 1,
            }}
          />
        </Box>
      )}
    </Paper>
  );
};
