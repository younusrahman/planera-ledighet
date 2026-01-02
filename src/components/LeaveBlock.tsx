import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DateRangeIcon from "@mui/icons-material/DateRange";
import dayjs from "dayjs";
import type { Instance } from "@popperjs/core";
import { CELL_WIDTH, ROW_HEIGHT, type LeaveItem } from "../utils";

interface Props {
  leave: LeaveItem;
  left?: number;
  isOverlay?: boolean;
  onResizeEnd?: (id: string, newDuration: number, daysShifted: number) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTooltipOpen?: () => void;
  onTooltipClose?: () => void;
}

export const LeaveBlock = ({
  leave,
  left = 0,
  isOverlay = false,
  onResizeEnd,
  scrollContainerRef,
  onEdit,
  onDelete,
  onTooltipOpen,
  onTooltipClose,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: leave.id,
      data: leave,
      disabled: isOverlay,
    });

  // --- STATE ---
  const [isResizing, setIsResizing] = useState(false);
  const [visualDuration, setVisualDuration] = useState(leave.durationDays);
  const [visualStartShift, setVisualStartShift] = useState(0);

  // Tooltip State
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // --- REFS FOR VIRTUAL POSITIONING ---
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const popperRef = useRef<Instance | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number>(0);

  // --- RESIZE REFS ---
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
    const { left: cL, width: cW } = container.getBoundingClientRect();
    const pX = mouseXRef.current;
    const eT = 50;
    const sS = 15;

    if (pX < cL + eT) container.scrollLeft -= sS;
    else if (pX > cL + cW - eT) container.scrollLeft += sS;

    const currentScrollLeft = container.scrollLeft;
    const scrollDiff = currentScrollLeft - startScrollLeftRef.current;
    const mouseDiff = pX - startXRef.current;
    const totalDeltaX = mouseDiff + scrollDiff;
    const deltaDays = Math.round(totalDeltaX / CELL_WIDTH);
    const startDuration = leave.durationDays;

    if (directionRef.current === "right") {
      setVisualDuration(Math.max(1, startDuration + deltaDays));
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
        let fDur = startDuration;
        let fS = 0;

        if (direction === "right")
          fDur = Math.max(1, startDuration + deltaDays);
        else {
          const mS = startDuration - 1;
          fS = Math.min(deltaDays, mS);
          fDur = startDuration - fS;
        }

        if (onResizeEnd && (fDur !== startDuration || fS !== 0)) {
          onResizeEnd(leave.id, fDur, fS);
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

  // --- MOUSE TRACKING FOR TOOLTIP ---
  const handleMouseMove = (event: React.MouseEvent) => {
    // 1. Update Position
    positionRef.current = { x: event.clientX, y: event.clientY };
    // 2. Force Popper Update
    if (popperRef.current != null) {
      popperRef.current.update();
    }
  };

  const handleMouseEnter = () => {
    if (isDragging || isResizing || isOverlay) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsTooltipOpen(true);
    onTooltipOpen?.();
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsTooltipOpen(false);
      onTooltipClose?.();
    }, 200);
  };

  // --- STYLES ---
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
    borderRadius: "30px",
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

  // --- TOOLTIP CONTENT ---
  const tooltipContent = (
    <Box
      sx={{ border: `2px solid ${leave.color}` }}
      onMouseEnter={() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      }}
      onMouseLeave={handleMouseLeave}
    >
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
        <Box
          sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          {/* DELETE */}
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(leave.id);
            }}
            sx={{
              border: "1px solid",
              borderColor: "rgba(211, 47, 47, 0.3)",
              "&:hover": {
                bgcolor: "error.main",
                color: "#fff",
              },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>

          {/* EDIT (PRIMARY) */}
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(leave.id);
            }}
            sx={{
              border: "1px solid",
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                bgcolor: "primary.main",
                color: "#fff",
              },
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  // --- RENDER BLOCK ---
  const blockContent = (
    <Paper
      ref={(el) => {
        setNodeRef(el);
        blockRef.current = el as HTMLDivElement;
      }}
      style={style}
      {...listeners}
      {...attributes}
      elevation={2}
      onPointerDown={(e) => {
        e.stopPropagation();
        listeners?.onPointerDown?.(e);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove} // Update Virtual Coordinates
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

  if (isOverlay || isDragging || isResizing) return blockContent;

  return (
    <>
      {/* 1. RENDER THE BLOCK */}
      {blockContent}

      {/* 2. RENDER THE VIRTUAL TOOLTIP */}
      <Tooltip
        title={tooltipContent}
        open={isTooltipOpen}
        arrow
        placement="top"
        slotProps={{
          popper: {
            popperRef: popperRef,
            anchorEl: {
              getBoundingClientRect: () => {
                // VIRTUAL ELEMENT LOGIC
                // X = Mouse Position (from positionRef)
                // Y = Top of the Block (from blockRef)
                const blockRect = blockRef.current?.getBoundingClientRect();
                return new DOMRect(
                  positionRef.current.x,
                  blockRect ? blockRect.top : positionRef.current.y,
                  0,
                  0
                );
              },
            },
          },

          // ✅ DYNAMIC ARROW COLOR
          arrow: {
            sx: { color: leave.color },
          },
        }}
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "white",
              color: "text.primary",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              p: 0,
              minWidth: 260,
              borderRadius: 2,
              border: "1px solid #eee",
              pointerEvents: "auto",
            },
          },
        }}
      >
        {/* Dummy child to satisfy Tooltip requirements */}
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      </Tooltip>
    </>
  );
};
