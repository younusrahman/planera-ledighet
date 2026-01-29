import React, { useRef, useEffect, useLayoutEffect } from "react";
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
import type { AbsenceDetails } from "../types";
import {
  useAbsenceBlockIsResizing,
  useAbsenceBlockVisualDuration,
  useAbsenceBlockVisualStartShift,
  useAbsenceBlockIsTooltipOpen,
  useAbsenceBlockActions,
} from "../services/AbsenceBlockStore";

interface Props {
  leave: AbsenceDetails;
  left?: number;
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
export const AbsenceBlock = ({
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
  isDeletionDisabled = false,
  isPastDaysBlocked = true,
}: Props) => {
  const isPast = isPastDaysBlocked && dayjs(leave.startDate).isBefore(today);
  const isFactuallyPast = dayjs(leave.startDate).isBefore(today);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: leave.id,
      data: leave,
      disabled: isOverlay || isPast,
    });

  // --- STATE FROM ZUSTAND ---
  const isResizing = useAbsenceBlockIsResizing(leave.id);
  const visualDuration = useAbsenceBlockVisualDuration(leave.id);
  const visualStartShift = useAbsenceBlockVisualStartShift(leave.id);
  const isTooltipOpen = useAbsenceBlockIsTooltipOpen(leave.id);
  const { setBlock, resetBlock, removeBlock } = useAbsenceBlockActions();

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

  // Initialize block state on mount
  useEffect(() => {
    setBlock(leave.id, {
      visualDuration: leave.durationDays,
      visualStartShift: 0,
      isResizing: false,
      isTooltipOpen: false,
    });
  }, []);

  // Track position changes during resize
  useLayoutEffect(() => {
    const jump = left - prevLeftRef.current;
    if (jump !== 0 && isResizingRef.current) {
      startScrollLeftRef.current += jump;
    }
    prevLeftRef.current = left;
  }, [left]);

  // Reset visual state when resizing ends or props change
  useEffect(() => {
    if (!isResizing) {
      resetBlock(leave.id, leave.durationDays);
    }
  }, [leave.durationDays, isResizing, leave.id, resetBlock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeBlock(leave.id);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [leave.id, removeBlock]);

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
    const startDuration = leave.durationDays;

    if (directionRef.current === "right") {
      const newVisualWidth = startDuration * CELL_WIDTH + totalDeltaX;
      const newVisualDuration = newVisualWidth / CELL_WIDTH;
      setBlock(leave.id, { visualDuration: Math.max(1, newVisualDuration) });
    } else {
      const newVisualWidth = startDuration * CELL_WIDTH - totalDeltaX;

      if (newVisualWidth < CELL_WIDTH) {
        setBlock(leave.id, {
          visualStartShift: startDuration - 1,
          visualDuration: 1,
        });
      } else {
        const actualShiftInPixels = totalDeltaX;
        const actualShiftInDays = actualShiftInPixels / CELL_WIDTH;
        setBlock(leave.id, {
          visualStartShift: actualShiftInDays,
          visualDuration: startDuration - actualShiftInDays,
        });
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  const initResize = (e: React.PointerEvent, direction: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    setBlock(leave.id, { isTooltipOpen: false });
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    setBlock(leave.id, { isResizing: true });
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
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = 0;
      }

      setBlock(leave.id, { isResizing: false });

      if (scrollContainerRef?.current) {
        const finalScrollLeft = scrollContainerRef.current.scrollLeft;
        const scrollDiff = finalScrollLeft - startScrollLeftRef.current;
        const mouseDiff = upEvent.clientX - startXRef.current;
        const totalDeltaX = mouseDiff + scrollDiff;
        const deltaDays = Math.round(totalDeltaX / CELL_WIDTH);
        const startDuration = leave.durationDays;
        let fDur = startDuration;
        let fS = 0;

        if (directionRef.current === "right") {
          fDur = Math.max(1, startDuration + deltaDays);
        } else {
          const mS = startDuration - 1;
          fS = Math.min(deltaDays, mS);
          fDur = startDuration - fS;
        }

        if (onResizeEnd && (fDur !== startDuration || fS !== 0)) {
          onResizeEnd(leave.id, fDur, fS);
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

  const handleMouseMove = (event: React.MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY };
    if (popperRef.current != null) {
      popperRef.current.update();
    }

    if (!isTooltipOpen) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = window.setTimeout(() => {
        setBlock(leave.id, { isTooltipOpen: true });
        onTooltipOpen?.();
      }, TOOLTIP_DELAY);
    }
  };

  const handleMouseEnter = () => {
    if (isDragging || isResizing || isOverlay) return;

    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    openTimeoutRef.current = window.setTimeout(() => {
      setBlock(leave.id, { isTooltipOpen: true });
      onTooltipOpen?.();
    }, TOOLTIP_DELAY);
  };
  const handleMouseLeave = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);

    closeTimeoutRef.current = window.setTimeout(() => {
      setBlock(leave.id, { isTooltipOpen: false });
      onTooltipClose?.();
    }, 300);
  };

  // --- STYLES ---
  const displayDuration = isResizing ? visualDuration : leave.durationDays;
  const currentWidth = displayDuration * CELL_WIDTH - 4;
  const displayLeft = isResizing ? left + visualStartShift * CELL_WIDTH : left;
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
      onMouseMove={handleMouseMove}
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
      {blockContent}

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
                  offset: [0, 18],
                },
              },
            ],
          },
          arrow: {
            sx: {
              color: leave.color,
              fontSize: 12,
              "&:before": {
                border: "1px solid",
                borderColor: "rgba(0,0,0,0.05)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              },
            },
          },
        }}
        componentsProps={{
          tooltip: {
            sx: {
              background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
              color: "#2d3748",
              boxShadow: `
          0px 10px 30px rgba(0, 0, 0, 0.08),
          0px 1px 3px rgba(0, 0, 0, 0.03)
        `,
              p: "16px 20px",
              minWidth: 180,
              maxWidth: 320,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: `${leave.color}70`,
              pointerEvents: "auto",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              fontWeight: 400,
              letterSpacing: "0.01em",
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
              "&:hover": {
                boxShadow: `
            0px 12px 35px rgba(0, 0, 0, 0.1),
            0px 2px 5px rgba(0, 0, 0, 0.04)
          `,
              },
              "& .MuiTooltip-tooltip": {
                margin: 0,
              },
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


