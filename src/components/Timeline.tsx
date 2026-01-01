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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"; // Icon for the date
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
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  // NEW: State to control the hidden date picker
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);

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

  // --- CURRENT DATE LABEL ---
  const today = dayjs();
  const todayLabel = `${today.format("D MMM YYYY")}, v.${today.isoWeek()}`;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* --- TOOLBAR WITH CUSTOM DATE PICKER --- */}
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

          {/* Center Navigation Box */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#f0f0f0",
              borderRadius: 2,
              p: 0.5,
            }}
          >
            {/* Prev Month */}
            <IconButton
              size="small"
              onClick={() => jumpToDate(dayjs().subtract(1, "month"))}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>

            {/* Custom Date Trigger Button */}
            <Button
              onClick={() => setIsDatePickerOpen(true)}
              startIcon={<CalendarMonthIcon fontSize="small" />}
              sx={{
                mx: 1,
                color: "text.primary",
                fontWeight: 600,
                textTransform: "capitalize",
                minWidth: "160px", // Ensure text doesn't jump
              }}
            >
              {todayLabel}
            </Button>

            {/* Next Month */}
            <IconButton
              size="small"
              onClick={() => jumpToDate(dayjs().add(1, "month"))}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* HIDDEN DATE PICKER */}
          <DatePicker
            open={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            onChange={(newValue) => {
              jumpToDate(newValue);
              setIsDatePickerOpen(false);
            }}
            value={dayjs()} // Default to today
            slotProps={{
              textField: {
                sx: { display: "none" }, // Hide the default input field
              },
            }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* --- SIDEBAR --- */}
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

        {/* --- TIMELINE AREA --- */}
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
          {/* HEADER */}
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 20,
              bgcolor: "white",
              width: daysCount * CELL_WIDTH,
            }}
          >
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
