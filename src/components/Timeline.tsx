import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Button,
  IconButton,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs, { Dayjs } from "dayjs";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  CELL_WIDTH,
  ROW_HEIGHT,
  getDaysArray,
  getDateOffset,
  checkCollision,
  type LeaveItem,
  type Group,
} from "../utils";
import { LeaveBlock } from "./LeaveBlock";

// --- CONFIGURATION ---

const ABSENCE_TYPES = [
  { id: "conf", color: "#1976d2", label: "Konferens" }, // Blue
  { id: "vac", color: "#2e7d32", label: "Semester" }, // Green
  { id: "sick", color: "#d32f2f", label: "Sjuk" }, // Red
  { id: "vab", color: "#ed6c02", label: "VAB" }, // Orange
];

const GROUPS: Group[] = [
  {
    id: "g1",
    name: "Utvecklare",
    resources: [
      { id: "1", name: "Anders Svensson" },
      { id: "2", name: "Anna Karlsson" },
    ],
  },
  {
    id: "g2",
    name: "Designers",
    resources: [
      { id: "3", name: "Erik Nilsson" },
      { id: "4", name: "Malin Berg" },
    ],
  },
  {
    id: "g3",
    name: "Projektledare",
    resources: [{ id: "5", name: "Gustav Vasa" }],
  },
];

