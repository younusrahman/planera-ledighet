import React, { forwardRef, useMemo } from "react";
import { Box, Typography, Collapse, alpha, useTheme } from "@mui/material";
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
import { AbsenceBlock } from "./AbsenceBlock";
import { PastDaysOverlay } from "./PastDaysOverlay";
import type { Employee, Absence } from "../types";
import { getSwedishHolidays } from "../utils/holidayHelper";
import { ProTooltip } from "./ProTooltip";
import { ArrowRightAlt } from "@mui/icons-material";

interface TimelineDndContextProps {
  // Data
  days: Dayjs[];
  daysCount: number;
  startDate: Dayjs;
  groups: Employee[];
  absences: Absence[];
  collapsedGroups: string[];
  absenceTypes: any[];
  activeLeave: Absence | null;

  // Settings
  blockPastDays: boolean;
  disabledOverlayWidth: number;
  disableDeletion: boolean;

  // Interaction State
  selection: {
    isSelecting: boolean;
    rowId: string | null;
    startX: number;
  };
  selectionBoxRef: React.RefObject<HTMLDivElement>;
  onGroupMouseDown: (e: React.MouseEvent) => void;
  onGroupMouseMove: (e: React.MouseEvent) => void;
  onGroupMouseUp: () => void;

  // Handlers
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onGridPointerDown: (e: React.PointerEvent, rowId: string) => void;
  onGridPointerMove: (e: React.PointerEvent) => void;
  onGridPointerUp: (e: React.PointerEvent) => void;
  onLeaveEdit: (id: string) => void;
  onLeaveDelete: (id: string) => void;
  onLeaveResizeEnd: (
    id: string,
    newDuration: number,
    daysShifted: number,
  ) => void;
  onTooltipOpen: () => void;
  onTooltipClose: () => void;
}

export const TimelineDndContext = forwardRef<
  HTMLDivElement,
  TimelineDndContextProps
