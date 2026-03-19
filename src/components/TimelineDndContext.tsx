import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import dayjs, { Dayjs } from "dayjs";
import { CELL_WIDTH, ROW_HEIGHT } from "../utils";
import { getDateOffset } from "../utils/Helper";

import { PastDaysOverlay } from "./PastDaysOverlay";
import type { Absence, TeamWithEmployees } from "../types";
import { getSwedishHolidays } from "../utils/holidayHelper";
import AbsenceBlock from "./AbsenceBlock";

// --- HELPERS (Replacing MUI alpha/icons) ---
const rgba = (hex: string, opacity: number) => {
  if (!hex || hex === "transparent") return `rgba(0,0,0,${opacity})`;
  const r = parseInt(
    hex.slice(1, 3).length === 2
      ? hex.slice(1, 3)
      : hex.slice(1, 2) + hex.slice(1, 2),
    16,
  );
  const g = parseInt(
    hex.slice(3, 5).length === 2
      ? hex.slice(3, 5)
      : hex.slice(2, 3) + hex.slice(2, 3),
    16,
  );
  const b = parseInt(
    hex.slice(5, 7).length === 2
      ? hex.slice(5, 7)
      : hex.slice(3, 4) + hex.slice(3, 4),
    16,
  );
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const ArrowRightSvg = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z" />
  </svg>
);

interface TimelineDndContextProps {
  days: Dayjs[];
  daysCount: number;
  startDate: Dayjs;
  teams: TeamWithEmployees[];
  absences: Absence[];
  collapsedTeams: string[];
  absenceTypes: any[];
  activeAbsenceBlock: Absence | null;
  blockPastDays: boolean;
  disabledOverlayWidth: number;
  disableDeletion: boolean;
  selection: { isSelecting: boolean; rowId: string | null; startX: number };
  selectionBoxRef: React.RefObject<HTMLDivElement>;
  onTeamMouseDown: (e: React.MouseEvent) => void;
  onTeamMouseMove: (e: React.MouseEvent) => void;
  onTeamMouseUp: () => void;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onGridPointerDown: (e: React.PointerEvent, rowId: string) => void;
  onGridPointerMove: (e: React.PointerEvent) => void;
  onGridPointerUp: (e: React.PointerEvent) => void;
  onAbsenceBlockEdit: (id: string) => void;
  onAbsenceBlockDelete: (id: string) => void;
  onAbsenceBlockResizeEnd: (
    id: string,
    newDuration: number,
    daysShifted: number,
  ) => void;
  onTooltipOpen: () => void;
  onTooltipClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
}

export const TimelineDndContext = forwardRef<
  HTMLDivElement,
  TimelineDndContextProps