export const Timeline = () => {
  // --- STATE ---

  // Grid State
  const [startDate, setStartDate] = useState(
    dayjs().startOf("day").subtract(30, "days")
  );
  const [daysCount, setDaysCount] = useState(200);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  // Navigation State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(dayjs()); // Tracks picker value

  // Data State
  const [leaves, setLeaves] = useState<LeaveItem[]>([
    {
      id: "l1",
      name: "Nyårskonferens",
      startDate: "2026-01-01",
      durationDays: 4,
      color: "#1976d2",
      rowId: "1",
    },
    {
      id: "l3",
      name: "Möte (Test)",
      startDate: "2026-01-08",
      durationDays: 3,
      color: "#d32f2f",
      rowId: "1",
    },
    {
      id: "l2",
      name: "Vinterledigt",
      startDate: "2026-01-10",
      durationDays: 14,
      color: "#2e7d32",
      rowId: "2",
    },
  ]);

  const [activeLeave, setActiveLeave] = useState<LeaveItem | null>(null);

  // --- REFS ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const datePickerAnchorRef = useRef<HTMLButtonElement>(null);

  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);
  const isJumpingRef = useRef(false); // Prevents infinite scroll glitch during jumps

  // --- MEMOS ---
  const days = useMemo(
    () => getDaysArray(startDate, daysCount),
    [startDate, daysCount]
  );

  const visibleRows = useMemo(() => {
    const rows: { type: "group" | "resource"; data: any }[] = [];
    GROUPS.forEach((group) => {
      rows.push({ type: "group", data: group });
      if (!collapsedGroups.includes(group.id)) {
        group.resources.forEach((resource) => {
          rows.push({ type: "resource", data: resource });
        });
      }
    });
    return rows;
  }, [collapsedGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  // --- INFINITE SCROLL LOGIC ---
  useLayoutEffect(() => {
    if (
      scrollContainerRef.current &&
      !startDate.isSame(previousStartDate.current)
    ) {
      // If manually jumping, DO NOT adjust scroll (let jumpToDate handle it)
      if (isJumpingRef.current) {
        previousStartDate.current = startDate;
        isJumpingRef.current = false;
        isLoadingRef.current = false;
        return;
      }

      // If scrolling left naturally, adjust scroll to maintain position
      const diffDays = previousStartDate.current.diff(startDate, "day");
      if (diffDays > 0) {
        const pixelsAdded = diffDays * CELL_WIDTH;
        scrollContainerRef.current.scrollLeft += pixelsAdded;
      }

      previousStartDate.current = startDate;
      isLoadingRef.current = false;
    }
  }, [startDate]);

  // Initial Center on Mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayOffset = getDateOffset(
        dayjs().format("YYYY-MM-DD"),
        startDate
      );
      scrollContainerRef.current.scrollLeft = todayOffset - 200;
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollThreshold = 500;
    const loadAmount = 30;

    // Expand Right
    if (scrollLeft + clientWidth > scrollWidth - scrollThreshold) {
      isLoadingRef.current = true;
      setDaysCount((prev) => prev + loadAmount);
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }

    // Expand Left
    if (scrollLeft < scrollThreshold) {
      isLoadingRef.current = true;
      setStartDate((prev) => prev.subtract(loadAmount, "day"));
      setDaysCount((prev) => prev + loadAmount);
    }
  }, []);

  // --- NAVIGATION ---
  const jumpToDate = (date: Dayjs | null) => {
    if (!date) return;

    // Sync picker state so Year selection works
    setPickerDate(date);

    isJumpingRef.current = true;
    isLoadingRef.current = true;

    const target = date.startOf("day");
    const newStart = target.subtract(30, "days");

    setStartDate(newStart);
    setDaysCount(300);

    setTimeout(() => {
      if (scrollContainerRef.current) {
        const offset = getDateOffset(target.format("YYYY-MM-DD"), newStart);
        scrollContainerRef.current.scrollLeft = offset - 100;
        isLoadingRef.current = false;
      }
    }, 10);
  };

  // --- DND HANDLERS ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    dragStartTimeRef.current = startDate;
    const item = leaves.find((l) => l.id === event.active.id);
    if (item) setActiveLeave(item);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveLeave(null);
    const { active, delta } = event;

    const daysGridMoved = startDate.diff(dragStartTimeRef.current, "day");
    const visualMovedDays = Math.round(delta.x / CELL_WIDTH);
    const finalDaysDiff = visualMovedDays + daysGridMoved;

    if (finalDaysDiff !== 0) {
      const item = leaves.find((l) => l.id === active.id);
      if (!item) return;

      const newStartDate = dayjs(item.startDate)
        .add(finalDaysDiff, "day")
        .format("YYYY-MM-DD");

      const hasCollision = checkCollision(leaves, {
        ...item,
        startDate: newStartDate,
      });

      if (!hasCollision) {
        setLeaves((prev) =>
          prev.map((l) =>
            l.id === active.id ? { ...l, startDate: newStartDate } : l
          )
        );
      }
    }
  };

  // --- RESIZE HANDLER ---
  const handleResizeEnd = (
    id: string,
    newDuration: number,
    daysShifted: number
  ) => {
    const item = leaves.find((l) => l.id === id);
    if (!item) return;

    const newStartDate = dayjs(item.startDate)
      .add(daysShifted, "day")
      .format("YYYY-MM-DD");

    const hasCollision = checkCollision(leaves, {
      ...item,
      startDate: newStartDate,
      durationDays: newDuration,
    });

    if (!hasCollision) {
      setLeaves((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                startDate: newStartDate,
                durationDays: newDuration,
              }
            : l
        )
      );
    }
  };

  const gridBackground = `repeating-linear-gradient(90deg, #f0f0f0 0px, #f0f0f0 1px, transparent 1px, transparent ${CELL_WIDTH}px)`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* --- APP BAR --- */}
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid #ddd", bgcolor: "white" }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Planera ledighet
          </Typography>

          {/* LEGEND */}
          <Box sx={{ display: "flex", gap: 2, ml: 4, alignItems: "center" }}>
            {ABSENCE_TYPES.map((type) => (
              <Box
                key={type.id}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: type.color,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 600, color: "#666" }}
                >
                  {type.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          {/* NAVIGATION */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#f0f0f0",
              borderRadius: 2,
              p: 0.5,
            }}
          >
            {/* Prev Month (Relative to current selection) */}
            <IconButton
              size="small"
              onClick={() => jumpToDate(pickerDate.subtract(1, "month"))}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            {/* Date Button - Just opens the picker, no math */}
            <Button
              ref={datePickerAnchorRef}
              onClick={() => setIsDatePickerOpen(true)}
              startIcon={<CalendarMonthIcon fontSize="small" />}
              sx={{
                mx: 1,
                color: "text.primary",
                fontWeight: 600,
                textTransform: "capitalize",
                minWidth: "160px",
              }}
            >
              {pickerDate.format("D MMM YYYY")}, v.{pickerDate.isoWeek()}
            </Button>

            {/* Next Month (Relative to current selection) */}
            <IconButton
              size="small"
              onClick={() => jumpToDate(pickerDate.add(1, "month"))}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>

          <DatePicker
            open={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            onChange={(newValue) => jumpToDate(newValue)}
            onAccept={(newValue) => jumpToDate(newValue)}
            value={pickerDate}
            views={["year", "month", "day"]}
            slotProps={{
              textField: {
                sx: { display: "none" },
              },
              popper: {
                anchorEl: datePickerAnchorRef.current,
                placement: "bottom-start",
              },
              // ADD THIS SECTION:
              actionBar: {
                actions: ["today"], // Shows only the "Today" button
                // You can also use: ['today', 'cancel', 'accept'] if you want more buttons
              },
            }}
          />
        </Toolbar>
      </AppBar>

      {/* --- CONTENT --- */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <Box
          sx={{
            width: 250,
            borderRight: "1px solid #ddd",
            bgcolor: "white",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header Spacer (105px) */}
          <Box
            sx={{
              height: 105,
              borderBottom: "1px solid #ddd",
              bgcolor: "white",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          />

          <Box sx={{ overflowY: "hidden", flex: 1 }}>
            {visibleRows.map((row) => {
              if (row.type === "group") {
                const isCollapsed = collapsedGroups.includes(row.data.id);
                return (
                  <Box
                    key={row.data.id}
                    onClick={() => toggleGroup(row.data.id)}
                    sx={{
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      px: 1,
                      borderBottom: "1px solid #ddd",
                      bgcolor: "#f5f5f5",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#e0e0e0" },
                      boxSizing: "border-box",
                    }}
                  >
                    {isCollapsed ? (
                      <KeyboardArrowRightIcon />
                    ) : (
                      <KeyboardArrowDownIcon />
                    )}
                    <Typography variant="subtitle2" fontWeight="bold">
                      {row.data.name}
                    </Typography>
                  </Box>
                );
              } else {
                return (
                  <Box
                    key={row.data.id}
                    sx={{
                      height: ROW_HEIGHT,
                      display: "flex",
                      alignItems: "center",
                      pl: 5,
                      pr: 2,
                      borderBottom: "1px solid #f0f0f0",
                      boxSizing: "border-box",
                    }}
                  >
                    <Typography variant="body2">{row.data.name}</Typography>
                  </Box>
                );
              }
            })}
          </Box>
        </Box>

        {/* TIMELINE */}
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowX: "auto",
            overflowY: "hidden",
            position: "relative",
            bgcolor: "#fff",
            overflowAnchor: "none",
          }}
        >
          {/* STICKY HEADER */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              bgcolor: "white",
              width: daysCount * CELL_WIDTH,
            }}
          >
            {/* MONTHS */}
            <Box
              sx={{
                display: "flex",
                height: 40,
                borderBottom: "1px solid #eee",
                boxSizing: "border-box",
              }}
            >
              {days
                .filter((d, i) => i === 0 || d.date() === 1)
                .map((day) => (
                  <Typography
                    key={day.toISOString() + "m"}
                    variant="subtitle2"
                    sx={{
                      position: "absolute",
                      left:
                        getDateOffset(day.format("YYYY-MM-DD"), startDate) + 10,
                      pt: 1,
                      fontWeight: 700,
                      textTransform: "capitalize",
                      color: "primary.main",
                    }}
                  >
                    {day.format("MMMM YYYY")}
                  </Typography>
                ))}
            </Box>

            {/* WEEKS */}
            <Box
              sx={{
                display: "flex",
                height: 25,
                bgcolor: "#fafafa",
                borderBottom: "1px solid #eee",
                boxSizing: "border-box",
              }}
            >
              {days
                .filter((d) => d.day() === 1)
                .map((day) => (
                  <Typography
                    key={day.toISOString() + "w"}
                    variant="caption"
                    sx={{
                      position: "absolute",
                      left:
                        getDateOffset(day.format("YYYY-MM-DD"), startDate) + 5,
                      fontWeight: 700,
                    }}
                  >
                    v.{day.isoWeek()}
                  </Typography>
                ))}
            </Box>

            {/* DAYS */}
            <Box sx={{ display: "flex", height: 40, boxSizing: "border-box" }}>
              {days.map((day) => (
                <Box
                  key={day.toISOString()}
                  sx={{
                    width: CELL_WIDTH,
                    minWidth: CELL_WIDTH,
                    textAlign: "center",
                    pt: 0.5,
                    borderRight: "1px solid #eee",
                    borderBottom: "1px solid #ddd",
                    bgcolor: day.isSame(dayjs(), "day")
                      ? "#fff9c4"
                      : day.day() === 0 || day.day() === 6
                      ? "#f5f5f5"
                      : "white",
                    boxSizing: "border-box",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    {day.format("ddd").toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {day.format("D")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* GRID & BLOCKS */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
            autoScroll={{ threshold: { x: 0.2, y: 0 }, acceleration: 20 }}
          >
            <Box sx={{ position: "relative", width: daysCount * CELL_WIDTH }}>
              {visibleRows.map((row) => {
                if (row.type === "group") {
                  return (
                    <Box
                      key={row.data.id}
                      sx={{
                        height: 40,
                        bgcolor: "#f5f5f5",
                        borderBottom: "1px solid #ddd",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                } else {
                  const resource = row.data;
                  return (
                    <Box
                      key={resource.id}
                      sx={{
                        height: ROW_HEIGHT,
                        borderBottom: "1px solid #eee",
                        position: "relative",
                        backgroundImage: gridBackground,
                        boxSizing: "border-box",
                      }}
                    >
                      {leaves
                        .filter((l) => l.rowId === resource.id)
                        .map((l) => (
                          <LeaveBlock
                            key={l.id}
                            leave={l}
                            left={getDateOffset(l.startDate, startDate)}
                            onResizeEnd={handleResizeEnd}
                            scrollContainerRef={scrollContainerRef}
                          />
                        ))}
                    </Box>
                  );
                }
              })}
            </Box>

            <DragOverlay adjustScale={false}>
              {activeLeave ? (
                <LeaveBlock leave={activeLeave} isOverlay={true} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>
    </Box>
  );
};
