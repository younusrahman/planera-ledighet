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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
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
  type Group, // Import Group
} from "../utils";
import { LeaveBlock } from "./LeaveBlock";

// --- DATA STRUCTURE ---
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
  const [startDate, setStartDate] = useState(
    dayjs().startOf("day").subtract(30, "days")
  );
  const [daysCount, setDaysCount] = useState(200);
  const [isDragging, setIsDragging] = useState(false);

  // NEW: Track collapsed groups (array of Group IDs)
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  // Data State
  const [leaves, setLeaves] = useState<LeaveItem[]>([
    {
      id: "l1",
      name: "Nyårskonferens",
      startDate: "2026-01-01",
      durationDays: 4,
      color: "#1976d2",
      rowId: "1", // Anders
    },
    {
      id: "l3",
      name: "Möte (Test)",
      startDate: "2026-01-08",
      durationDays: 3,
      color: "#d32f2f",
      rowId: "1", // Anders
    },
    {
      id: "l2",
      name: "Vinterledigt",
      startDate: "2026-01-10",
      durationDays: 14,
      color: "#2e7d32",
      rowId: "2", // Anna
    },
  ]);

  const [activeLeave, setActiveLeave] = useState<LeaveItem | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);

  const days = useMemo(
    () => getDaysArray(startDate, daysCount),
    [startDate, daysCount]
  );

  // --- HELPER: FLATTEN GROUPS ---
  // This creates a single list of rows for rendering.
  // If a group is collapsed, its resources are skipped.
  const visibleRows = useMemo(() => {
    const rows: { type: "group" | "resource"; data: any }[] = [];

    GROUPS.forEach((group) => {
      // Add Group Header
      rows.push({ type: "group", data: group });

      // If NOT collapsed, add resources
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

  // --- INFINITE SCROLL ---
  useLayoutEffect(() => {
    if (
      scrollContainerRef.current &&
      !startDate.isSame(previousStartDate.current)
    ) {
      const diffDays = previousStartDate.current.diff(startDate, "day");
      if (diffDays > 0) {
        const pixelsAdded = diffDays * CELL_WIDTH;
        scrollContainerRef.current.scrollLeft += pixelsAdded;
      }
      previousStartDate.current = startDate;
      isLoadingRef.current = false;
    }
  }, [startDate]);

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

    if (scrollLeft + clientWidth > scrollWidth - scrollThreshold) {
      isLoadingRef.current = true;
      setDaysCount((prev) => prev + loadAmount);
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }

    if (scrollLeft < scrollThreshold) {
      isLoadingRef.current = true;
      setStartDate((prev) => prev.subtract(loadAmount, "day"));
      setDaysCount((prev) => prev + loadAmount);
    }
  }, []);

  const jumpToDate = (date: Dayjs | null) => {
    if (!date) return;
    const target = date.startOf("day");
    const newStart = target.subtract(30, "days");
    setStartDate(newStart);
    setDaysCount(300);
    setTimeout(() => {
      if (scrollContainerRef.current) {
        const offset = getDateOffset(target.format("YYYY-MM-DD"), newStart);
        scrollContainerRef.current.scrollLeft = offset - 100;
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

  const handleResizeEnd = (
    id: string,
    newDuration: number,
    daysShifted: number
  ) => {
    const item = leaves.find((l) => l.id === id);
    if (!item) return;

    // Calculate the proposed new start date
    const newStartDate = dayjs(item.startDate)
      .add(daysShifted, "day")
      .format("YYYY-MM-DD");

    // Check collision with NEW start date AND NEW duration
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
    } else {
      console.warn("Collision detected");
      // UI snaps back automatically on re-render
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
      {/* --- TOP NAVIGATION BAR --- */}
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

      {/* --- MAIN CONTENT AREA --- */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* --- LEFT SIDEBAR (FIXED) --- */}
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
          {/* SIDEBAR SPACER: Matches Timeline Header Height (40+25+40 = 105px) */}
          <Box
            sx={{
              height: 105,
              borderBottom: "1px solid #ddd",
              bgcolor: "white",
              flexShrink: 0,
              boxSizing: "border-box",
            }}
          />

          {/* SIDEBAR ROWS */}
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

        {/* --- TIMELINE SCROLL AREA --- */}
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
          {/* HEADER (STICKY) */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              bgcolor: "white",
              width: daysCount * CELL_WIDTH,
            }}
          >
            {/* 1. MONTHS ROW (Height 40) */}
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

            {/* 2. WEEKS ROW (Height 25) */}
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

            {/* 3. DAYS ROW (Height 40) */}
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
                    sx={{ fontSize: "0.6rem", fontWeight: 600, lineHeight: 1 }}
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

          {/* GRID & DRAGGABLES */}
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
            autoScroll={{ threshold: { x: 0.2, y: 0 }, acceleration: 20 }}
          >
            <Box sx={{ position: "relative", width: daysCount * CELL_WIDTH }}>
              {visibleRows.map((row) => {
                // RENDER GROUP ROW (SPACER)
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
                }
                // RENDER RESOURCE ROW (WITH BLOCKS)
                else {
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