>((props, ref) => {
  const {
    days,
    daysCount,
    startDate,
    teams,
    absences,
    collapsedTeams,
    absenceTypes,
    activeAbsenceBlock,
    blockPastDays,
    disabledOverlayWidth,
    disableDeletion,
    selection,
    selectionBoxRef,
    onScroll,
    onDragStart,
    onDragEnd,
    onGridPointerDown,
    onGridPointerMove,
    onGridPointerUp,
    onAbsenceBlockEdit,
    onAbsenceBlockDelete,
    onAbsenceBlockResizeEnd,
    onTooltipOpen,
    onTooltipClose,
    onTeamMouseDown,
    onTeamMouseMove,
    onTeamMouseUp,
    onApprove,
    onReject,
  } = props;

  const holidays = useMemo(() => {
    const years = Array.from(new Set(days.map((d) => d.year())));
    let allHolidays: Record<string, any> = {};
    years.forEach((y) => {
      allHolidays = { ...allHolidays, ...getSwedishHolidays(y) };
    });
    return allHolidays;
  }, [days]);

  const isRedDay = (day: Dayjs) => {
    const dateStr = day.format("YYYY-MM-DD");
    return day.day() === 0 || day.day() === 6 || holidays[dateStr]?.isRedDay;
  };

  const [isDragging, setIsDragging] = useState(false);
  const scrollIntervalRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setIsDragging(true);
      onDragStart?.(event);
    },
    [onDragStart],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setIsDragging(false);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      // FIX: We pass the native event directly.
      // dnd-kit usually accounts for scroll if DndContext is inside the scroller.
      onDragEnd?.(event);
    },
    [onDragEnd],
  );

  useEffect(() => {
    if (!isDragging || !ref) return;
    const container = (ref as React.RefObject<HTMLDivElement>).current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    scrollIntervalRef.current = window.setInterval(() => {
      const rect = container.getBoundingClientRect();
      const mouseX = mousePosRef.current.x;
      const edgeThreshold = 80;
      const scrollSpeed = 15;

      if (mouseX < rect.left + edgeThreshold) {
        container.scrollLeft -= scrollSpeed;
      } else if (mouseX > rect.right - edgeThreshold) {
        container.scrollLeft += scrollSpeed;
      }
    }, 16);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [isDragging, ref]);

  const visibleAbsences = useMemo(() => {
    const timelineEndDate = startDate.add(daysCount, "day");
    return absences.filter((l) => {
      const leaveStart = dayjs(l.startDate);
      const leaveEnd = leaveStart.add(l.durationDays, "day");
      return (
        leaveStart.isBefore(timelineEndDate) && leaveEnd.isAfter(startDate)
      );
    });
  }, [absences, startDate, daysCount]);

  const showWatermark =
    !teams || teams.length === 0 || !absenceTypes || absenceTypes.length === 0;

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        position: "relative",
        overflowX: "auto",
      }}
    >
      <div
        style={{
          width: daysCount * CELL_WIDTH,
          minHeight: "100%",
          position: "relative",
        }}
      >
        {showWatermark ? (
          <div
            style={{
              position: "absolute",
              top: -200,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
              pointerEvents: "none",
              background: `linear-gradient(180deg, transparent 0%, rgba(255,255,255, 0.7) 30%, rgba(255,255,255, 0.9) 100%)`,
            }}
          >
            <div
              style={{
                textAlign: "center",
                maxWidth: "600px",
                padding: "32px",
                width: "90%",
              }}
            >
              <div style={{ opacity: 0.3, fontSize: "3.5rem" }}>📋</div>
              <h4
                style={{
                  color: "rgba(0,0,0,0.3)",
                  fontWeight: 700,
                  fontSize: "1.23rem",
                  marginBottom: "16px",
                }}
              >
                Börja med att skapa frånvarotyper, grupper och anställda.
              </h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "32px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: rgba("#1976d2", 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${rgba("#1976d2", 0.2)}`,
                      color: rgba("#1976d2", 0.5),
                      fontWeight: 500,
                    }}
                  >
                    1
                  </div>
                  <span
                    style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}
                  >
                    Skapa frånvarotyper
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "rgba(0,0,0,0.3)",
                  }}
                >
                  <ArrowRightSvg />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: rgba("#9c27b0", 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${rgba("#9c27b0", 0.2)}`,
                      color: rgba("#9c27b0", 0.5),
                      fontWeight: 500,
                    }}
                  >
                    2
                  </div>
                  <span
                    style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}
                  >
                    Skapa Grupp
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "rgba(0,0,0,0.3)",
                  }}
                >
                  <ArrowRightSvg />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: rgba("#2e7d32", 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${rgba("#2e7d32", 0.2)}`,
                      color: rgba("#2e7d32", 0.5),
                      fontWeight: 500,
                    }}
                  >
                    3
                  </div>
                  <span
                    style={{ fontSize: "0.9rem", color: "rgba(0,0,0,0.5)" }}
                  >
                    Skapa Arbetare
                  </span>
                </div>
              </div>
              <p style={{ fontStyle: "italic", color: "rgba(0,0,0,0.4)" }}>
                Klicka på <strong>Meny</strong> i sidomenyn för att komma igång!
              </p>
            </div>
          </div>
        ) : (
          <div
            style={{
              width: daysCount * CELL_WIDTH,
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              >
                {days.map(
                  (day, i) =>
                    isRedDay(day) && (
                      <div
                        key={`bg-${i}`}
                        style={{
                          position: "absolute",
                          left: i * CELL_WIDTH,
                          width: CELL_WIDTH,
                          top: 0,
                          bottom: 0,
                          backgroundColor: "rgba(244, 67, 54, 0.04)",
                          borderRight: "1px solid rgba(0, 0, 0, 0.02)",
                        }}
                      />
                    ),
                )}
              </div>
              <PastDaysOverlay
                width={disabledOverlayWidth}
                isVisible={blockPastDays}
              />
              <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToHorizontalAxis]}
              >
                <div style={{ position: "relative", width: "100%", flex: 1 }}>
                  {teams.map((team) => {
                    const isCollapsed = collapsedTeams.includes(team.id);
                    return (
                      <div key={team.id}>
                        <div
                          onMouseDown={onTeamMouseDown}
                          onMouseMove={onTeamMouseMove}
                          onMouseUp={onTeamMouseUp}
                          onMouseLeave={onTeamMouseUp}
                          style={{
                            height: 40,
                            backgroundColor: "rgba(0,0,0,0.04)",
                            borderBottom: "1px solid #eee",
                            cursor: "grab",
                            userSelect: "none",
                          }}
                        />
                        {!isCollapsed &&
                          (team.employees || []).map((emp) => (
                            <div
                              key={emp.id}
                              onPointerDown={(e) =>
                                onGridPointerDown(e, emp.id)
                              }
                              onPointerMove={onGridPointerMove}
                              onPointerUp={onGridPointerUp}
                              style={{
                                height: ROW_HEIGHT,
                                borderBottom: "1px solid #eee",
                                position: "relative",
                                backgroundImage: `linear-gradient(to right, #eee 1px, transparent 1px)`,
                                backgroundSize: `${CELL_WIDTH}px 100%`,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {selection.isSelecting &&
                                selection.rowId === emp.id && (
                                  <div
                                    ref={selectionBoxRef}
                                    style={{
                                      position: "absolute",
                                      top: 5,
                                      height: ROW_HEIGHT - 10,
                                      left: selection.startX,
                                      width: CELL_WIDTH,
                                      backgroundColor: rgba("#1976d2", 0.15),
                                      border: "2px dashed #1976d2",
                                      borderRadius: "4px",
                                      zIndex: 10,
                                      pointerEvents: "none",
                                    }}
                                  />
                                )}
                              {visibleAbsences
                                .filter((l) => l.employeeId === emp.id)
                                .map((l) => (
                                  <AbsenceBlock
                                    key={l.id}
                                    absenceDetails={l}
                                    employeeName={emp.name}
                                    left={getDateOffset(l.startDate, startDate)}
                                    onResizeEnd={onAbsenceBlockResizeEnd}
                                    onEdit={onAbsenceBlockEdit}
                                    onDelete={onAbsenceBlockDelete}
                                    onTooltipOpen={onTooltipOpen}
                                    onTooltipClose={onTooltipClose}
                                    isDeletionDisabled={disableDeletion}
                                    isPastDaysBlocked={blockPastDays}
                                    onApprove={onApprove}
                                    onReject={onReject}
                                    employeeId={emp.id}
                                    absenceColor={
                                      absenceTypes.find(
                                        (t) => t.id === l.absenceCategoryId,
                                      )?.color
                                    }
                                    scrollContainerRef={
                                      ref as React.RefObject<HTMLDivElement>
                                    }
                                  />
                                ))}
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
                <DragOverlay adjustScale={false} dropAnimation={null}>
                  {activeAbsenceBlock && (
                    <AbsenceBlock
                      absenceDetails={activeAbsenceBlock}
                      isOverlay
                      left={0}
                      employeeName="Dragging..."
                      absenceColor={
                        absenceTypes.find(
                          (t) => t.id === activeAbsenceBlock.absenceCategoryId,
                        )?.color
                      }
                      onResizeEnd={undefined}
                      onEdit={undefined}
                      onDelete={undefined}
                    />
                  )}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
