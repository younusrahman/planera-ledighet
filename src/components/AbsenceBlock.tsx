import React, { useRef, useEffect, useLayoutEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Divider,
  Tooltip,
  alpha,
} from "@mui/material";
import EditSquareIcon from "@mui/icons-material/EditSquare";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DateRangeIcon from "@mui/icons-material/DateRange";
import dayjs from "dayjs";
import type { Instance } from "@popperjs/core";
import { CELL_WIDTH, ROW_HEIGHT } from "../utils";
import PersonIcon from "@mui/icons-material/Person";
import { AbsenceStatus, type Absence } from "../types";
import {
  useAbsenceBlockIsResizing,
  useAbsenceBlockVisualDuration,
  useAbsenceBlockVisualStartShift,
  useAbsenceBlockIsTooltipOpen,
  useAbsenceBlockActions,
} from "../services/stores/absenceUIStore";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";

interface Props {
  absenceDetails: Absence;
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
  employeeName?: string;
  absenceColor?: string;
  status?: AbsenceStatus;
  rejectionReason?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  // NEW: Callback when drag starts to hide original
  onDragStart?: () => void;
}

const today = dayjs().startOf("day");
const TOOLTIP_DELAY = 500;

export const AbsenceBlock = ({
  absenceDetails,
  left = 0,
  isOverlay = false,
  onResizeEnd,
  employeeName = "Namnet saknas ",
  scrollContainerRef,
  onEdit,
  onDelete,
  onTooltipOpen,
  onTooltipClose,
  isDeletionDisabled = false,
  isPastDaysBlocked = true,
  absenceColor = "transparent",
  onApprove,
  onReject,
  onDragStart,
}: Props) => {
  const isPast =
    isPastDaysBlocked && dayjs(absenceDetails.startDate).isBefore(today);
  const currentStatus = absenceDetails.status;
  const isLocked = currentStatus === AbsenceStatus.Approved;

  // NEW: Track if we should show placeholder (drag started but overlay not ready yet)
  const [isPreDrag, setIsPreDrag] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: absenceDetails.id,
      data: absenceDetails,
      disabled: isOverlay || isPast || isLocked,
    });

  // --- STATE FROM ZUSTAND ---
  const isResizing = useAbsenceBlockIsResizing(absenceDetails.id);
  const visualDuration = useAbsenceBlockVisualDuration(absenceDetails.id);
  const visualStartShift = useAbsenceBlockVisualStartShift(absenceDetails.id);
  const isTooltipOpen = useAbsenceBlockIsTooltipOpen(absenceDetails.id);
  const { setBlock, resetBlock, removeBlock } = useAbsenceBlockActions();

  // --- REFS ---
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const popperRef = useRef<Instance | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number>(0);
  const openTimeoutRef = useRef<number>(0);
  const mouseXRef = useRef(0);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const isResizingRef = useRef(false);
  const directionRef = useRef<"left" | "right">("right");
  const requestRef = useRef<number>(0);
  const prevLeftRef = useRef(left);

  // Trigger immediate hide when drag starts
  useEffect(() => {
    if (isDragging && !isOverlay) {
      // Force close tooltip
      setBlock(absenceDetails.id, { isTooltipOpen: false });
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      onTooltipClose?.();
    }
  }, [isDragging, isOverlay, absenceDetails.id, setBlock, onTooltipClose]);

  // Initialize block state
  useEffect(() => {
    setBlock(absenceDetails.id, {
      visualDuration: absenceDetails.durationDays,
      visualStartShift: 0,
      isResizing: false,
      isTooltipOpen: false,
    });
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      // Force tooltip to update position when container scrolls
      if (popperRef.current && blockRef.current) {
        popperRef.current.update();
      }
    };

    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    const jump = left - prevLeftRef.current;
    if (jump !== 0 && isResizingRef.current) {
      startScrollLeftRef.current += jump;
    }
    prevLeftRef.current = left;
  }, [left]);

  useEffect(() => {
    if (!isResizing) {
      resetBlock(absenceDetails.id, absenceDetails.durationDays);
    }
  }, [absenceDetails.durationDays, isResizing, absenceDetails.id, resetBlock]);

  useEffect(() => {
    return () => {
      removeBlock(absenceDetails.id);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [absenceDetails.id, removeBlock]);

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
    const startDuration = absenceDetails.durationDays;

    if (directionRef.current === "right") {
      const newVisualWidth = startDuration * CELL_WIDTH + totalDeltaX;
      const newVisualDuration = newVisualWidth / CELL_WIDTH;
      setBlock(absenceDetails.id, {
        visualDuration: Math.max(1, newVisualDuration),
      });
    } else {
      const newVisualWidth = startDuration * CELL_WIDTH - totalDeltaX;
      if (newVisualWidth < CELL_WIDTH) {
        setBlock(absenceDetails.id, {
          visualStartShift: startDuration - 1,
          visualDuration: 1,
        });
      } else {
        const actualShiftInPixels = totalDeltaX;
        const actualShiftInDays = actualShiftInPixels / CELL_WIDTH;
        setBlock(absenceDetails.id, {
          visualStartShift: actualShiftInDays,
          visualDuration: startDuration - actualShiftInDays,
        });
      }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  const initResize = (e: React.PointerEvent, direction: "left" | "right") => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    setBlock(absenceDetails.id, { isTooltipOpen: false });
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    setBlock(absenceDetails.id, { isResizing: true });
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

      setBlock(absenceDetails.id, { isResizing: false });

      if (scrollContainerRef?.current) {
        const finalScrollLeft = scrollContainerRef.current.scrollLeft;
        const scrollDiff = finalScrollLeft - startScrollLeftRef.current;
        const mouseDiff = upEvent.clientX - startXRef.current;
        const totalDeltaX = mouseDiff + scrollDiff;
        const deltaDays = Math.round(totalDeltaX / CELL_WIDTH);
        const startDuration = absenceDetails.durationDays;
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
          onResizeEnd(absenceDetails.id, fDur, fS);
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
    // Update position ref immediately
    positionRef.current = { x: event.clientX, y: event.clientY };

    // Update popper position in real-time
    if (popperRef.current) {
      popperRef.current.update();
    }

    if (!isTooltipOpen && !isDragging) {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = window.setTimeout(() => {
        setBlock(absenceDetails.id, { isTooltipOpen: true });
        onTooltipOpen?.();
      }, TOOLTIP_DELAY);
    }
  };

  const handleMouseEnter = () => {
    // Don't show tooltip if dragging or just finished dragging
    if (isDragging || isResizing || isOverlay) return;

    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    openTimeoutRef.current = window.setTimeout(() => {
      setBlock(absenceDetails.id, { isTooltipOpen: true });
      onTooltipOpen?.();
    }, TOOLTIP_DELAY);
  };
  const handleMouseLeave = () => {
    if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);

    closeTimeoutRef.current = window.setTimeout(() => {
      setBlock(absenceDetails.id, { isTooltipOpen: false });
      onTooltipClose?.();
    }, 300);
  };

  const isApproved = absenceDetails.status === AbsenceStatus.Approved;

  // --- STYLES ---
  const displayDuration = isResizing
    ? visualDuration
    : absenceDetails.durationDays;
  const currentWidth = displayDuration * CELL_WIDTH - 4;
  const displayLeft = isResizing ? left + visualStartShift * CELL_WIDTH : left;
  const blockHeight = ROW_HEIGHT - 10;

  // HIDE COMPLETELY when dragging (DragOverlay takes over)
  if ((isDragging || isPreDrag) && !isOverlay) {
    return (
      <Box
        sx={{
          position: "absolute",
          left: `${displayLeft}px`,
          width: `${currentWidth}px`,
          height: `${blockHeight}px`,
          border: `2px dashed ${alpha(absenceColor, 0.5)}`,
          borderRadius: "30px",
          bgcolor: alpha(absenceColor, 0.1),
          pointerEvents: "none",
        }}
      />
    );
  }

  const shinyVariables = {
    "--clr": absenceColor,
    "--text": isApproved ? "rgba(255, 255, 255, 0.7)" : "white",
    "--gradoffset": "45%",
    "--gradgap": "30%",
  };

  const style: React.CSSProperties = {
    position: "absolute",
    left: `${displayLeft}px`,
    width: `${currentWidth}px`,
    height: `${blockHeight}px`,
    backgroundColor: absenceColor,
    backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0.2) var(--gradgap), transparent calc(100% - var(--gradgap)))`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center var(--gradoffset)",
    backgroundSize: "100% 200%",
    boxShadow: `0 0.25em 0.3em -0.2em ${alpha(absenceColor, 0.46)}, 0 0.25em 0.75em ${alpha(absenceColor, 0.3)}`,
    border: "none",
    opacity: currentStatus === AbsenceStatus.Pending ? 1 : 0.7,
    color: "var(--text)",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    zIndex: isResizing ? 1000 : 1,
    cursor: isLocked ? "default" : isPast ? "not-allowed" : "grab",
    transition: "background-color 0.2s, border 0.2s",
    overflow: "hidden",
    ...(shinyVariables as React.CSSProperties),
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
    "&:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
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
      <Box sx={{ bgcolor: absenceColor, height: 6, width: "100%", mb: 1 }} />
      <Box sx={{ p: 0.5 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1, fontSize: "0.95rem" }}
        >
          {employeeName}
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
              {employeeName}
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
              {dayjs(absenceDetails.startDate).format("D MMM")} -{" "}
              {dayjs(absenceDetails.startDate)
                .add(absenceDetails.durationDays - 1, "day")
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
              {absenceDetails.durationDays} dagar
            </Typography>
          </Box>
        </Box>

        {absenceDetails.status === AbsenceStatus.Rejected && (
          <Box
            sx={{
              mt: 2,
              p: 1,
              bgcolor: "rgba(244, 67, 54, 0.08)",
              borderRadius: 1,
              borderLeft: "3px solid #f44336",
            }}
          >
            <Typography
              color="error"
              variant="caption"
              sx={{ fontWeight: "bold", display: "block", textAlign: "center" }}
            >
              Avvisad
            </Typography>
            <Typography variant="caption" sx={{ fontStyle: "italic" }}>
              {absenceDetails.rejectionReason || "Ingen kommentar"}
            </Typography>
          </Box>
        )}

        {absenceDetails.status === AbsenceStatus.Approved && (
          <Typography
            color="success.main"
            variant="caption"
            sx={{
              mt: 2,
              display: "block",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            ✓ Godkänd
          </Typography>
        )}

        {absenceDetails.status !== AbsenceStatus.Approved &&
          absenceDetails.status !== AbsenceStatus.Rejected && (
            <Typography
              color="warning.main"
              variant="caption"
              sx={{ textAlign: "center", display: "block", mt: 2 }}
            >
              Väntar på beslut
            </Typography>
          )}

        <Box
          sx={{
            mt: 2,
            pt: 1.5,
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          {absenceDetails.status !== AbsenceStatus.Approved ? (
            <>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove?.(absenceDetails.id);
                }}
                title="Godkänn"
                sx={{
                  width: 28,
                  height: 28,
                  p: 2,
                  color: "success.main",
                  border: "1px solid",
                  borderColor: "success.light",
                  "&:hover": { bgcolor: "success.main", color: "white" },
                }}
              >
                <ThumbUpIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  const reason = window.prompt("Ange anledning till avslag:");
                  if (reason) onReject?.(absenceDetails.id, reason);
                }}
                title="Neka"
                sx={{
                  width: 28,
                  height: 28,
                  p: 2,
                  color: "error.main",
                  border: "1px solid",
                  borderColor: "error.light",
                  "&:hover": { bgcolor: "error.main", color: "white" },
                }}
              >
                <ThumbDownIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <LockIcon color="action" sx={{ fontSize: 20, color: "green" }} />
          )}

          {absenceDetails.status !== AbsenceStatus.Approved && !isPast && (
            <>
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(absenceDetails.id);
                }}
                title="Redigera"
                sx={{
                  width: 28,
                  height: 28,
                  p: 2,
                  border: "1px solid",
                  borderColor: "primary.light",
                  "&:hover": { bgcolor: "primary.main", color: "white" },
                }}
              >
                <EditSquareIcon sx={{ fontSize: 18 }} />
              </IconButton>
              {!isDeletionDisabled && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(absenceDetails.id);
                  }}
                  title="Radera"
                  sx={{
                    width: 28,
                    height: 28,
                    p: 2,
                    border: "1px solid",
                    borderColor: "rgb(211, 47, 47)",
                    "&:hover": { bgcolor: "error.main", color: "white" },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 18 }} />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );

  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    blockRef.current = el;
  };

  const blockContent = (
    <Paper
      ref={setRefs}
      style={style}
      {...attributes}
      {...listeners}
      elevation={0}
      onPointerDown={(e) => {
        if (!(e.target as HTMLElement).closest('[data-resize-handle="true"]')) {
          e.stopPropagation();
          listeners?.onPointerDown?.(e);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      sx={{
        "&::before": {
          content: '""',
          inset: 0,
          position: "absolute",
          borderRadius: "inherit",
          pointerEvents: "none",
          backgroundImage: `radial-gradient(ellipse, rgba(255,255,255,0.5) 20%, transparent 50%, transparent 200%), 
                            linear-gradient(90deg, rgba(0,0,0,0.1) -10%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 110%)`,
          boxShadow: `inset 0 0.25em 0.75em rgba(0, 0, 0, 0.3), 
                      inset 0 -0.05em 0.2em rgba(255, 255, 255, 0.2)`,
          backgroundBlendMode: "overlay",
          backgroundRepeat: "no-repeat",
          backgroundSize: "200% 80%, cover",
          backgroundPosition: "center 220%",
          mixBlendMode: "overlay",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          pointerEvents: "none",
          borderRadius: "inherit",
          background: `linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1) 40%, transparent 80%)`,
          top: "0.075em",
          left: "0.75em",
          right: "0.75em",
          bottom: "1.4em",
          mixBlendMode: "screen",
          filter: "blur(1px)",
        },
        "&:hover": {
          backgroundPosition: "center calc(var(--gradoffset) - 0.75em)",
          boxShadow: `0 -0.2em 0.5em ${alpha(absenceColor, 0.3)}, 
                      0 0.25em 0.5em ${alpha(absenceColor, 0.25)}, 
                      inset 0 -2px 2px rgba(255, 255, 255, 0.2)`,
        },
        "&:active": {
          scale: "0.98",
          transition: "all 0.2s ease",
        },
      }}
    >
      {!isPast && !isLocked && (
        <>
          <Box
            data-resize-handle="true"
            onPointerDown={(e) => initResize(e, "left")}
            sx={{ ...handleStyle, left: 0 }}
          >
            {handleBar}
          </Box>
          <Box
            data-resize-handle="true"
            onPointerDown={(e) => initResize(e, "right")}
            sx={{ ...handleStyle, right: 0 }}
          >
            {handleBar}
          </Box>
        </>
      )}
      <Typography
        variant="caption"
        noWrap
        fontWeight="bold"
        sx={{
          flex: 1,
          textAlign: "center",
          zIndex: 2,
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          px: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {employeeName}
      </Typography>
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
            modifiers: [{ name: "offset", options: { offset: [0, 18] } }],
          },
          arrow: {
            sx: {
              color: absenceColor,
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
              boxShadow: `0px 10px 30px rgba(0, 0, 0, 0.08), 0px 1px 3px rgba(0, 0, 0, 0.03)`,
              p: "16px 20px",
              minWidth: 180,
              maxWidth: 320,
              borderRadius: "10px",
              border: "1px solid",
              borderColor: `${absenceColor}70`,
              pointerEvents: "auto",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              fontWeight: 400,
              letterSpacing: "0.01em",
              animation: "tooltipAppear 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              "@keyframes tooltipAppear": {
                "0%": { opacity: 0, transform: "translateY(-4px) scale(0.98)" },
                "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
              },
              "&:hover": {
                boxShadow: `0px 12px 35px rgba(0, 0, 0, 0.1), 0px 2px 5px rgba(0, 0, 0, 0.04)`,
              },
              "& .MuiTooltip-tooltip": { margin: 0 },
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
