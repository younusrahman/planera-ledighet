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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
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
  { id: "conf", color: "#1976d2", label: "Konferens" },
  { id: "vac", color: "#2e7d32", label: "Semester" },
  { id: "sick", color: "#d32f2f", label: "Sjuk" },
  { id: "vab", color: "#ed6c02", label: "VAB" },
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
  const [startDate, setStartDate] = useState(
    dayjs().startOf("day").subtract(30, "days")
  );
  const [daysCount, setDaysCount] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(dayjs());

  // --- CREATE / SELECTION STATE ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Tracks the "Drag to Create" action
  const [selection, setSelection] = useState<{
    isSelecting: boolean;
    rowId: string | null;
    startX: number; // Pixel relative to container
    currentX: number; // Pixel relative to container
    startIndex: number; // Day index from startDate
  }>({
    isSelecting: false,
    rowId: null,
    startX: 0,
    currentX: 0,
    startIndex: 0,
  });

  const [newItem, setNewItem] = useState<{
    rowId: string;
    startDate: Dayjs;
    duration: number;
    typeId: string;
    name: string;
  }>({
    rowId: "",
    startDate: dayjs(),
    duration: 1,
    typeId: "vac",
    name: "Ny frånvaro",
  });

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
  const datePickerAnchorRef = useRef<HTMLButtonElement>(null);
  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);
  const isJumpingRef = useRef(false);
  // NEW: Refs for Auto-Scrolling during Creation
  const selectionScrollFrame = useRef<number>(0);
  const isSelectingRef = useRef(false);
  const pointerXRef = useRef(0); // Tracks raw mouse X position

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
      if (isJumpingRef.current) {
        previousStartDate.current = startDate;
        isJumpingRef.current = false;
        isLoadingRef.current = false;
        return;
      }

      const diffDays = previousStartDate.current.diff(startDate, "day");

      if (diffDays > 0) {
        const pixelsAdded = diffDays * CELL_WIDTH;

        // 1. Adjust Scroll Position (Keep view stable)
        scrollContainerRef.current.scrollLeft += pixelsAdded;

        // 2. FIX: Adjust Selection Coordinates (Keep selection stable)
        // If we are currently selecting, shift the coordinates so the blue box
        // stays attached to the same dates/visual position.
        if (isSelectingRef.current) {
          setSelection((prev) => ({
            ...prev,
            startX: prev.startX + pixelsAdded,
            currentX: prev.currentX + pixelsAdded,
          }));
        }
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

  useEffect(() => {
    return () => {
      if (selectionScrollFrame.current) {
        cancelAnimationFrame(selectionScrollFrame.current);
      }
    };
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

  // --- AUTO SCROLL LOOP FOR CREATION ---
  const performSelectionAutoScroll = () => {
    if (!isSelectingRef.current || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { left: containerLeft, width: containerWidth } =
      container.getBoundingClientRect();
    const pointerX = pointerXRef.current;

    const edgeThreshold = 50;
    const scrollSpeed = 15;
    let scrolledAmount = 0;

    // Scroll Right
    if (pointerX > containerLeft + containerWidth - edgeThreshold) {
      container.scrollLeft += scrollSpeed;
      scrolledAmount = scrollSpeed;
    }
    // Scroll Left
    else if (pointerX < containerLeft + edgeThreshold) {
      container.scrollLeft -= scrollSpeed;
      scrolledAmount = -scrollSpeed;
    }

    // If we scrolled, we MUST update the selection state so the blue box grows/shrinks
    if (scrolledAmount !== 0) {
      setSelection((prev) => {
        if (!prev.isSelecting) return prev;
        // The absolute position in the grid = Mouse Client X + New Scroll Left
        const rect = container.getBoundingClientRect();
        const absoluteX = pointerX - rect.left + container.scrollLeft;

        return {
          ...prev,
          currentX: absoluteX,
        };
      });
    }

    // Keep loop running
    selectionScrollFrame.current = requestAnimationFrame(
      performSelectionAutoScroll
    );
  };

  const jumpToDate = (date: Dayjs | null) => {
    if (!date) return;
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

  // --- GRID DRAG SELECTION HANDLERS ---

  const handleGridPointerDown = (e: React.PointerEvent, rowId: string) => {
    if (e.button !== 0 || isDragging) return;

    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;

    // Capture pointer
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // Init Refs for AutoScroll
    isSelectingRef.current = true;
    pointerXRef.current = e.clientX;

    // Calculate Start
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const absoluteX = clientX + container.scrollLeft;

    // Snap Start
    const dayIndex = Math.floor(absoluteX / CELL_WIDTH);
    const snapX = dayIndex * CELL_WIDTH;

    setSelection({
      isSelecting: true,
      rowId,
      startX: snapX,
      currentX: snapX,
      startIndex: dayIndex,
    });

    // Start the Loop
    selectionScrollFrame.current = requestAnimationFrame(
      performSelectionAutoScroll
    );
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return; // Use ref for speed check

    // Update ref for the loop
    pointerXRef.current = e.clientX;

    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const absoluteX = clientX + container.scrollLeft;

    // Update visuals immediately (don't wait for loop)
    setSelection((prev) => ({
      ...prev,
      currentX: absoluteX,
    }));
  };

  const handleGridPointerUp = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;

    // Stop Loop
    isSelectingRef.current = false;
    if (selectionScrollFrame.current)
      cancelAnimationFrame(selectionScrollFrame.current);

    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    // Standard Finish Logic (Calculations)
    const rowId = selection.rowId;
    if (!rowId) return;

    const startX = Math.min(selection.startX, selection.currentX);
    const endX = Math.max(selection.startX, selection.currentX);

    const startIdx = Math.floor(startX / CELL_WIDTH);
    const endIdx = Math.floor(endX / CELL_WIDTH);

    const duration = endIdx - startIdx + 1;
    const finalStartDate = startDate.add(startIdx, "day");

    setSelection({
      isSelecting: false,
      rowId: null,
      startX: 0,
      currentX: 0,
      startIndex: 0,
    });

    // Open Modal
    if (duration > 0) {
      setNewItem({
        rowId: rowId,
        startDate: finalStartDate,
        duration: duration,
        typeId: "vac",
        name: "Semester",
      });
      setIsCreateOpen(true);
    }
  };

  const handleSaveNewItem = () => {
    const type = ABSENCE_TYPES.find((t) => t.id === newItem.typeId);
    if (!type) return;

    const newLeave: LeaveItem = {
      id: "new-" + Date.now(),
      rowId: newItem.rowId,
      name: newItem.name,
      startDate: newItem.startDate.format("YYYY-MM-DD"),
      durationDays: Number(newItem.duration),
      color: type.color,
    };

    if (!checkCollision(leaves, newLeave)) {
      setLeaves((prev) => [...prev, newLeave]);
      setIsCreateOpen(false);
    } else {
      alert("Krockar med annan frånvaro!");
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "#f0f0f0",
              borderRadius: 2,
              p: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => jumpToDate(pickerDate.subtract(1, "month"))}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
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
            value={pickerDate}
            views={["year", "month", "day"]}
            slotProps={{
              textField: { sx: { display: "none" } },
              popper: {
                anchorEl: datePickerAnchorRef.current,
                placement: "bottom-start",
              },
              actionBar: { actions: ["today"] },
            }}
          />
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
                  // Is this row currently being selected?
                  const isSelectingThisRow =
                    selection.isSelecting && selection.rowId === resource.id;

                  // Calculate selection box style
                  let selectionStyle = {};
                  if (isSelectingThisRow) {
                    const startPos = Math.min(
                      selection.startX,
                      selection.currentX
                    );
                    const width = Math.abs(
                      selection.currentX - selection.startX
                    );
                    selectionStyle = {
                      position: "absolute",
                      left: startPos,
                      top: 5,
                      height: ROW_HEIGHT - 10,
                      width: width, // Allow smooth drag visuals, or snap width to grid: Math.max(CELL_WIDTH, Math.ceil(width / CELL_WIDTH) * CELL_WIDTH)
                      backgroundColor: "rgba(25, 118, 210, 0.3)",
                      border: "2px dashed #1976d2",
                      borderRadius: 4,
                      zIndex: 10,
                      pointerEvents: "none", // Let events pass through to container
                    };
                  }

                  return (
                    <Box
                      key={resource.id}
                      // ATTACH DRAG LISTENERS
                      onPointerDown={(e) =>
                        handleGridPointerDown(e, resource.id)
                      }
                      onPointerMove={handleGridPointerMove}
                      onPointerUp={handleGridPointerUp}
                      sx={{
                        height: ROW_HEIGHT,
                        borderBottom: "1px solid #eee",
                        position: "relative",
                        backgroundImage: gridBackground,
                        boxSizing: "border-box",
                        cursor: "crosshair", // Visual indicator
                      }}
                    >
                      {/* RENDER GHOST SELECTION BLOCK */}
                      {isSelectingThisRow && <Box sx={selectionStyle} />}

                      {leaves
                        .filter((l) => l.rowId === resource.id)
                        .map((l) => (
                          <div
                            key={l.id}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <LeaveBlock
                              leave={l}
                              left={getDateOffset(l.startDate, startDate)}
                              onResizeEnd={handleResizeEnd}
                              scrollContainerRef={scrollContainerRef}
                            />
                          </div>
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

      {/* --- CREATE NEW ABSENCE DIALOG --- */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogTitle>Lägg till frånvaro</DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 1,
            minWidth: 400, // Made wider to fit 2 dates
          }}
        >
          {/* TYPE SELECTOR */}
          <TextField
            select
            label="Typ av frånvaro"
            value={newItem.typeId}
            onChange={(e) => {
              const type = ABSENCE_TYPES.find((t) => t.id === e.target.value);
              setNewItem({
                ...newItem,
                typeId: e.target.value,
                name: type?.label || "",
              });
            }}
            fullWidth
          >
            {ABSENCE_TYPES.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: option.color,
                    }}
                  />
                  {option.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>

          {/* DATES ROW */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <DatePicker
              label="Startdatum"
              value={newItem.startDate}
              onChange={(date) => {
                if (date) {
                  // Logic: Moving Start Date keeps duration constant (Move Block)
                  setNewItem((prev) => ({
                    ...prev,
                    startDate: date.startOf("day"),
                  }));
                }
              }}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <DatePicker
              label="Slutdatum"
              // Calculate End Date based on Start + Duration
              value={newItem.startDate.add(newItem.duration - 1, "day")}
              onChange={(date) => {
                if (date) {
                  // Logic: Changing End Date updates Duration
                  const newEnd = date.startOf("day");
                  const diff = newEnd.diff(newItem.startDate, "day") + 1;

                  if (diff >= 1) {
                    setNewItem((prev) => ({ ...prev, duration: diff }));
                  } else {
                    // If user picks date BEFORE start, move start back
                    setNewItem((prev) => ({
                      ...prev,
                      startDate: newEnd,
                      duration: 1,
                    }));
                  }
                }
              }}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>

          {/* DURATION INPUT */}
          <TextField
            label="Antal dagar"
            type="number"
            value={newItem.duration}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              // Logic: Changing duration updates End Date (implicit)
              setNewItem((prev) => ({
                ...prev,
                duration: Math.max(1, val),
              }));
            }}
            fullWidth
            slotProps={{ htmlInput: { min: 1 } }}
            helperText={`Till: ${newItem.startDate
              .add(newItem.duration - 1, "day")
              .format("D MMM YYYY")}`} // Helper text to confirm end date
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)}>Avbryt</Button>
          <Button variant="contained" onClick={handleSaveNewItem}>
            Spara
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