>((props, ref) => {
  const {
    days,
    daysCount,
    startDate,
    groups,
    absences,
    collapsedGroups,
    absenceTypes,
    activeLeave,
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
    onLeaveEdit,
    onLeaveDelete,
    onLeaveResizeEnd,
    onTooltipOpen,
    onTooltipClose,
    onGroupMouseDown,
    onGroupMouseMove,
    onGroupMouseUp,
  } = props;
  // 1. Hämta helgdagar för de år som visas
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
    // 0 = Sunday, 6 = Saturday
    return day.day() === 0 || day.day() === 6 || holidays[dateStr]?.isRedDay;
  };

  const theme = useTheme();

  // 1. Beräkna vilka absences som faktiskt är inom det synliga fönstret
  const visibleAbsences = useMemo(() => {
    // Slutdatumet för vad som visas i gridet just nu
    const timelineEndDate = startDate.add(daysCount, "day");

    const filtered = absences.filter((l) => {
      const leaveStart = dayjs(l.startDate);
      // Vi räknar ut blockets slutdatum
      const leaveEnd = leaveStart.add(l.durationDays, "day");

      // Ett block ska visas om:
      // Blocket startar INNAN tidslinjen slutar...
      // OCH blocket slutar EFTER att tidslinjen börjar.
      return (
        leaveStart.isBefore(timelineEndDate) && leaveEnd.isAfter(startDate)
      );
    });

    console.log("👁️ Visible Absences:", {
      total: absences.length,
      visible: filtered.length,
      startDate: startDate.format("YYYY-MM-DD"),
      endDate: timelineEndDate.format("YYYY-MM-DD"),
      filtered,
    });

    return filtered;
  }, [absences, startDate, daysCount]);
  // --- Grid Visual Constants ---

  const noGroups = !groups || groups.length === 0;
  const noAbsenceTypes = !absenceTypes || absenceTypes.length === 0;
  const showWatermark = noGroups || noAbsenceTypes;
  return (
    /* 
      The outermost Box is the Horizontal Scroller. 
      IMPORTANT: This Box must NOT have overflowY: "auto" if you want 
      it to scroll vertically with the sidebar.
    */
    <Box
      ref={ref}
      onScroll={onScroll}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        // CHANGE THIS:
        overflowX: "auto",
        overflowY: "visible", // This is currently correct, but...
        // ...the outer container (Page 27) MUST be the one with overflow: "auto"
        width: "100%",
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: daysCount * CELL_WIDTH,
          minHeight: "100%",
          position: "relative",
        }}
      >
        {showWatermark ? (
          /* --- Your existing Watermark Code --- */
          <Box
            sx={{
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
              background: `linear-gradient(180deg, 
                transparent 0%, 
                ${alpha(theme.palette.background.paper, 0.7)} 30%,
                ${alpha(theme.palette.background.paper, 0.9)} 100%
            )`,
            }}
          >
            <Box
              sx={{
                textAlign: "center",
                maxWidth: "600px",
                padding: { xs: 3, md: 4 },
                width: "90%",
              }}
            >
              {/* Icon/Emoji */}
              <Box sx={{ opacity: 0.3 }}>
                <Typography sx={{ fontSize: "3.5rem" }}>📋</Typography>
              </Box>

              {/* Main Title */}
              <Typography
                variant="h4"
                sx={{
                  color: alpha(theme.palette.text.primary, 0.3),
                  fontWeight: 700,
                  fontSize: { xs: "1.5rem", md: "1.23rem" },
                  mb: 2,
                  lineHeight: 1.3,
                }}
              >
                Börja med att skapa frånvarotyper, grupper och anställda.
              </Typography>

              {/* Instruction Steps */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "center",
                  gap: { xs: 2, sm: 3, md: 4 },
                  mb: 2,
                }}
              >
                {/* Step 1 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${alpha(
                        theme.palette.primary.main,
                        0.2,
                      )}`,
                    }}
                  >
                    <Typography
                      sx={{
                        color: alpha(theme.palette.primary.main, 0.5),
                        fontWeight: 500,
                        fontSize: "1.1rem",
                      }}
                    >
                      1
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.5),
                      fontWeight: 400,
                      fontSize: "0.9rem",
                      textAlign: "center",
                      maxWidth: "120px",
                    }}
                  >
                    Skapa frånvarotyper
                  </Typography>
                </Box>

                {/* Arrow */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    color: alpha(theme.palette.text.disabled, 0.3),
                  }}
                >
                  <ArrowRightAlt />
                </Box>

                {/* Step 2 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${alpha(
                        theme.palette.secondary.main,
                        0.2,
                      )}`,
                    }}
                  >
                    <Typography
                      sx={{
                        color: alpha(theme.palette.secondary.main, 0.5),
                        fontWeight: 500,
                        fontSize: "1.1rem",
                      }}
                    >
                      2
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.5),
                      fontWeight: 400,
                      fontSize: "0.9rem",
                      textAlign: "center",
                      maxWidth: "120px",
                    }}
                  >
                    Skapa Grupp
                  </Typography>
                </Box>

                {/* Arrow */}
                <Box
                  sx={{
                    display: { xs: "none", sm: "flex" },
                    alignItems: "center",
                    color: alpha(theme.palette.text.disabled, 0.3),
                  }}
                >
                  <ArrowRightAlt />
                </Box>

                {/* Step 3 */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${alpha(
                        theme.palette.success.main,
                        0.2,
                      )}`,
                    }}
                  >
                    <Typography
                      sx={{
                        color: alpha(theme.palette.success.main, 0.5),
                        fontWeight: 500,
                        fontSize: "1.1rem",
                      }}
                    >
                      3
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: alpha(theme.palette.text.secondary, 0.5),
                      fontWeight: 400,
                      fontSize: "0.9rem",
                      textAlign: "center",
                      maxWidth: "120px",
                    }}
                  >
                    Skapa Arbetare
                  </Typography>
                </Box>
              </Box>

              {/* Final Instruction */}
              <Typography
                variant="body1"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.4),
                  fontWeight: 300,
                  fontSize: { xs: "0.95rem", md: "1.05rem" },
                  fontStyle: "italic",
                  lineHeight: 1.6,
                  maxWidth: "400px",
                  margin: "0 auto",
                  textAlign: "center",
                }}
              >
                Klicka på <strong>Meny</strong> i sidomenyn för att komma igång!
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: daysCount * CELL_WIDTH, // Forces the horizontal width
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* 2. MAIN GRID CONTENT */}
            <Box sx={{ position: "relative", flex: 1 }}>
              {/* Red Day Background Highlights */}
              <Box
                sx={{
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
                      <Box
                        key={`bg-${i}`}
                        sx={{
                          position: "absolute",
                          left: i * CELL_WIDTH,
                          width: CELL_WIDTH,
                          top: 0,
                          bottom: 0,
                          bgcolor: "rgba(244, 67, 54, 0.04)",
                          borderRight: "1px solid rgba(0, 0, 0, 0.02)",
                        }}
                      />
                    ),
                )}
              </Box>

              <PastDaysOverlay
                width={disabledOverlayWidth}
                isVisible={blockPastDays}
              />

              <DndContext
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                modifiers={[restrictToHorizontalAxis]}
              >
                <Box sx={{ position: "relative", width: "100%", flex: 1 }}>
                  {groups.map((group) => {
                    const isCollapsed = collapsedGroups.includes(group.id);
                    return (
                      <Box key={group.id}>
                        {/* Group Separator Row */}
                        <Box
                          onMouseDown={onGroupMouseDown}
                          onMouseMove={onGroupMouseMove}
                          onMouseUp={onGroupMouseUp}
                          onMouseLeave={onGroupMouseUp}
                          sx={{
                            height: 40,
                            bgcolor: alpha("#000", 0.04),
                            borderBottom: "1px solid #eee",
                            cursor: "grab",
                            userSelect: "none",
                            "&:hover": { bgcolor: alpha("#000", 0.08) },
                            "&:active": { cursor: "grabbing" },
                          }}
                        />

                        <Collapse in={!isCollapsed}>
                          {(group.resources || []).map((res) => (
                            <Box
                              key={res.id}
                              onPointerDown={(e) =>
                                onGridPointerDown(e, res.id)
                              }
                              onPointerMove={onGridPointerMove}
                              onPointerUp={onGridPointerUp}
                              sx={{
                                height: ROW_HEIGHT,
                                borderBottom: "1px solid #eee",
                                position: "relative",
                                backgroundImage: `linear-gradient(to right, #eee 1px, transparent 1px)`,
                                backgroundSize: `${CELL_WIDTH}px 100%`,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {/* Selection Box Ghost */}
                              {selection.isSelecting &&
                                selection.rowId === res.id && (
                                  <Box
                                    ref={selectionBoxRef}
                                    style={{
                                      left: selection.startX,
                                      width: CELL_WIDTH,
                                    }}
                                    sx={{
                                      position: "absolute",
                                      top: 5,
                                      height: ROW_HEIGHT - 10,
                                      bgcolor: alpha("#1976d2", 0.15),
                                      border: "2px dashed #1976d2",
                                      borderRadius: 1,
                                      zIndex: 10,
                                      pointerEvents: "none",
                                    }}
                                  />
                                )}

                              {/* Absence Blocks */}
                              {visibleAbsences
                                .filter((l) => l.rowId === res.id)
                                .map((l) => (
                                  <AbsenceBlock
                                    key={l.id}
                                    absenceDetails={l}
                                    resourceName={res.name}
                                    left={getDateOffset(l.startDate, startDate)}
                                    onResizeEnd={onLeaveResizeEnd}
                                    onEdit={onLeaveEdit}
                                    onDelete={onLeaveDelete}
                                    onTooltipOpen={onTooltipOpen}
                                    onTooltipClose={onTooltipClose}
                                    isDeletionDisabled={disableDeletion}
                                    isPastDaysBlocked={blockPastDays}
                                    scrollContainerRef={
                                      ref as React.RefObject<HTMLDivElement>
                                    }
                                  />
                                ))}
                            </Box>
                          ))}
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>

                <DragOverlay adjustScale={false}>
                  {activeLeave && (
                    <AbsenceBlock absenceDetails={activeLeave} isOverlay />
                  )}
                </DragOverlay>
              </DndContext>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
});
