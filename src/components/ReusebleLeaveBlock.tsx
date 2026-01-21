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
import { CELL_WIDTH, ROW_HEIGHT } from "../utils";
import PersonIcon from "@mui/icons-material/Person";
import type { LeaveItem } from "../types";

interface Props {
  leave: LeaveItem;
  left: number;
  cellWidth: number; // <--- ADD THIS PROP
  isOverlay?: boolean;
  onResizeEnd?: (id: string, newDuration: number, daysShifted: number) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onTooltipOpen?: () => void;
  onTooltipClose?: () => void;
  isDeletionDisabled?: boolean;
  isPastDaysBlocked?: boolean;
  resourceName?: string;
}

const today = dayjs().startOf("day");
const TOOLTIP_DELAY = 500;
export const LeaveBlock = ({
  leave,
  left = 0,
  isOverlay = false,
  onResizeEnd,
  resourceName = "Namnet saknas ",
  scrollContainerRef,
  onEdit,
  onDelete,
  onTooltipOpen,
  onTooltipClose,
  isDeletionDisabled = false, // <-- ADD THIS
  isPastDaysBlocked = true, // <-- ADD THIS¨
  cellWidth,
}: Props) => {
  const isPast = isPastDaysBlocked && dayjs(leave.startDate).isBefore(today);
  const isFactuallyPast = dayjs(leave.startDate).isBefore(today);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: leave.id,
      data: leave,
      disabled: isOverlay || isPast,
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
  const openTimeoutRef = useRef<number>(0);
  // --- RESIZE REFS ---
  const mouseXRef = useRef(0);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const isResizingRef = useRef(false);
  const directionRef = useRef<"left" | "right">("right");
  const requestRef = useRef<number>(0);
  const prevLeftRef = useRef(left);

  useEffect(() => {
    if (!isResizing) {
      setVisualDuration(leave.durationDays);
      setVisualStartShift(0);
    }
  }, [leave.durationDays, isResizing]);
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

    // 1. Auto-scroll logic if mouse is near edges
    const edgeThreshold = 50;
    const scrollSpeed = 15;
    if (pX < cL + edgeThreshold) {
      container.scrollLeft -= scrollSpeed;
    } else if (pX > cL + cW - edgeThreshold) {
      container.scrollLeft += scrollSpeed;
    }

    // 2. Calculate pixel movement
    const currentScrollLeft = container.scrollLeft;
    const scrollDiff = currentScrollLeft - startScrollLeftRef.current;
    const mouseDiff = pX - startXRef.current;
    const totalDeltaX = mouseDiff + scrollDiff;

    // 3. Update Visual State using the dynamic cellWidth prop
    if (directionRef.current === "right") {
      // Calculate new duration in days based on pixel movement
      const newVisualWidth = leave.durationDays * cellWidth + totalDeltaX;
      const newVisualDuration = newVisualWidth / cellWidth;

      setVisualDuration(Math.max(1, newVisualDuration));
      setVisualStartShift(0);
    } else {
      // Calculate how many days we are shifting the start to the left/right
      const actualShiftInDays = totalDeltaX / cellWidth;

      // Prevent resizing to less than 1 day
      const maxShift = leave.durationDays - 1;
      const safeShift = Math.min(actualShiftInDays, maxShift);

      setVisualStartShift(safeShift);
      setVisualDuration(Math.max(1, leave.durationDays - safeShift));
    }

    // 4. Continue animation loop
    requestRef.current = requestAnimationFrame(animate);
  };

  const initResize = (e: React.PointerEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    setIsTooltipOpen(false);
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
      mouseXRef.current = moveEvent.clientX; // The animate loop will handle the rest
    };
    const onPointerUp = (upEvent: PointerEvent) => {
      // 1. Cleanup
      handle.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);

      isResizingRef.current = false;
      setIsResizing(false);

      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
      }

      // 2. Calculate Final Data
      if (scrollContainerRef?.current && onResizeEnd) {
        const finalScrollLeft = scrollContainerRef.current.scrollLeft;
        const scrollDiff = finalScrollLeft - startScrollLeftRef.current;
        const mouseDiff = upEvent.clientX - startXRef.current;
        const totalDeltaX = mouseDiff + scrollDiff;

        // Convert pixels to whole days using the dynamic cellWidth
        const deltaDays = Math.round(totalDeltaX / cellWidth);

        let finalDuration = leave.durationDays;
        let finalStartShift = 0;

        if (directionRef.current === "right") {
          // Right side: change duration only
          finalDuration = Math.max(1, leave.durationDays + deltaDays);
          finalStartShift = 0;
        } else {
          // Left side: change duration AND shift start date
          // Clamp shift so duration doesn't go below 1
          const maxShift = leave.durationDays - 1;
          finalStartShift = Math.min(deltaDays, maxShift);
          finalDuration = Math.max(1, leave.durationDays - finalStartShift);
        }

        // 3. Trigger Parent Update (which calls the API)
        if (finalDuration !== leave.durationDays || finalStartShift !== 0) {
          onResizeEnd(leave.id, finalDuration, finalStartShift);
        }
      }
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
    // Update Position
    positionRef.current = { x: event.clientX, y: event.clientY };
    if (popperRef.current != null) {
      popperRef.current.update();
    }

    // ONLY start the open timer if the tooltip isn't already open
    if (!isTooltipOpen) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = window.setTimeout(() => {
        setIsTooltipOpen(true);
        onTooltipOpen?.();
      }, TOOLTIP_DELAY);
    }
  };

  const handleMouseEnter = () => {
    if (isDragging || isResizing || isOverlay) return;

    // Clear any lingering close timers
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    // Start the timer to open the tooltip. This timer will be reset if the mouse moves.
    openTimeoutRef.current = window.setTimeout(() => {
      setIsTooltipOpen(true);
      onTooltipOpen?.();
    }, TOOLTIP_DELAY); // 2000 milliseconds = 2 seconds
  };
  const handleMouseLeave = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);

    // Give user 300ms to move mouse into the tooltip window
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsTooltipOpen(false);
      onTooltipClose?.();
    }, 300);
  };

  // --- STYLES ---
  const displayDuration = isResizing ? visualDuration : leave.durationDays;
  const currentWidth = displayDuration * cellWidth - 4; // Use prop
  const displayLeft = isResizing ? left + visualStartShift * cellWidth : left; // Use prop
  const blockHeight = ROW_HEIGHT - 10;

  const style: React.CSSProperties = {
    position: isOverlay ? "relative" : "absolute",
    left: isOverlay ? 0 : `${displayLeft}px`,

    width: `${currentWidth}px`,
    height: `${blockHeight}px`,
    backgroundColor: leave.color,
    color: "white",
    padding: "4px 8px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    zIndex: isOverlay ? 999 : isResizing ? 1000 : transform ? 100 : 1,
    cursor: isPast ? "not-allowed" : isOverlay ? "grabbing" : "grab",
    opacity: !isOverlay && isDragging ? 0 : 1,
    boxShadow: isResizing ? "0 8px 16px rgba(0,0,0,0.2)" : "none",
    touchAction: "none", // <--- ADD THIS LINE
    userSelect: "none", // <--- ALSO ADD THIS TO PREVENT TEXT SELECTION
  };

  const handleStyle = {
    position: "absolute" as const,
    top: 0,
    bottom: 0,
    width: "20px",
    zIndex: 10,
    borderRadius: "30px",
    cursor: "col-resize",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" },
  };
  const handleBar = (
    <Box
      sx={{
        width: "10px",
        height: "10px",
        bgcolor: "rgba(255,255,255,0.5)",
        borderRadius: "50%",
      }}
    />
  );

  // --- TOOLTIP CONTENT ---
  const tooltipContent = (
    <Box
      onMouseEnter={() => {
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      }}
      onMouseLeave={handleMouseLeave}
    >
      <Box sx={{ bgcolor: leave.color, height: 6, width: "100%", mb: 1 }} />
      <Box>
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
            <PersonIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontSize: "0.85rem" }}>
              {resourceName}
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
        {isFactuallyPast && (
          <Typography
            color="warning"
            variant="h4"
            sx={{
              fontSize: "0.85rem",
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            Den valda perioden har redan påbörjats eller passerat.
          </Typography>
        )}
        <Box
          sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          {/* DELETE */}
          {!isPast && (
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
                "&:hover": { bgcolor: "primary.main", color: "#fff" },
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          )}
          {!(isPast && isDeletionDisabled) && (
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
                "&:hover": { bgcolor: "error.main", color: "#fff" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          )}
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
      {!isDragging && !isPast && (
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
      {!isDragging && !isPast && (
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
                const blockRect = blockRef.current?.getBoundingClientRect();
                return new DOMRect(
                  positionRef.current.x,
                  blockRect ? blockRect.top : positionRef.current.y,
                  0,
                  0,
                );
              },
            },
            modifiers: [
              {
                name: "offset",
                options: {
                  offset: [0, 18], // Adds 8px spacing between element and tooltip
                },
              },
            ],
          },
          arrow: {
            sx: {
              color: leave.color, // Matches tooltip background for seamless look
              fontSize: 12, // Makes arrow slightly smaller and more elegant
              "&:before": {
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.05)", // Adds subtle border to arrow
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              },
            },
          },
        }}
        componentsProps={{
          tooltip: {
            sx: {
              // Modern gradient background instead of plain white
              background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
              color: "#2d3748",

              // Cleaner shadow with depth
              boxShadow: `
          0px 10px 30px rgba(0, 0, 0, 0.08),
          0px 1px 3px rgba(0, 0, 0, 0.03)
        `,

              // Better spacing
              p: "16px 20px",
              minWidth: 180,
              maxWidth: 320,

              // Crisp borders
              borderRadius: "10px",
              border: "1px solid",
              borderColor: `${leave.color}70`, // 20% opacity border using leave color

              pointerEvents: "auto",

              // Elegant typography
              fontSize: "0.875rem",
              lineHeight: 1.6,
              fontWeight: 400,
              letterSpacing: "0.01em",

              // Smooth animation
              animation: "tooltipAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              "@keyframes tooltipAppear": {
                "0%": {
                  opacity: 0,
                  transform: "translateY(-4px) scale(0.98)",
                },
                "100%": {
                  opacity: 1,
                  transform: "translateY(0) scale(1)",
                },
              },

              // Subtle hover effect on tooltip
              "&:hover": {
                boxShadow: `
            0px 12px 35px rgba(0, 0, 0, 0.1),
            0px 2px 5px rgba(0, 0, 0, 0.04)
          `,
              },

              // For content inside
              "& .MuiTooltip-tooltip": {
                margin: 0,
              },

              // Subtle top highlight for depth
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                borderRadius: "10px 10px 0 0",
              },
            },
          },
        }}
      >
        {/* Dummy child */}
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
