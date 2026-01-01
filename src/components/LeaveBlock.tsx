import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Paper,
  Typography,
  Box,
  Tooltip,
  IconButton,
  Button,
  Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DateRangeIcon from "@mui/icons-material/DateRange";
import dayjs from "dayjs";
import { CELL_WIDTH, ROW_HEIGHT, type LeaveItem } from "../utils";

interface Props {
  leave: LeaveItem;
  left?: number;
  isOverlay?: boolean;
  onResizeEnd?: (id: string, newDuration: number, daysShifted: number) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  // NEW CALLBACKS
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const LeaveBlock = ({
  leave,
  left = 0,
  isOverlay = false,
  onResizeEnd,
  scrollContainerRef,
  onEdit,
  onDelete,
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

  // Refs
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
    if (currentX < containerLeft + edgeThreshold)
      container.scrollLeft -= scrollSpeed;
    else if (currentX > containerLeft + containerWidth - edgeThreshold)
      container.scrollLeft += scrollSpeed;

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
    if (scrollContainerRef?.current)
      startScrollLeftRef.current = scrollContainerRef.current.scrollLeft;

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

        if (direction === "right")
          finalDuration = Math.max(1, startDuration + deltaDays);
        else {
          const maxShift = startDuration - 1;
          finalShift = Math.min(deltaDays, maxShift);
          finalDuration = startDuration - finalShift;
        }
        if (
          onResizeEnd &&
          (finalDuration !== startDuration || finalShift !== 0)
        ) {
          onResizeEnd(leave.id, finalDuration, finalShift);
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

  const displayDuration = isResizing ? visualDuration : leave.durationDays;
  const currentWidth = displayDuration * CELL_WIDTH - 4;
  const displayLeft = isResizing ? left + visualStartShift * CELL_WIDTH : left;
  const blockHeight = ROW_HEIGHT - 10;
  const topOffset = (ROW_HEIGHT - blockHeight) / 2;

  const style: React.CSSProperties = {
    position: isOverlay ? "relative" : "absolute",
    left: isOverlay ? 0 : `${displayLeft}px`,
    top: `${topOffset}px`,
    transform:
      !isOverlay && transform && !isResizing
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
    width: `${currentWidth}px`,
    height: `${blockHeight}px`,
    backgroundColor: leave.color,
    color: "white",
    padding: "4px 8px",
    borderRadius: "50px",
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

  const handleBar = (
    <Box
      sx={{
        width: "4px",
        height: "50%",
        bgcolor: "rgba(255,255,255,0.5)",
        borderRadius: 1,
      }}
    />
  );

  // --- RICH TOOLTIP CONTENT ---
  const tooltipContent = (
    <Box>
      {/* Header Color Bar */}
      <Box sx={{ bgcolor: leave.color, height: 6, width: "100%" }} />
      <Box sx={{ p: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1, fontSize: "0.95rem" }}
        >
          {leave.name}
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <DateRangeIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              {dayjs(leave.startDate).format("D MMM")} -{" "}
              {dayjs(leave.startDate)
                .add(leave.durationDays - 1, "day")
                .format("D MMM")}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <AccessTimeIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              {leave.durationDays} dagar
            </Typography>
          </Box>
        </Box>

        {/* Buttons */}
        <Box
          sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(leave.id);
            }}
            sx={{ border: "1px solid", borderColor: "rgba(211, 47, 47, 0.3)" }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(leave.id);
            }}
            sx={{ border: "1px solid", borderColor: "rgba(3, 0, 189, 0.57)" }}
          >
            <EditOutlinedIcon fontSize="small" color="primary" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  const paperContent = (
    <Paper
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      elevation={2}
      onPointerDown={(e) => {
        e.stopPropagation();
        listeners?.onPointerDown?.(e);
      }}
    >
      {!isDragging && (
        <Box
          onPointerDown={(e) => initResize(e, "left")}
          sx={{ ...handleStyle, left: 0 }}
        >
          {handleBar}
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
          {handleBar}
        </Box>
      )}
    </Paper>
  );

  if (isOverlay || isDragging || isResizing) return paperContent;

  return (
    <Tooltip
      title={tooltipContent}
      arrow
      interactive // CRITICAL: Allows moving mouse into the tooltip to click buttons
      placement="top"
      enterDelay={200} // Small delay to prevent flickering
      leaveDelay={200}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: "white",
            color: "text.primary",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            p: 0, // Reset padding so we control it in Box
            minWidth: 260,
            borderRadius: 2,
            border: "1px solid #eee",
          },
        },
        arrow: { sx: { color: "white" } },
      }}
    >
      {/* We need a wrapping span/div here because Tooltip needs a ref, but Paper already has the dnd-kit ref */}
      <Box
        component="div"
        sx={{
          position: "absolute",
          left: style.left,
          top: style.top,
          zIndex: style.zIndex,
        }}
      >
        {/* We override position here to fit the wrapper, then pass relative to paper */}
        {React.cloneElement(paperContent, {
          style: { ...style, position: "relative", left: 0, top: 0 },
        })}
      </Box>
    </Tooltip>
  );
};
