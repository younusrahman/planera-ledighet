import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from "react";
import { alpha, Box, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CELL_WIDTH } from "../utils";
import { useSidebarMode, useUIActions, useViewMode } from "../services/uiStore";
import type { Group, LeaveItem } from "../types";
import { checkCollision, getDateOffset, getDaysArray } from "../utils/Helper";
import { toast } from "../services/globalSnackbar";
import { dialog } from "../services/dialog/dialogStore";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineSidebar } from "./TimelineSidebar";
import { TimelineDndContext } from "./TimelineDndContext";
import { appServicesStatic } from "../services/appServices";
import { YearOverview } from "./YearOverview";
import { PastDaysOverlay } from "./PastDaysOverlay";
import { BaseDndGrid } from "./BaseDndGrid";
import { getSwedishHolidays } from "../utils/holidayHelper";
const today = dayjs().startOf("day"); // Normalize to the beginning of the day

export const Timeline = () => {
  const sidebarMode = useSidebarMode();
  const { toggleSidebar } = useUIActions();

  // 1. Hämta ENDAST från Store/API
  const absenceTypes = appServicesStatic.absenceTypes.useItems();
  const groups = appServicesStatic.groups.useItems();
  const leaves = appServicesStatic.leaves.useItems();

  // 2. Trigga laddning
  useEffect(() => {
    appServicesStatic.refreshAllData();
  }, []);

  // --- STATE ---
  const [startDate, setStartDate] = useState(
    dayjs().startOf("day").subtract(30, "days"),
  );

  const [daysCount, setDaysCount] = useState(150);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  // const { openDialog } = useDialog();
  // Interaction States
  const [isDragging, setIsDragging] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(dayjs());
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // const [absenceTypes, setAbsenceTypes] = useState(ABSENCE_TYPES);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const viewMode = useViewMode();
  const [activeLeave, setActiveLeave] = useState<LeaveItem | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const datePickerAnchorRef = useRef<HTMLButtonElement>(null);
  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);
  const isJumpingRef = useRef(false);
  const isSelectingRef = useRef(false);
  const scrollRequestRef = useRef<number | null>(null);
  const lastPointerXRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState({
    isSelecting: false,
    rowId: null as string | null,
    startX: 0,
    currentX: 0,
    startIndex: 0,
  });

  // State for the checkbox "Spärr för gångna dagar"
  const [blockPastDays, setBlockPastDays] = useState(true); // Default to ON
  // State for the checkbox "Ta bort möjligheten att radera"
  const [disableDeletion, setDisableDeletion] = useState(false); // Default to OFF
  const hasInitialScrolled = useRef(false);
  // Inside your Timeline component
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [isReady, setIsReady] = useState(false); // Prevents the flicker

  // --- 1. CALCULATE VISIBLE DATA FIRST ---
  const visibleLeaves = useMemo(() => {
    const timelineEndDate = startDate.add(daysCount, "day");
    return leaves.filter((l) => {
      const leaveStart = dayjs(l.startDate);
      const leaveEnd = leaveStart.add(l.durationDays, "day");
      return (
        leaveStart.isBefore(timelineEndDate) && leaveEnd.isAfter(startDate)
      );
    });
  }, [leaves, startDate, daysCount]);

  // --- 2. CALCULATE EXTENDED RANGE ---
  const extendedDaysCount = useMemo(() => {
    let maxDaysNeeded = daysCount;
    visibleLeaves.forEach((l) => {
      const leaveEnd = dayjs(l.startDate).add(l.durationDays, "day");
      const daysFromStart = leaveEnd.diff(startDate, "day");
      if (daysFromStart > maxDaysNeeded) maxDaysNeeded = daysFromStart;
    });
    return maxDaysNeeded;
  }, [visibleLeaves, startDate, daysCount]);

  // --- 3. DEFINE WIDTH AND DAYS ARRAY ---
  const gridTotalWidth = extendedDaysCount * CELL_WIDTH;

  const days = useMemo(
    () => getDaysArray(startDate, extendedDaysCount),
    [startDate, extendedDaysCount],
  );

  // --- 4. PREPARE HEADER DATA ---
  const holidays = useMemo(() => {
    const years = Array.from(new Set(days.map((d) => d.year())));
    let all: Record<string, any> = {};
    years.forEach((y) => {
      all = { ...all, ...getSwedishHolidays(y) };
    });
    return all;
  }, [days]);

  const isRedDay = useCallback(
    (day: Dayjs) => {
      const dateStr = day.format("YYYY-MM-DD");
      return day.day() === 0 || day.day() === 6 || holidays[dateStr]?.isRedDay;
    },
    [holidays],
  );

  const monthBlocks = useMemo(() => {
    const months: { key: string; days: Dayjs[]; label: string }[] = [];
    const uniqueMonths = Array.from(
      new Set(days.map((d) => d.format("YYYY-MM"))),
    );
    uniqueMonths.forEach((monthKey) => {
      const mDays = days.filter((d) => d.format("YYYY-MM") === monthKey);
      months.push({
        key: monthKey,
        days: mDays,
        label: mDays[0].format("MMMM YYYY"),
      });
    });
    return months;
  }, [days]);

  const weekBlocks = useMemo(() => {
    const weeks: { key: string; days: Dayjs[]; label: string }[] = [];
    const uniqueWeeks = Array.from(
      new Set(days.map((d) => `${d.isoWeekYear()}-${d.isoWeek()}`)),
    );
    uniqueWeeks.forEach((weekKey) => {
      const wDays = days.filter(
        (d) => `${d.isoWeekYear()}-${d.isoWeek()}` === weekKey,
      );
      weeks.push({
        key: weekKey,
        days: wDays,
        label: `v.${wDays[0].isoWeek()}`,
      });
    });
    return weeks;
  }, [days]);

  // --- 5. FINALLY, DEFINE THE HEADER UI (Now gridTotalWidth is ready) ---
  const MemoizedHeader = useMemo(
    () => (
      <Box sx={{ bgcolor: "white", width: gridTotalWidth }}>
        <Box
          sx={{ display: "flex", height: 40, borderBottom: "1px solid #eee" }}
        >
          {monthBlocks.map((m) => (
            <Box
              key={m.key}
              sx={{
                width: m.days.length * CELL_WIDTH,
                borderRight: "1px solid rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                pl: 1,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  whiteSpace: "nowrap",
                }}
              >
                {m.label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box
          sx={{
            display: "flex",
            height: 25,
            bgcolor: "#fafafa",
            borderBottom: "1px solid #eee",
          }}
        >
          {weekBlocks.map((w) => (
            <Box
              key={w.key}
              sx={{
                width: w.days.length * CELL_WIDTH,
                borderRight: "1px solid rgba(0,0,0,0.05)",
                pl: 1,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "text.secondary",
                  lineHeight: "25px",
                }}
              >
                {w.label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", height: 40 }}>
          {days.map((day) => {
            const isRed = isRedDay(day);
            return (
              <Box
                key={day.format("YYYY-MM-DD")}
                sx={{
                  width: CELL_WIDTH,
                  minWidth: CELL_WIDTH,
                  textAlign: "center",
                  pt: 0.5,
                  borderRight: "1px solid #eee",
                  borderBottom: "1px solid #ddd",
                  bgcolor: day.isSame(new Date(), "day")
                    ? "#fff9c4"
                    : isRed
                      ? "rgba(244, 67, 54, 0.15)"
                      : "white",
                  color: isRed ? "error.main" : "text.primary",
                }}
              >
                <Typography
                  sx={{ fontSize: "0.6rem", fontWeight: isRed ? 700 : 500 }}
                >
                  {day.format("ddd").toUpperCase()}
                </Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {day.format("D")}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    ),
    [days, monthBlocks, weekBlocks, isRedDay, gridTotalWidth],
  );

  const handleGroupRowMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;

    isDown.current = true;
    // Get the initial click position and current scroll position
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;

    // Change cursor to grabbing globally while dragging
    document.body.style.cursor = "grabbing";
  };

  const handleGroupRowMouseLeaveOrUp = () => {
    isDown.current = false;
    document.body.style.cursor = "default";
  };

  const handleGroupRowMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    e.preventDefault();

    // Calculate how far we have moved
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5; // Multiply by 1.5 for faster scrolling

    // Update the scroll container
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };
  // --- END OF NEW CODE ---
  useEffect(() => {
    // If the parent "block past days" is unchecked,
    // the child "disable deletion" must also be unchecked.
    if (!blockPastDays) {
      setDisableDeletion(false);
    }
  }, [blockPastDays]); // Re-run this effect only when blockPastDays changes
  // --- HELPERS ---
  // const days = useMemo(
  //   () => getDaysArray(startDate, daysCount),
  //   [startDate, daysCount],
  // );
  // 3. Update the 'days' array to use the extended count

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const startAutoScroll = () => {
    if (scrollRequestRef.current) return;
    const animate = () => {
      if (!isSelectingRef.current || !scrollContainerRef.current)
        return stopAutoScroll();

      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const threshold = 80;
      const speed = 15;
      let delta = 0;

      if (lastPointerXRef.current > rect.right - threshold) delta = speed;
      else if (lastPointerXRef.current < rect.left + threshold) delta = -speed;

      if (delta !== 0) {
        container.scrollLeft += delta;
        // Uppdatera DOM direkt för att undvika lagg
        if (selectionBoxRef.current) {
          const absoluteX =
            lastPointerXRef.current - rect.left + container.scrollLeft;
          const snappedX = Math.floor(absoluteX / CELL_WIDTH) * CELL_WIDTH;
          const left = Math.min(startXRef.current, snappedX);
          const width = Math.abs(snappedX - startXRef.current) + CELL_WIDTH;

          selectionBoxRef.current.style.left = `${left}px`;
          selectionBoxRef.current.style.width = `${width}px`;
        }
      }
      scrollRequestRef.current = requestAnimationFrame(animate);
    };
    scrollRequestRef.current = requestAnimationFrame(animate);
  };

  const stopAutoScroll = () => {
    if (scrollRequestRef.current) {
      cancelAnimationFrame(scrollRequestRef.current);
      scrollRequestRef.current = null;
    }
  };
  const handleDeleteResource = async (groupId: string, resId: string) => {
    if (resId && groupId) {
      // API DELETE
      await appServicesStatic.resources.removeOne(resId);

      // Uppdatera sidebaren genom att hämta de nya grupp-strukturerna
      await appServicesStatic.groups.loadAll();
    }
  };
  // --- GROUP ACTIONS ---

  const handleDeleteGroup = async (selectedGroupId: string) => {
    if (selectedGroupId) {
      // API DELETE
      await appServicesStatic.groups.removeOne(selectedGroupId);
    }
  };

  const handleSaveAbsenceType = async (
    label: string,
    color: string,
    idToUpdate?: string | null,
  ) => {
    if (!label.trim()) return;

    if (idToUpdate) {
      // UPDATE: Nu tillåter TypeScript att du skickar med 'id'
      await appServicesStatic.absenceTypes.updateOne(idToUpdate, {
        id: idToUpdate, // Viktigt för din C# Controller check
        label,
        color,
      });
    } else {
      // CREATE: Här behövs inget ID, backend genererar ett nytt GUID
      await appServicesStatic.absenceTypes.createOne({
        label,
        color,
      });
    }
  };
  const handleSaveGroup = async (name: string, idToUpdate?: string | null) => {
    if (!name.trim()) return;

    if (idToUpdate) {
      await appServicesStatic.groups.updateOne(idToUpdate, {
        id: idToUpdate,
        name,
      });
    } else {
      // Här skapas gruppen. Vi väntar tills den är sparad.
      await appServicesStatic.groups.createOne({ name });
    }

    // Eftersom vi inte längre använder optimistiska uppdateringar,
    // kör vi en extra reload för att säkerställa att allt är synkat.
    await appServicesStatic.groups.loadAll();
  };
  const handleSaveResource = async (
    name: string,
    targetGroupId: string,
    resourceIdToUpdate: string | null,
  ) => {
    if (!name.trim() || !targetGroupId) return;

    // Skapa objektet som ska skickas
    const resourceData = {
      name: name,
      groupId: targetGroupId, // Detta måste vara GUID:et från databasen
    };

    if (resourceIdToUpdate) {
      await appServicesStatic.resources.updateOne(resourceIdToUpdate, {
        id: resourceIdToUpdate,
        ...resourceData,
      });
    } else {
      await appServicesStatic.resources.createOne(resourceData);
    }

    // Ladda om grupperna för att visa den nya anställda direkt
    await appServicesStatic.groups.loadAll();
  };

  // --- TIMELINE LOGIC ---
  useEffect(() => {
    if (hasInitialScrolled.current) return;

    const performJump = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const todayOffset = getDateOffset(
          dayjs().format("YYYY-MM-DD"),
          startDate,
        );

        // Attempt to scroll
        container.scrollLeft = todayOffset;

        // Verify if scroll actually worked (if offset is > 0, scrollLeft should no longer be 0)
        if (container.scrollLeft > 0 || todayOffset === 0) {
          hasInitialScrolled.current = true;
          // Small delay before showing UI to ensure the "snap" is finished
          setTimeout(() => setIsReady(true), 50);
          clearInterval(jumpInterval);
        }
      }
    };

    // Try every 50ms until the scroll successfully moves
    const jumpInterval = setInterval(performJump, 50);

    // Safety: If it hasn't worked in 2 seconds, just show the page anyway
    const safetyTimer = setTimeout(() => {
      clearInterval(jumpInterval);
      setIsReady(true);
    }, 2000);

    return () => {
      clearInterval(jumpInterval);
      clearTimeout(safetyTimer);
    };
  }, []); // Only runs on Mount

  // Part 2: Infinite Scroll Offset (Anchor the view when loading past dates)
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !hasInitialScrolled.current) return;

    if (!startDate.isSame(previousStartDate.current)) {
      if (isJumpingRef.current) {
        previousStartDate.current = startDate;
        isJumpingRef.current = false;
        return;
      }

      const diffDays = previousStartDate.current.diff(startDate, "day");
      if (diffDays > 0) {
        container.scrollLeft += diffDays * CELL_WIDTH;
      }
      previousStartDate.current = startDate;
      isLoadingRef.current = false;
    }
  }, [startDate]);
  // 1. Calculate the width of the disabled area
  const disabledOverlayWidth = useMemo(() => {
    const offset = getDateOffset(today.format("YYYY-MM-DD"), startDate);
    return Math.max(0, offset); // Ensure width is not negative
  }, [startDate]);
  useEffect(() => {
    const updateDaysCount = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.offsetWidth;
        // Beräkna hur många dagar som syns på skärmen just nu
        const visibleDays = Math.ceil(containerWidth / CELL_WIDTH);

        // Vi sätter daysCount till synliga dagar + ca 60 dagar buffert (2 månader extra)
        // så att det inte blir tomt när man scrollar lite.
        const optimalDays = visibleDays + 60;

        setDaysCount(optimalDays);
      }
    };

    // Kör direkt vid start
    updateDaysCount();

    // Lyssna på om användaren ändrar storlek på webbläsarfönstret
    window.addEventListener("resize", updateDaysCount);
    return () => window.removeEventListener("resize", updateDaysCount);
  }, []);
  const handleTimelineScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    if (scrollLeft + clientWidth > scrollWidth - 500) {
      isLoadingRef.current = true;
      setDaysCount((prev) => prev + 30);
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }
    if (scrollLeft < 500) {
      isLoadingRef.current = true;
      setStartDate((prev) => prev.subtract(30, "day"));
      setDaysCount((prev) => prev + 30);
    }
  }, []);

  const jumpToDate = (date: Dayjs | null) => {
    if (!date) return;

    // Sätt pickerDate först
    setPickerDate(date);

    // Använd requestAnimationFrame för att scrolla mjukt utan att blockera tråden
    requestAnimationFrame(() => {
      isJumpingRef.current = true;
      const target = date.startOf("day");
      const newStart = target.subtract(30, "days");
      setStartDate(newStart);

      setTimeout(() => {
        if (scrollContainerRef.current) {
          const offset = getDateOffset(target.format("YYYY-MM-DD"), newStart);
          scrollContainerRef.current.scrollLeft = offset - 100;
        }
      }, 0);
    });
  };

  // --- BLOCK CREATION LOGIC (UNCHANGED FROM YOUR ORIGINAL) ---
  const handleGridPointerDown = (e: React.PointerEvent, rowId: string) => {
    // --- Start with all exit conditions ---
    if (e.button !== 0 || isDragging || isTooltipOpen) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    // --- Perform calculations once ---
    const rect = container.getBoundingClientRect();
    const absoluteX = e.clientX - rect.left + container.scrollLeft;
    const dayIndex = Math.floor(absoluteX / CELL_WIDTH);
    const clickedDate = startDate.add(dayIndex, "day");

    // --- Perform the validation check ---
    if (blockPastDays && clickedDate.isBefore(today)) {
      return; // This completely stops the selection from starting
    }

    // --- If validation passes, proceed with the selection logic ---
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    isSelectingRef.current = true;
    lastPointerXRef.current = e.clientX;

    // Snappa direkt till rutans start för att undvika "random" hopp
    const snappedStartX = Math.floor(absoluteX / CELL_WIDTH) * CELL_WIDTH;
    startXRef.current = snappedStartX;

    setSelection({
      isSelecting: true,
      rowId,
      startX: snappedStartX,
      currentX: snappedStartX,
      startIndex: Math.floor(snappedStartX / CELL_WIDTH),
    });

    startAutoScroll();
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;
    lastPointerXRef.current = e.clientX;

    const container = scrollContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const absoluteX = e.clientX - rect.left + container.scrollLeft;

    if (selectionBoxRef.current) {
      // Use the raw, un-snapped mouse position for the visual update.
      const currentX = absoluteX;

      // Calculate left and width based on the direction of the drag.
      const left = Math.min(startXRef.current, currentX);
      const width = Math.abs(currentX - startXRef.current);

      // Update the style directly for a smooth, pixel-perfect movement.
      selectionBoxRef.current.style.left = `${left}px`;
      selectionBoxRef.current.style.width = `${width}px`;
    }
  };
  // 1. Define the Save Handler
  const handleSaveLeave = async (
    formData: { typeId: string; startDate: Dayjs; duration: number },
    leaveIdToUpdate: string | null,
    targetRowId: string | null,
  ) => {
    const type = absenceTypes.find((t) => t.id === formData.typeId);
    if (!type || !targetRowId) return;

    const entry: LeaveItem = {
      id: leaveIdToUpdate || "l-" + Date.now(),
      rowId: targetRowId,
      name: type.label,
      startDate: formData.startDate.format("YYYY-MM-DD"),
      durationDays: formData.duration,
      color: type.color,
      absenceTypeId: type.id, // <--- MAKE SURE THIS IS SENT
    };

    // Validation: Collision
    const otherLeaves = leaves.filter((l) => l.id !== leaveIdToUpdate);
    if (checkCollision(otherLeaves, entry)) {
      toast("Krockar med annan frånvaro!", "error");
      return;
    }

    if (leaveIdToUpdate) {
      // UPDATE Logic
      await appServicesStatic.leaves.updateOne(leaveIdToUpdate, entry);
    } else {
      // CREATE Logic
      await appServicesStatic.leaves.createOne(entry);
    }
  };
  const handleGridPointerUp = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;
    stopAutoScroll();

    const rowId = selection.rowId; // Capture the row ID immediately
    const container = scrollContainerRef.current;
    if (!container || !rowId) return;

    const rect = container.getBoundingClientRect();
    const finalAbsoluteX = e.clientX - rect.left + container.scrollLeft;
    const snappedFinalX = Math.floor(finalAbsoluteX / CELL_WIDTH) * CELL_WIDTH;

    const minX = Math.min(startXRef.current, snappedFinalX);
    const maxX = Math.max(startXRef.current, snappedFinalX);
    const startIdx = Math.round(minX / CELL_WIDTH);
    const endIdx = Math.round(maxX / CELL_WIDTH);

    const duration = endIdx - startIdx + 1;
    const finalStartDate = startDate.add(startIdx, "day");
    if (duration > 0 && rowId) {
      // Call the new trigger
      handleDialogAbsenceTrigger(undefined, rowId, finalStartDate, duration);
    }
    setSelection({
      isSelecting: false,
      rowId: null,
      startX: 0,
      currentX: 0,
      startIndex: 0,
    });

    if (duration > 0) {
      // Open the global dialog
      dialog.open("absence", {
        title: "Registrera frånvaro",
        mode: "create",
        data: {
          startDate: finalStartDate,
          duration: duration,
          typeId: absenceTypes[0]?.id || "vac",
        },
        absenceTypes,
        blockPastDays,
        onSave: (formData) => {
          handleSaveLeave(formData, null, rowId);
          dialog.close();
        },
        onClose: () => {
          dialog.close();
        },
        today,
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    dragStartTimeRef.current = startDate;
    const item = leaves.find((l) => l.id === event.active.id);
    if (item) setActiveLeave(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveLeave(null);
    const { active, delta } = event;

    // FIX: Identify the correct scale (Timeline = 45, Year = 5)
    const currentCellWidth = viewMode === "timeline" ? CELL_WIDTH : 5;

    // Calculate moved days using the view-specific scale
    const visualMovedDays = Math.round(delta.x / currentCellWidth);

    // In Year Overview, the timeline start is static (Jan 1st), so daysGridMoved is 0
    const daysGridMoved =
      viewMode === "timeline"
        ? startDate.diff(dragStartTimeRef.current, "day")
        : 0;

    const finalDaysDiff = visualMovedDays + daysGridMoved;

    if (finalDaysDiff !== 0) {
      const item = leaves.find((l) => l.id === active.id);
      if (item) {
        const newStartDate = dayjs(item.startDate)
          .add(finalDaysDiff, "day")
          .format("YYYY-MM-DD");

        // Validation and API call
        if (blockPastDays && dayjs(newStartDate).isBefore(today)) {
          toast("Du kan inte flytta till passerade datum", "error");
          return;
        }

        const updatedItem = { ...item, startDate: newStartDate };
        if (!checkCollision(leaves, updatedItem)) {
          await appServicesStatic.leaves.updateOne(item.id, updatedItem);
        }
      }
    }
  };
  // 2. Ta bort en ledighetstyp
  const handleDeleteAbsenceType = async (idToDelete?: string | null) => {
    const id = idToDelete || selectedTypeId;
    if (!id) return;

    await appServicesStatic.absenceTypes.removeOne(id);
    setSelectedTypeId(null);
  };
  const handleLeaveResizeEnd = async (
    id: string,
    newDuration: number,
    daysShifted: number,
  ) => {
    const item = leaves.find((l) => l.id === id);
    if (!item) return;

    const newStartDate = dayjs(item.startDate)
      .add(daysShifted, "day")
      .format("YYYY-MM-DD");

    // --- VALIDATION ---
    if (blockPastDays && dayjs(newStartDate).isBefore(today)) {
      toast(
        "Du kan inte ändra storlek på en ledighet till ett datum som redan har passerat.",
        "error",
      );
      return;
    }

    const updatedItem = {
      ...item,
      durationDays: newDuration,
      startDate: newStartDate,
    };

    // --- COLLISION CHECK & API CALL ---
    if (checkCollision(leaves, updatedItem)) {
      toast("Krockar med annan frånvaro!", "error");
      return;
    }

    // REPLACE setLeaves with API Call
    await appServicesStatic.leaves.updateOne(id, updatedItem);
  };
  const handleLeaveEdit = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    if (leave) {
      handleDialogAbsenceTrigger(leave); // Passing the leave object = Edit mode
    }
  };
  const handleLeaveDelete = async (id: string) => {
    if (disableDeletion) {
      toast("Borttagning är inaktiverad i inställningarna.", "error");
      return;
    }
    await appServicesStatic.leaves.removeOne(id);
  };

  // -----------Dialog---------------------
  const openConfig = () => {
    dialog.open("config", {
      title: "Konfiguration",
      blockPastDays,
      disableDeletion,
      onUpdate: (key, value) => {
        if (key === "blockPastDays") setBlockPastDays(value);
        if (key === "disableDeletion") setDisableDeletion(value);
      },
    });
  };

  const handleDialogGroupTrigger = (groupToEdit?: Group) => {
    const isEditing = !!groupToEdit;

    dialog.open("group", {
      title: isEditing ? "Redigera grupp" : "Skapa ny grupp",
      isEditMode: isEditing, // Nu klagar inte TS längre!
      initialName: isEditing ? groupToEdit.name : "",
      onSave: (name) => {
        handleSaveGroup(name, isEditing ? groupToEdit.id : null);
        dialog.close();
      },
      // Skicka med onDelete funktionen
      onDelete: isEditing
        ? async () => {
            if (groupToEdit?.id) {
              await appServicesStatic.groups.removeOne(groupToEdit.id);
              dialog.close();
            }
          }
        : undefined,
      onClose: () => {
        dialog.close();
      },
    });
  };
  const handleDialogAbsenceTypeTrigger = (typeToEdit?: {
    id: string;
    label: string;
    color: string;
  }) => {
    const isEditing = !!typeToEdit;

    dialog.open("absenceType", {
      title: isEditing ? "Redigera frånvarotyp" : "Skapa ny frånvarotyp",
      isEditMode: isEditing,
      typeId: isEditing ? typeToEdit.id : undefined, // <--- DETTA ÄR NYCKELN!
      initialLabel: isEditing ? typeToEdit.label : "",
      initialColor: isEditing ? typeToEdit.color : undefined,
      absenceTypes: absenceTypes, // Skicka med hela listan från API/Store

      onSave: (label, color) => {
        // Pass the specific ID if editing, or null if creating
        handleSaveAbsenceType(label, color, isEditing ? typeToEdit.id : null);
        dialog.close();
      },

      // If editing, provide the delete functionality
      onDelete: isEditing
        ? () => {
            handleDeleteAbsenceType(typeToEdit.id);
            dialog.close();
          }
        : undefined,

      onClose: () => {
        setSelectedTypeId(null);
        dialog.close();
      },
    });
  };
  const handleDialogAbsenceTrigger = (
    leaveToEdit?: LeaveItem,
    rowId?: string,
    startDate?: Dayjs,
    duration?: number,
  ) => {
    const isEditing = !!leaveToEdit;

    // If editing, we use the leave's rowId. If creating, we use the rowId passed from the grid.
    const targetRowId = isEditing ? leaveToEdit.rowId : rowId;

    dialog.open("absence", {
      title: isEditing ? "Redigera frånvaro" : "Registrera frånvaro",
      mode: isEditing ? "edit" : "create",
      data: isEditing
        ? {
            // EDIT MODE INITIAL DATA
            startDate: dayjs(leaveToEdit.startDate),
            duration: leaveToEdit.durationDays,
            typeId:
              absenceTypes.find((t) => t.color === leaveToEdit.color)?.id ||
              "vac",
          }
        : {
            // CREATE MODE INITIAL DATA (from grid selection)
            startDate: startDate || dayjs(),
            duration: duration || 1,
            typeId: absenceTypes[0]?.id || "vac",
          },
      absenceTypes,
      blockPastDays,
      today,

      onSave: (formData) => {
        // formData comes from the AbsenceForm (typeId, startDate, duration)
        handleSaveLeave(
          formData,
          isEditing ? leaveToEdit.id : null,
          targetRowId ? targetRowId : null,
        );
        dialog.close();
      },
      onClose: () => dialog.close(),
    });
  };
  const handleDialogResourceTrigger = (
    resourceToEdit?: { id: string; name: string },
    currentGroupId?: string,
  ) => {
    const isEditing = !!resourceToEdit;

    dialog.open("resource", {
      title: isEditing ? "Redigera anställd" : "Lägg till anställd",
      initialName: isEditing ? resourceToEdit.name : "",
      initialGroupId: currentGroupId, // The group they currently belong to
      groups, // Pass the list of groups so the user can change it

      onSave: (name, targetGroupId) => {
        // Pass the specific resource ID if editing, or null if creating
        handleSaveResource(
          name,
          targetGroupId,
          isEditing ? resourceToEdit.id : null,
        );
        dialog.close();
      },
      onClose: () => {
        dialog.close();
      },
    });
  };
  const handleDialogDatabaseSystemTrigger = () => {
    dialog.open("databaseSystem", {
      title: "Databassystem",
      onClose: () => {
        // Cleanup: Clear any selected IDs just like in your resource example

        dialog.close();
      },
    });
  };

  const handleYearScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Infinite scroll: Load more days when hitting the right edge
    if (scrollLeft + clientWidth > scrollWidth - 500) {
      isLoadingRef.current = true;
      setDaysCount((prev) => prev + 30);
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
    }

    // Infinite scroll: Load more days when hitting the left edge
    if (scrollLeft < 500) {
      isLoadingRef.current = true;
      setStartDate((prev) => prev.subtract(30, "day"));
      setDaysCount((prev) => prev + 30);
    }
  }, [startDate, daysCount]);
  // --- ADD THIS LOGIC TO TIMELINE.TSX ---
  return (
    <Box
      style={{ opacity: isReady ? 1 : 0 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* 1. APP BAR */}
      <TimelineHeader
        absenceTypes={absenceTypes}
        pickerDate={pickerDate}
        isDatePickerOpen={isDatePickerOpen}
        datePickerAnchorRef={
          datePickerAnchorRef as React.RefObject<HTMLButtonElement>
        }
        onAbsenceTypeClick={handleDialogAbsenceTypeTrigger}
        onPrevMonth={() => jumpToDate(pickerDate.subtract(1, "month"))}
        onNextMonth={() => jumpToDate(pickerDate.add(1, "month"))}
        onOpenDatePicker={() => setIsDatePickerOpen(true)}
        onCloseDatePicker={() => setIsDatePickerOpen(false)}
        onDateChange={(newDate) => jumpToDate(newDate)}
      />

      {/* 2. MAIN CONTENT AREA */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* SIDEBAR - Moved OUTSIDE the condition so it stays visible in both modes */}
        <TimelineSidebar
          groups={groups}
          sidebarMode={sidebarMode}
          collapsedGroups={collapsedGroups}
          disableDeletion={disableDeletion}
          toggleGroup={toggleGroup}
          toggleSidebar={toggleSidebar}
          openConfig={openConfig}
          handleDeleteResource={handleDeleteResource}
          handleDeleteGroup={handleDeleteGroup}
          handleDialogGroupTrigger={handleDialogGroupTrigger}
          handleDialogAbsenceTypeTrigger={handleDialogAbsenceTypeTrigger}
          handleDialogResourceTrigger={handleDialogResourceTrigger}
          handleDialogDatabaseSystemTrigger={handleDialogDatabaseSystemTrigger}
        />

        {/* SWAPPABLE GRID AREA */}
        {viewMode === "timeline" ? (
          <BaseDndGrid
            ref={scrollContainerRef}
            // 1. DATA & UI SCALE
            groups={groups}
            leaves={visibleLeaves}
            collapsedGroups={collapsedGroups}
            activeLeave={activeLeave}
            header={MemoizedHeader}
            cellWidth={CELL_WIDTH} // 45px
            rowHeight={35}
            // 2. COORDINATE LOGIC
            leftOffsetCalc={(l) => getDateOffset(l.startDate, startDate)}
            // 3. EVENT HANDLERS
            onScroll={handleTimelineScroll}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onGridPointerDown={handleGridPointerDown}
            onGridPointerMove={handleGridPointerMove}
            onGridPointerUp={handleGridPointerUp}
            onLeaveEdit={handleLeaveEdit}
            onLeaveDelete={handleLeaveDelete}
            onLeaveResizeEnd={handleLeaveResizeEnd}
            onGroupMouseDown={handleGroupRowMouseDown}
            onGroupMouseMove={handleGroupRowMouseMove}
            onGroupMouseUp={handleGroupRowMouseLeaveOrUp}
            totalWidth={gridTotalWidth} // Use the new dynamic width
            // 4. SETTINGS
            disableDeletion={disableDeletion}
            blockPastDays={blockPastDays}
            // 5. INJECT TIMELINE-SPECIFIC UI
            renderBackground={() => (
              <>
                <PastDaysOverlay
                  width={disabledOverlayWidth}
                  isVisible={blockPastDays}
                />
                {/* Red days background */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 0,
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
                            height: "100%",
                            bgcolor: "rgba(244, 67, 54, 0.04)",
                            borderRight: "1px solid rgba(0, 0, 0, 0.02)",
                          }}
                        />
                      ),
                  )}
                </Box>
              </>
            )}
            // Selection box logic for creating new absences
            renderSelectionBox={(resId) =>
              selection.isSelecting &&
              selection.rowId === resId && (
                <Box
                  ref={selectionBoxRef}
                  style={{ left: selection.startX, width: CELL_WIDTH }}
                  sx={{
                    position: "absolute",
                    top: 5,
                    height: 35 - 10,
                    bgcolor: alpha("#1976d2", 0.15),
                    border: "2px dashed #1976d2",
                    borderRadius: 1,
                    zIndex: 10,
                    pointerEvents: "none",
                  }}
                />
              )
            }
          />
        ) : (
          <YearOverview
            groups={groups}
            leaves={leaves}
            collapsedGroups={collapsedGroups}
            absenceTypes={absenceTypes}
            activeLeave={activeLeave}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onLeaveEdit={handleLeaveEdit}
            onLeaveDelete={handleLeaveDelete}
            onLeaveResizeEnd={handleLeaveResizeEnd}
            disableDeletion={disableDeletion}
            blockPastDays={blockPastDays}
          />
        )}
      </Box>
    </Box>
  );
};
