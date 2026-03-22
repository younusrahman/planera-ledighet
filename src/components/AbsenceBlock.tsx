import React, { useRef, useEffect, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import dayjs from "dayjs";
import { AbsenceStatus, type Absence } from "../types";
import {
  useAbsenceBlockIsResizing,
  useAbsenceBlockVisualDuration,
  useAbsenceBlockVisualStartShift,
  useAbsenceBlockIsTooltipOpen,
  useAbsenceBlockActions,
} from "../services/stores/absenceUIStore";
import { useCellWidth, useRowHeight } from "../services/stores/uiStore";

// --- UTILS ---
const alpha = (hex: string, opacity: number) => {
  if (!hex || hex === "transparent") return `rgba(0,0,0,${opacity})`;
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const Icon = {
  Edit: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Delete: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  ThumbUp: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  ),
  ThumbDown: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
    </svg>
  ),
  Lock: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="green"
      strokeWidth="2"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  User: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Calendar: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

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
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  employeeId?: string;
}

const AbsenceBlock = ({
  absenceDetails,
  left = 0,
  isOverlay = false,
  onResizeEnd,
  employeeName = "Namnet saknas",
  scrollContainerRef,
  onEdit,
  onDelete,
  onTooltipOpen,
  onTooltipClose,
  isDeletionDisabled = false,
  isPastDaysBlocked = true,
  absenceColor = "#3b82f6",
  onApprove,
  onReject,
  employeeId,
}: Props) => {
  const isPast =
    isPastDaysBlocked &&
    dayjs(absenceDetails.startDate).isBefore(dayjs().startOf("day"));
  const isLocked = absenceDetails.status === AbsenceStatus.Approved;
  const CELL_WIDTH = useCellWidth();
  const ROW_HEIGHT = useRowHeight();
  const TOOLTIP_DELAY_MS = 3000;
  const [countdown, setCountdown] = useState<number | null>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: absenceDetails.id,
    data: absenceDetails,
    disabled: isOverlay || isPast || isLocked,
  });

  const isResizing = useAbsenceBlockIsResizing(absenceDetails.id);
  const visualDuration = useAbsenceBlockVisualDuration(absenceDetails.id);
  const visualStartShift = useAbsenceBlockVisualStartShift(absenceDetails.id);
  const isTooltipOpen = useAbsenceBlockIsTooltipOpen(absenceDetails.id);
  const { setBlock, removeBlock } = useAbsenceBlockActions();

  // REFS
  const positionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  // RESIZE REFS
  const mouseXRef = useRef(0);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const isResizingRef = useRef(false);
  const directionRef = useRef<"left" | "right">("right");
  const requestRef = useRef<number>(0);

  const killAllTimers = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (countdownIntervalRef.current)
      window.clearInterval(countdownIntervalRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    timerRef.current = null;
    countdownIntervalRef.current = null;
    closeTimerRef.current = null;
    setCountdown(null);
  };

  const handleMouseEnter = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  };

  const handleMouseLeave = () => {
    killAllTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setBlock(absenceDetails.id, { isTooltipOpen: false });
      onTooltipClose?.();
    }, 300);
  };

  useEffect(() => {
    if (isDragging) {
      killAllTimers();
      setBlock(absenceDetails.id, { isTooltipOpen: false });
    }
  }, [isDragging, absenceDetails.id, setBlock]);

  useEffect(() => {
    setBlock(absenceDetails.id, {
      visualDuration: absenceDetails.durationDays,
      visualStartShift: 0,
      isResizing: false,
      isTooltipOpen: false,
    });
    return () => {
      killAllTimers();
      removeBlock(absenceDetails.id);
    };
  }, [absenceDetails.id, absenceDetails.durationDays, setBlock, removeBlock]);

  // --- RESIZE LOGIC ---
  const animateResize = () => {
    if (!isResizingRef.current || !scrollContainerRef?.current) return;
    const container = scrollContainerRef.current;
    const { left: cL, width: cW } = container.getBoundingClientRect();
    const pX = mouseXRef.current;
    if (pX < cL + 50) container.scrollLeft -= 15;
    else if (pX > cL + cW - 50) container.scrollLeft += 15;

    const scrollDiff = container.scrollLeft - startScrollLeftRef.current;
    const totalDeltaX = pX - startXRef.current + scrollDiff;
    const startDuration = absenceDetails.durationDays;

    if (directionRef.current === "right") {
      setBlock(absenceDetails.id, {
        visualDuration: Math.max(1, startDuration + totalDeltaX / CELL_WIDTH),
      });
    } else {
      const shiftDays = totalDeltaX / CELL_WIDTH;
      setBlock(absenceDetails.id, {
        visualStartShift: Math.min(shiftDays, startDuration - 1),
        visualDuration: Math.max(1, startDuration - shiftDays),
      });
    }
    requestRef.current = requestAnimationFrame(animateResize);
  };

  const initResize = (e: React.PointerEvent, direction: "left" | "right") => {
    if (isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    killAllTimers();
    setBlock(absenceDetails.id, { isTooltipOpen: false, isResizing: true });

    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    isResizingRef.current = true;
    directionRef.current = direction;
    startXRef.current = e.clientX;
    mouseXRef.current = e.clientX;
    if (scrollContainerRef?.current)
      startScrollLeftRef.current = scrollContainerRef.current.scrollLeft;

    const onPointerMove = (me: PointerEvent) => {
      mouseXRef.current = me.clientX;
    };
    const onPointerUp = (ue: PointerEvent) => {
      handle.releasePointerCapture(ue.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      isResizingRef.current = false;
      cancelAnimationFrame(requestRef.current);
      setBlock(absenceDetails.id, { isResizing: false });

      if (scrollContainerRef?.current) {
        const deltaDays = Math.round(
          (ue.clientX -
            startXRef.current +
            (scrollContainerRef.current.scrollLeft -
              startScrollLeftRef.current)) /
            CELL_WIDTH,
        );
        let fDur = absenceDetails.durationDays;
        let fS = 0;
        if (direction === "right") fDur = Math.max(1, fDur + deltaDays);
        else {
          fS = Math.min(deltaDays, fDur - 1);
          fDur -= fS;
        }
        if (onResizeEnd && (fDur !== absenceDetails.durationDays || fS !== 0))
          onResizeEnd(absenceDetails.id, fDur, fS);
      }
    };
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
    requestRef.current = requestAnimationFrame(animateResize);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    positionRef.current = { x: event.clientX, y: event.clientY };
    if (badgeRef.current) {
      badgeRef.current.style.transform = `translate3d(${event.clientX + 15}px, ${event.clientY - 15}px, 0)`;
    }

    if (isDragging || isResizing || isTooltipOpen || isOverlay) return;

    if (!timerRef.current) {
      timerRef.current = window.setTimeout(() => {
        setBlock(absenceDetails.id, { isTooltipOpen: true });
        setCountdown(null);
        onTooltipOpen?.();
      }, TOOLTIP_DELAY_MS);

      let secondsLeft = 3;
      setCountdown(secondsLeft);
      countdownIntervalRef.current = window.setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) setCountdown(secondsLeft);
        else {
          if (countdownIntervalRef.current)
            window.clearInterval(countdownIntervalRef.current);
          setCountdown(null);
        }
      }, 1000);
    }
  };

  const displayDuration = isResizing
    ? visualDuration
    : absenceDetails.durationDays;
  const currentWidth = displayDuration * CELL_WIDTH - 4;
  const displayLeft = isResizing ? left + visualStartShift * CELL_WIDTH : left;

  const commonStyles: React.CSSProperties = {
    position: "absolute",
    left: displayLeft,
    width: currentWidth,
    height: ROW_HEIGHT - 10,
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    boxSizing: "border-box",
  };

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={{
          ...commonStyles,
          border: `2px dashed ${alpha(absenceColor, 0.5)}`,
          backgroundColor: alpha(absenceColor, 0.05),
          color: alpha(absenceColor, 0.4),
          pointerEvents: "none",
        }}
      >
        {employeeName}
      </div>
    );
  }

  return (
    <>
      <div
        ref={(el) => setNodeRef(el)}
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          killAllTimers();
          setBlock(absenceDetails.id, { isTooltipOpen: false });
          e.stopPropagation();
          listeners?.onPointerDown?.(e);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        style={{
          ...commonStyles,
          backgroundColor: absenceColor,
          color: "white",
          zIndex: isResizing || isOverlay ? 1000 : 1,
          cursor: isLocked ? "default" : isPast ? "not-allowed" : "grab",
          boxShadow: `0 3px 6px ${alpha(absenceColor, 0.4)}`,
          touchAction: "none",
          userSelect: "none",
          opacity: isOverlay ? 0.9 : 1,
        }}
        className="absence-block-shiny"
      >
        {/* RESIZE HANDLES */}
        {!isPast && !isLocked && !isOverlay && (
          <>
            <div
              onPointerDown={(e) => initResize(e, "left")}
              style={{
                position: "absolute",
                left: 0,
                width: 15,
                height: "100%",
                cursor: "col-resize",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  margin: "auto",
                  marginTop: (ROW_HEIGHT - 10) / 2 - 2,
                }}
              />
            </div>
            <div
              onPointerDown={(e) => initResize(e, "right")}
              style={{
                position: "absolute",
                right: 0,
                width: 15,
                height: "100%",
                cursor: "col-resize",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.4)",
                  margin: "auto",
                  marginTop: (ROW_HEIGHT - 10) / 2 - 2,
                }}
              />
            </div>
          </>
        )}

        <span
          style={{
            pointerEvents: "none",
            padding: "0 10px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {employeeName}
        </span>
      </div>

      {countdown !== null && !isOverlay && (
        <div
          ref={badgeRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: 22,
            height: 22,
            backgroundColor: "#222",
            color: "white",
            borderRadius: "50%",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid white",
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            zIndex: 10001,
            pointerEvents: "none",
            willChange: "transform",
            transform: `translate3d(${positionRef.current.x + 15}px, ${positionRef.current.y - 15}px, 0)`,
          }}
        >
          {countdown}
        </div>
      )}

      {isTooltipOpen && !isDragging && !isResizing && (
        <div
          style={{
            position: "fixed",
            top: positionRef.current.y - 12,
            left: positionRef.current.x,
            transform: "translate(-50%, -100%)",
            backgroundColor: "white",
            border: `1px solid ${alpha(absenceColor, 0.4)}`,
            borderRadius: "10px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 9999,
            width: "240px",
            pointerEvents: "auto",
            animation: "tooltipIn 0.2s ease-out",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            style={{
              height: 6,
              backgroundColor: absenceColor,
              borderRadius: "10px 10px 0 0",
            }}
          />
          <div style={{ padding: "12px" }}>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                marginBottom: "4px",
                color: "#333",
              }}
            >
              {employeeName}
            </div>
            <div
              style={{ height: "1px", background: "#eee", margin: "8px 0" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "12px",
                color: "#555",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon.User /> {employeeId}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon.Calendar />{" "}
                {dayjs(absenceDetails.startDate).format("D MMM")} -{" "}
                {dayjs(absenceDetails.startDate)
                  .add(absenceDetails.durationDays - 1, "day")
                  .format("D MMM")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon.Clock /> {absenceDetails.durationDays} dagar
              </div>
            </div>
            <div
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              {absenceDetails.status !== AbsenceStatus.Approved ? (
                <>
                  <button
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      background: "white",
                      borderRadius: "6px",
                      color: "#10b981",
                      cursor: "pointer",
                    }}
                    onClick={() => onApprove?.(absenceDetails.id)}
                  >
                    <Icon.ThumbUp />
                  </button>
                  <button
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      background: "white",
                      borderRadius: "6px",
                      color: "#ef4444",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      const r = window.prompt("Orsak till avslag:");
                      if (r) onReject?.(absenceDetails.id, r);
                    }}
                  >
                    <Icon.ThumbDown />
                  </button>
                </>
              ) : (
                <Icon.Lock />
              )}
              {!isLocked && !isPast && (
                <>
                  <button
                    style={{
                      padding: "6px",
                      border: "1px solid #ddd",
                      background: "white",
                      borderRadius: "6px",
                      color: "#3b82f6",
                      cursor: "pointer",
                    }}
                    onClick={() => onEdit?.(absenceDetails.id)}
                  >
                    <Icon.Edit />
                  </button>
                  {!isDeletionDisabled && (
                    <button
                      style={{
                        padding: "6px",
                        border: "1px solid #ddd",
                        background: "white",
                        borderRadius: "6px",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                      onClick={() => onDelete?.(absenceDetails.id)}
                    >
                      <Icon.Delete />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tooltipIn { from { opacity: 0; transform: translate(-50%, -95%); } to { opacity: 1; transform: translate(-50%, -100%); } }
        .absence-block-shiny::before {
            content: ""; position: absolute; inset: 0; pointer-events: none; border-radius: inherit;
            background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.05) 100%);
        }
      `}</style>
    </>
  );
};

export default React.memo(AbsenceBlock);
