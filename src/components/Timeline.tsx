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
import TodayIcon from "@mui/icons-material/Today";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
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
} from "../utils";
import { LeaveBlock } from "./LeaveBlock";

const RESOURCES = [
  { id: "1", name: "Anders Svensson" },
  { id: "2", name: "Anna Karlsson" },
  { id: "3", name: "Erik Nilsson" },
  { id: "4", name: "Malin Berg" },
];

export const Timeline = () => {
  // --- STATE ---
  // Start 30 days in the past, strict midnight
  const [startDate, setStartDate] = useState(
    dayjs().startOf("day").subtract(30, "days")
  );
  const [daysCount, setDaysCount] = useState(200);

  // FIX: Added missing isDragging state
  const [isDragging, setIsDragging] = useState(false);

  // Data State
  const [leaves, setLeaves] = useState<LeaveItem[]>([
    {
      id: "l1",
      name: "Nyårskonferens",
      startDate: "2026-01-01",
      durationDays: 4,
      color: "#1976d2", // Blue
      rowId: "1", // Row 1
    },
    // NEW BLOCK ADDED HERE
    {
      id: "l3",
      name: "Möte (Test Block)",
      startDate: "2026-01-08", // Starts after the blue block
      durationDays: 3,
      color: "#d32f2f", // Red
      rowId: "1", // SAME ROW as l1
    },
    {
      id: "l2",
      name: "Vinterledigt",
      startDate: "2026-01-10",
      durationDays: 14,
      color: "#2e7d32", // Green
      rowId: "2",
    },
  ]);

  // Dragging State
  const [activeLeave, setActiveLeave] = useState<LeaveItem | null>(null);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);

  // Memoized Grid
  const days = useMemo(
    () => getDaysArray(startDate, daysCount),
    [startDate, daysCount]
  );

  // --- INFINITE SCROLL SYNCHRONIZATION ---
  useLayoutEffect(() => {
    if (
      scrollContainerRef.current &&
      !startDate.isSame(previousStartDate.current)
    ) {
      const diffDays = previousStartDate.current.diff(startDate, "day");

      if (diffDays > 0) {
        // We added days to the past. Shift scroll right to compensate.
        const pixelsAdded = diffDays * CELL_WIDTH;
        scrollContainerRef.current.scrollLeft += pixelsAdded;
      }

      previousStartDate.current = startDate;
      isLoadingRef.current = false;
    }
  }, [startDate]);

  // --- INITIAL CENTERING ---
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayOffset = getDateOffset(
        dayjs().format("YYYY-MM-DD"),
        startDate
      );
      // Center roughly on today
      scrollContainerRef.current.scrollLeft = todayOffset - 200;
    }
  }, []);

  // --- SCROLL HANDLER ---
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;

    if (!container || isLoadingRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollThreshold = 500;
    const loadAmount = 30;

    // 1. Future Expansion
    if (scrollLeft + clientWidth > scrollWidth - scrollThreshold) {
      isLoadingRef.current = true;
      setDaysCount((prev) => prev + loadAmount);

      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }

    // 2. Past Expansion
    if (scrollLeft < scrollThreshold) {
      isLoadingRef.current = true;
      setStartDate((prev) => prev.subtract(loadAmount, "day"));
      setDaysCount((prev) => prev + loadAmount);
    }
  }, []);

  // --- NAVIGATION ---
  const jumpToDate = (date: Dayjs | null) => {
    if (!date) return;
    const target = date.startOf("day");
    const newStart = target.subtract(30, "days");
    setStartDate(newStart);
    setDaysCount(300);
    // Wait for render, then scroll
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const offset = getDateOffset(target.format("YYYY-MM-DD"), newStart);
        scrollContainerRef.current.scrollLeft = offset - 100;
      }
    }, 10);
  };

  // --- DND LOGIC ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    // 1. Capture the exact grid state when we picked up the block
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
      // 1. Find the item we moved
      const item = leaves.find((l) => l.id === active.id);
      if (!item) return;

      // 2. Calculate PROPOSED new start date
      const newStartDate = dayjs(item.startDate)
        .add(finalDaysDiff, "day")
        .format("YYYY-MM-DD");

      // 3. Check for collision
      const hasCollision = checkCollision(leaves, {
        ...item,
        startDate: newStartDate,
      });

      if (!hasCollision) {
        // 4. Update if safe
        setLeaves((prev) =>
          prev.map((l) =>
            l.id === active.id ? { ...l, startDate: newStartDate } : l
          )
        );
      } else {
        // Optional: Show error toast here ("Cannot move here")
        console.warn("Collision detected, move reverted");
      }
    }
  };
  const handleResizeEnd = (id: string, newDuration: number) => {
    const item = leaves.find((l) => l.id === id);
    if (!item) return;

    // Check collision with NEW duration
    const hasCollision = checkCollision(leaves, {
      ...item,
      durationDays: newDuration,
    });

    if (!hasCollision) {
      setLeaves((prev) =>
        prev.map((l) => (l.id === id ? { ...l, durationDays: newDuration } : l))
      );
    } else {
      console.warn("Collision detected during resize");
      // The LeaveBlock component resets its visual state automatically on mouseUp,
      // so we just don't update the global state, snapping it back effectively.
    }
  };

  // Background Grid CSS
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
      {/* TOOLBAR */}
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: "1px solid #ddd", bgcolor: "white" }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Planera ledighet
          </Typography>
          <Box
            sx={{
              display: "flex",
              bgcolor: "#f0f0f0",
              borderRadius: 2,
              p: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => jumpToDate(dayjs().subtract(1, "month"))}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <Button
              size="small"
              onClick={() => jumpToDate(dayjs())}
              startIcon={<TodayIcon />}
            >
              Idag
            </Button>
            <IconButton
              size="small"
              onClick={() => jumpToDate(dayjs().add(1, "month"))}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>
          <DatePicker
            label="Gå till datum"
            onChange={jumpToDate}
            slotProps={{ textField: { size: "small" } }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <Box
          sx={{
            width: 200,
            mt: "106px",
            borderRight: "1px solid #ddd",
            bgcolor: "white",
            zIndex: 10,
          }}
        >
          {RESOURCES.map((r) => (
            <Box
              key={r.id}
              sx={{
                height: ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                px: 2,
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                {r.name}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* TIMELINE AREA */}
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowX: "auto",
            overflowY: "hidden",
            position: "relative",
            bgcolor: "#fff",
            overflowAnchor: "none", // CRITICAL for infinite scroll stability
          }}
        >
          {/* HEADER (Sticky) */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              bgcolor: "white",
              width: daysCount * CELL_WIDTH,
            }}
          >
            {/* Months */}
            <Box
              sx={{
                display: "flex",
                height: 40,
                borderBottom: "1px solid #eee",
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
            {/* Weeks */}
            <Box
              sx={{
                display: "flex",
                height: 25,
                bgcolor: "#fafafa",
                borderBottom: "1px solid #eee",
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
            {/* Days */}
            <Box sx={{ display: "flex" }}>
              {days.map((day) => (
                <Box
                  key={day.toISOString()}
                  sx={{
                    width: CELL_WIDTH,
                    minWidth: CELL_WIDTH,
                    textAlign: "center",
                    py: 0.5,
                    borderRight: "1px solid #eee",
                    borderBottom: "1px solid #ddd",
                    bgcolor: day.isSame(dayjs(), "day")
                      ? "#fff9c4"
                      : day.day() === 0 || day.day() === 6
                      ? "#f5f5f5"
                      : "white",
                  }}
                >
                  <Typography sx={{ fontSize: "0.6rem", fontWeight: 600 }}>
                    {day.format("ddd").toUpperCase()}
                  </Typography>
                  <Typography sx={{ fontWeight: 800 }}>
                    {day.format("D")}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* DND CONTEXT & ROWS */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
            autoScroll={{ threshold: { x: 0.2, y: 0 }, acceleration: 20 }}
          >
            <Box sx={{ position: "relative", width: daysCount * CELL_WIDTH }}>
              {RESOURCES.map((res) => (
                <Box
                  key={res.id}
                  sx={{
                    height: ROW_HEIGHT,
                    borderBottom: "1px solid #eee",
                    position: "relative",
                    backgroundImage: gridBackground,
                  }}
                >
                  {leaves
                    .filter((l) => l.rowId === res.id)
                    .map((l) => (
                      <LeaveBlock
                        key={l.id}
                        leave={l}
                        left={getDateOffset(l.startDate, startDate)}
                        onResizeEnd={handleResizeEnd} // <--- Pass the handler
                      />
                    ))}
                </Box>
              ))}
            </Box>

            {/* DRAG OVERLAY (Solves the "vanishing" issue) */}
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
