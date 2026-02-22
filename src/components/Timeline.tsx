import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
} from "react";
import { Box, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CELL_WIDTH } from "../utils";
import { useSidebarMode, useUIActions } from "../services/stores/uiStore";
import type { Employee, Absence, Team, TeamWithEmployees } from "../types";
import { checkCollision, getDateOffset, getDaysArray } from "../utils/Helper";
import { toast } from "../services/stores/globalSnackbar";
import { dialog } from "../services/dialog/dialogStore";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineSidebar } from "./TimelineSidebar";
import { TimelineDndContext } from "./TimelineDndContext";
import IconButton from "@mui/material/IconButton";
import {
  useTeamMutation,
  useEmployeeMutation,
  useAbsenceCategoryMutation,
  useTeams,
  useAbsenceCategories,
  useEmployees,
} from "../services/hooks/useData";
import { absence } from "../services/stores/absenceDataStore";
import TimelineFooter from "./TimelineFooter";
import { getSwedishHolidays } from "../utils/holidayHelper";
import { ProTooltip } from "./ProTooltip";

const today = dayjs().startOf("day"); // Normalize to the beginning of the day

export const Timeline = () => {
  // 1. Hämta ENDAST från Store/API
  useEffect(() => {
    // Load leaves on mount
    absence.loadAll();
  }, []); // Load leaves on mount
  const absenceDetails = absence.useItems();
  const sidebarMode = useSidebarMode();

  // TanStack Query Mutation Hooks
  const { createTeam, updateTeam, deleteTeam } = useTeamMutation();
  const {
    createEmployee: createResource,
    updateEmployee: updateResource,
    deleteEmployee: deleteResource,
  } = useEmployeeMutation();
  const {
    createAbsenceCategory: createAbsenceType,
    updateAbsenceCategory: updateAbsenceType,
    deleteAbsenceCategory: deleteAbsenceType,
  } = useAbsenceCategoryMutation();
  const { data: groups = [] } = useTeams();
  const { data: absenceTypes = [] } = useAbsenceCategories();
  const { data: employees } = useEmployees();

  const teamsWithEmployees: TeamWithEmployees[] = useMemo(() => {
    return groups.map((team) => ({
      ...team,
      employees: employees?.filter((e) => e.teamId === team.id) ?? [],
    }));
  }, [groups, employees]);

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

  const [activeLeave, setActiveLeave] = useState<Absence | null>(null);
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
  const days = useMemo(
    () => getDaysArray(startDate, daysCount),
    [startDate, daysCount],
  );

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
      await deleteResource(resId);
    }
  };
  // --- GROUP ACTIONS ---

  const handleDeleteGroup = async (selectedGroupId: string) => {
    if (selectedGroupId) {
      await deleteTeam(selectedGroupId);
    }
  };

  const handleSaveAbsenceType = async (
    label: string,
    color: string,
    idToUpdate?: string | null,
  ) => {
    if (!label.trim()) return;

    if (idToUpdate) {
      await updateAbsenceType(idToUpdate, label, color);
    } else {
      await createAbsenceType(label, color);
    }
  };
  const handleSaveGroup = async (name: string, idToUpdate?: string | null) => {
    if (!name.trim()) return;

    if (idToUpdate) {
      await updateTeam(idToUpdate, name);
    } else {
      await createTeam(name);
    }
  };
  const handleSaveResource = async (
    name: string,
    targetGroupId: string,
    empIdToUpdate: string | null,
  ) => {
    if (!name.trim() || !targetGroupId) return;

    if (empIdToUpdate) {
      await updateResource(empIdToUpdate, name, targetGroupId);
    } else {
      await createResource(name, targetGroupId);
    }
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

  const disabledOverlayWidth = useMemo(() => {
    const offset = getDateOffset(today.format("YYYY-MM-DD"), startDate);
    return Math.max(0, offset);
  }, [startDate]);
  useEffect(() => {
    const updateDaysCount = () => {
      if (scrollContainerRef.current) {
        const containerWidth = scrollContainerRef.current.offsetWidth;
        const visibleDays = Math.ceil(containerWidth / CELL_WIDTH);
        const optimalDays = visibleDays + 60;

        setDaysCount(optimalDays);
      }
    };

    updateDaysCount();
    window.addEventListener("resize", updateDaysCount);
    return () => window.removeEventListener("resize", updateDaysCount);
  }, []);
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    // Extend to the right when approaching the end
    if (scrollLeft + clientWidth > scrollWidth - 200) {
      isLoadingRef.current = true;
      setDaysCount((prev) => prev + 30);
      requestAnimationFrame(() => {
        isLoadingRef.current = false;
      });
    }

    // Extend to the left when approaching the start
    if (scrollLeft < 200) {
      isLoadingRef.current = true;
      setStartDate((prev) => prev.subtract(30, "day"));
      setDaysCount((prev) => prev + 30);
      requestAnimationFrame(() => {
        isLoadingRef.current = false;
      });
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
    if (e.button !== 0 || isDragging || isTooltipOpen) return;

    // 1. Get the bounding box of the ACTUAL row being clicked
    const rect = e.currentTarget.getBoundingClientRect();

    // 2. Calculate X relative to the start of the grid (not the sidebar)
    const xInGrid = e.clientX - rect.left;

    // 3. Determine the day index
    const dayIndex = Math.floor(xInGrid / CELL_WIDTH);
    const clickedDate = startDate.add(dayIndex, "day");

    if (blockPastDays && clickedDate.isBefore(today)) {
      return;
    }

    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    isSelectingRef.current = true;
    lastPointerXRef.current = e.clientX;

    // 4. Calculate the snapped X position relative to the grid start
    const snappedStartX = dayIndex * CELL_WIDTH;
    startXRef.current = snappedStartX;

    setSelection({
      isSelecting: true,
      rowId,
      startX: snappedStartX,
      currentX: snappedStartX,
      startIndex: dayIndex,
    });

    startAutoScroll();
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;
    lastPointerXRef.current = e.clientX;

    // Get the row's position again to stay accurate
    const rect = e.currentTarget.getBoundingClientRect();
    const xInGrid = e.clientX - rect.left;

    if (selectionBoxRef.current) {
      const currentX = xInGrid;
      const left = Math.min(startXRef.current, currentX);
      const width = Math.abs(currentX - startXRef.current);

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

    const entry: Absence = {
      id: leaveIdToUpdate || "l-" + Date.now(),
      employeeId: targetRowId,
      startDate: formData.startDate.format("YYYY-MM-DD"),
      durationDays: formData.duration,
      color: type.color,
      absenceCategoryId: type.id, // <--- MAKE SURE THIS IS SENT
    };

    // Validation: Collision
    const otherLeaves = absenceDetails.filter((l) => l.id !== leaveIdToUpdate);
    if (checkCollision(otherLeaves, entry)) {
      toast("Krockar med annan frånvaro!", "error");
      return;
    }

    if (leaveIdToUpdate) {
      // UPDATE Logic
      await absence.updateOne(leaveIdToUpdate, entry);
    } else {
      // CREATE Logic
      await absence.createOne(entry);
    }
  };
  const handleGridPointerUp = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;
    stopAutoScroll();

    const rowId = selection.rowId;
    const rect = e.currentTarget.getBoundingClientRect();

    // Calculate final position relative to grid
    const xInGrid = e.clientX - rect.left;
    const snappedFinalX = Math.floor(xInGrid / CELL_WIDTH) * CELL_WIDTH;

    const minX = Math.min(startXRef.current, snappedFinalX);
    const maxX = Math.max(startXRef.current, snappedFinalX);

    const startIdx = Math.round(minX / CELL_WIDTH);
    const endIdx = Math.round(maxX / CELL_WIDTH);

    const duration = endIdx - startIdx + 1;
    const finalStartDate = startDate.add(startIdx, "day");

    if (duration > 0 && rowId) {
      handleDialogAbsenceTrigger(undefined, rowId, finalStartDate, duration);
    }

    setSelection({
      isSelecting: false,
      rowId: null,
      startX: 0,
      currentX: 0,
      startIndex: 0,
    });
  };
  const handleDragStart = (event: DragStartEvent) => {
    setIsDragging(true);
    dragStartTimeRef.current = startDate;
    const item = absenceDetails.find((l) => l.id === event.active.id);
    if (item) setActiveLeave(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false);
    setActiveLeave(null);
    const { active, delta } = event;

    const daysGridMoved = startDate.diff(dragStartTimeRef.current, "day");
    const visualMovedDays = Math.round(delta.x / CELL_WIDTH);
    const finalDaysDiff = visualMovedDays + daysGridMoved;

    if (finalDaysDiff !== 0) {
      const item = absenceDetails.find((l) => l.id === active.id);
      if (item) {
        const newStartDate = dayjs(item.startDate)
          .add(finalDaysDiff, "day")
          .format("YYYY-MM-DD");

        // --- VALIDATION ---
        if (blockPastDays && dayjs(newStartDate).isBefore(today)) {
          toast(
            "Du kan inte flytta en ledighet till ett datum som redan har passerat.",
            "error",
          );
          return;
        }

        const updatedItem = { ...item, startDate: newStartDate };

        // --- COLLISION CHECK & API CALL ---
        if (!checkCollision(absenceDetails, updatedItem)) {
          // REPLACE setLeaves with API Call
          await absence.updateOne(item.id, updatedItem);
        }
      }
    }
  };
  const handleDeleteAbsenceType = async (idToDelete?: string | null) => {
    const id = idToDelete || selectedTypeId;
    if (!id) return;

    await deleteAbsenceType(id);
    // Also refresh leaves in case they used this type
    await absence.loadAll();
    setSelectedTypeId(null);
  };
  const handleLeaveResizeEnd = async (
    id: string,
    newDuration: number,
    daysShifted: number,
  ) => {
    const item = absenceDetails.find((l) => l.id === id);
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
    if (checkCollision(absenceDetails, updatedItem)) {
      toast("Krockar med annan frånvaro!", "error");
      return;
    }

    // REPLACE setLeaves with API Call
    await absence.updateOne(id, updatedItem);
  };
  const handleLeaveEdit = (id: string) => {
    const leave = absenceDetails.find((l) => l.id === id);
    if (leave) {
      handleDialogAbsenceTrigger(leave); // Passing the leave object = Edit mode
    }
  };
  const handleLeaveDelete = async (id: string) => {
    if (disableDeletion) {
      toast("Borttagning är inaktiverad i inställningarna.", "error");
      return;
    }
    await absence.removeOne(id);
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

  const handleDialogGroupTrigger = (groupToEdit?: Team) => {
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
              await deleteTeam(groupToEdit.id);

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
    leaveToEdit?: Absence,
    rowId?: string,
    startDate?: Dayjs,
    duration?: number,
  ) => {
    const isEditing = !!leaveToEdit;

    // If editing, we use the leave's rowId. If creating, we use the rowId passed from the grid.
    const targetRowId = isEditing ? leaveToEdit.employeeId : rowId;

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
      groups,

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
  // _______________________________________________________________
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

  const MemoizedHeader = useMemo(() => {
    // Calculate the "left" position where labels should stick.
    // It must match the current width of your sidebar.
    const stickyLeftOffset =
      sidebarMode === "full" ? 200 : sidebarMode === "initials" ? 70 : 0;

    return (
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          bgcolor: "white",
          width: daysCount * CELL_WIDTH,
          borderBottom: "1px solid #ddd",
        }}
      >
        {/* --- 1. Months Row --- */}
        <Box
          sx={{ display: "flex", height: 40, borderBottom: "1px solid #eee" }}
        >
          {monthBlocks.map((m) => (
            <Box
              key={m.key}
              sx={{
                position: "relative", // Needed so the sticky child stays within this block
                width: m.days.length * CELL_WIDTH,
                height: "100%",
                flexShrink: 0,
                borderRight: "1px solid rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  position: "sticky",
                  left: stickyLeftOffset + 8, // Sticks to sidebar edge + 10px padding
                  fontWeight: 700,
                  color: "primary.main",
                  whiteSpace: "nowrap",
                  width: "fit-content",
                  display: "block",
                  lineHeight: "40px",
                }}
              >
                {m.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* --- 2. Weeks Row --- */}
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
                position: "relative", // This block acts as the "boundary" for the sticky label
                width: w.days.length * CELL_WIDTH,
                height: "100%",
                flexShrink: 0,
                borderRight: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: "sticky",
                  left: stickyLeftOffset + 8, // Sticks to sidebar edge + 8px padding
                  fontWeight: 800,
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                  width: "fit-content",
                  display: "block",
                  lineHeight: "25px",
                }}
              >
                {/* Added Year here as well if the user scrolls far */}
                {w.label}{" "}
                {w.days[0].format("YYYY") !== dayjs().format("YYYY")
                  ? w.days[0].format("YYYY")
                  : ""}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* --- 3. Individual Days Row --- */}
        <Box sx={{ display: "flex", height: 40 }}>
          {days.map((day) => {
            const isRed = isRedDay(day);
            return (
              <ProTooltip
                key={day.format("YYYY-MM-DD")}
                title={holidays[day.format("YYYY-MM-DD")]?.name || ""}
              >
                <Box
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
              </ProTooltip>
            );
          })}
        </Box>
      </Box>
    );
  }, [days, monthBlocks, weekBlocks, holidays, sidebarMode]); // Added sidebarMode to dependencies
  return (
    <Box
      style={{ opacity: isReady ? 1 : 0 }}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden", // Prevent body scroll
      }}
    >
      <TimelineHeader
        pickerDate={pickerDate}
        isDatePickerOpen={isDatePickerOpen}
        datePickerAnchorRef={
          datePickerAnchorRef as React.RefObject<HTMLButtonElement>
        }
        groups={teamsWithEmployees}
        sidebarMode={sidebarMode}
        disableDeletion={disableDeletion}
        openConfig={openConfig}
        onOpenDatePicker={() => setIsDatePickerOpen(true)}
        onCloseDatePicker={() => setIsDatePickerOpen(false)}
        onDateChange={(newDate) => jumpToDate(newDate)}
        handleDeleteResource={handleDeleteResource}
        handleDeleteGroup={handleDeleteGroup}
        handleDialogGroupTrigger={handleDialogGroupTrigger}
        handleDialogAbsenceTypeTrigger={handleDialogAbsenceTypeTrigger}
        handleDialogResourceTrigger={handleDialogResourceTrigger}
        handleDialogDatabaseSystemTrigger={handleDialogDatabaseSystemTrigger}
        doseHaveAbsenceTypes={absenceTypes.length > 0}
        onPrevMonth={() => jumpToDate(pickerDate.subtract(1, "month"))}
        onNextMonth={() => jumpToDate(pickerDate.add(1, "month"))}
      />

      {/* MAIN SCROLLER: Handles both vertical and horizontal scroll */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", width: "fit-content", minWidth: "100%" }}>
          {/* SIDEBAR (GLASSMORPHISM) */}
          <TimelineSidebar
            groups={teamsWithEmployees}
            sidebarMode={sidebarMode}
            collapsedGroups={collapsedGroups}
            disableDeletion={disableDeletion}
            toggleGroup={toggleGroup}
            handleDeleteResource={handleDeleteResource}
            handleDeleteGroup={handleDeleteGroup}
            handleDialogGroupTrigger={handleDialogGroupTrigger}
            handleDialogResourceTrigger={handleDialogResourceTrigger}
          />

          <Box sx={{ position: "relative" }}>
            {/* THE STICKY DATES HEADER */}
            {MemoizedHeader}

            {/* THE GRID CONTENT */}
            <TimelineDndContext
              ref={scrollContainerRef}
              onGroupMouseDown={handleGroupRowMouseDown}
              onGroupMouseMove={handleGroupRowMouseMove}
              onGroupMouseUp={handleGroupRowMouseLeaveOrUp}
              days={days} // from useMemo(() => getDaysArray...)
              daysCount={daysCount} // from useState
              startDate={startDate} // from useState
              teams={teamsWithEmployees} // from useState
              absences={absenceDetails} // from useState
              collapsedTeams={collapsedGroups} // from useState
              absenceTypes={absenceTypes} // from useState
              activeAbsenceBlock={activeLeave} // from useState (dnd-kit)
              // 3. SETTINGS PROPS
              blockPastDays={blockPastDays} // from useState
              disabledOverlayWidth={disabledOverlayWidth} // from useMemo
              disableDeletion={disableDeletion} // from useState
              // 4. INTERACTION STATE & REFS
              selection={selection} // from useState (isSelecting, rowId, startX)
              selectionBoxRef={
                selectionBoxRef as React.RefObject<HTMLDivElement>
              } // from useRef
              // 5. EVENT HANDLERS (The functions in your Timeline component)
              onScroll={handleScroll}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onGridPointerDown={handleGridPointerDown}
              onGridPointerMove={handleGridPointerMove}
              onGridPointerUp={handleGridPointerUp}
              onLeaveEdit={handleLeaveEdit}
              onLeaveDelete={handleLeaveDelete}
              onLeaveResizeEnd={handleLeaveResizeEnd}
              onTooltipOpen={() => setIsTooltipOpen(true)}
              onTooltipClose={() => setIsTooltipOpen(false)}
            />
          </Box>
        </Box>
      </Box>

      <TimelineFooter onAbsenceTypeClick={handleDialogAbsenceTypeTrigger} />
    </Box>
  );
};

export default Timeline;
