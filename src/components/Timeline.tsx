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
  Stack,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Menu,
  Collapse,
  Grow,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
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
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MenuIcon from "@mui/icons-material/Menu";
// --- CONFIGURATION ---
const ABSENCE_TYPES = [
  { id: "conf", color: "#1976d2", label: "Konferens" },
  { id: "vac", color: "#2e7d32", label: "Semester" },
  { id: "sick", color: "#d32f2f", label: "Sjuk" },
  { id: "vab", color: "#ed6c02", label: "VAB" },
];

const INITIAL_GROUPS: Group[] = [
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
const animationStyles = `
  @keyframes popIn {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes marchingAnts {
    from { background-position: 0 0, 0 100%, 0 0, 100% 0; }
    to { background-position: 30px 0, -30px 100%, 0 -30px, 100% 30px; }
  }
`;
export const Timeline = () => {
  // --- STATE ---
  const [startDate, setStartDate] = useState(
    dayjs().startOf("day").subtract(30, "days")
  );
  const [daysCount, setDaysCount] = useState(200);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [sidebarMode, setSidebarMode] = useState<
    "full" | "initials" | "hidden"
  >("full");
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  // Interaction States
  const [isDragging, setIsDragging] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(dayjs());
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // Menu & Dialog States
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [resourceMenuAnchor, setResourceMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );
  const [resourceDialogMode, setResourceDialogMode] = useState<
    "create" | "edit"
  >("create");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [absenceTypes, setAbsenceTypes] = useState(ABSENCE_TYPES);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("#9c27b0"); // Startfärg lila

  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);
  const [newResourceName, setNewResourceName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [typeDialogMode, setTypeDialogMode] = useState<"create" | "edit">(
    "create"
  );
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data: {
      id?: string;
      rowId: string;
      startDate: Dayjs;
      duration: number;
      typeId: string;
      name: string;
    };
  }>({
    isOpen: false,
    mode: "create",
    data: {
      rowId: "",
      startDate: dayjs(),
      duration: 1,
      typeId: "vac",
      name: "",
    },
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
  const previousStartDate = useRef(startDate);
  const isLoadingRef = useRef(false);
  const dragStartTimeRef = useRef(startDate);
  const isJumpingRef = useRef(false);
  const isSelectingRef = useRef(false);
  const pointerXRef = useRef(0);
  const [selection, setSelection] = useState({
    isSelecting: false,
    rowId: null as string | null,
    startX: 0,
    currentX: 0,
    startIndex: 0,
  });

  // --- HELPERS ---
  const days = useMemo(
    () => getDaysArray(startDate, daysCount),
    [startDate, daysCount]
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleToggleSidebar = () => {
    if (sidebarMode === "full") setSidebarMode("initials");
    else if (sidebarMode === "initials") setSidebarMode("hidden");
    else setSidebarMode("full");
  };

  const handleResourceMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    groupId: string,
    resId: string
  ) => {
    e.stopPropagation();
    setResourceMenuAnchor(e.currentTarget);
    setSelectedGroupId(groupId); // We need to know which group they belong to
    setSelectedResourceId(resId);
  };

  const handleEditResourceTrigger = () => {
    // Find the resource name to pre-fill the dialog
    const group = groups.find((g) => g.id === selectedGroupId);
    const resource = group?.resources.find((r) => r.id === selectedResourceId);
    if (resource) {
      setNewResourceName(resource.name);
      setResourceDialogMode("edit");
      setIsResourceDialogOpen(true);
    }
    setResourceMenuAnchor(null);
  };

  const handleDeleteResource = () => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === selectedGroupId) {
          return {
            ...g,
            resources: g.resources.filter((r) => r.id !== selectedResourceId),
          };
        }
        return g;
      })
    );
    setResourceMenuAnchor(null);
  };
  // --- GROUP ACTIONS ---
  const handleGroupMenuOpen = (
    e: React.MouseEvent<HTMLElement>,
    groupId: string
  ) => {
    e.stopPropagation();
    setGroupMenuAnchor(e.currentTarget);
    setSelectedGroupId(groupId);
  };
  const handleGroupMenuClose = () => {
    setGroupMenuAnchor(null);
    setSelectedGroupId(null);
  };

  const handleEditGroupTrigger = () => {
    const group = groups.find((g) => g.id === selectedGroupId);
    if (group) {
      setNewGroupName(group.name);
      setIsGroupDialogOpen(true);
    }
    setGroupMenuAnchor(null);
  };

  const handleDeleteGroup = () => {
    if (selectedGroupId) {
      setGroups((prev) => prev.filter((g) => g.id !== selectedGroupId));
      handleGroupMenuClose();
    }
  };
  // --- OLD CODE (Referens) ---
  const handleSaveAbsenceType = () => {
    if (!newTypeLabel.trim()) return;

    // Kontrollera färg (hoppa över kontrollen om vi sparar samma färg på samma objekt)
    const isColorTaken = absenceTypes.some(
      (t) =>
        t.color.toLowerCase() === newTypeColor.toLowerCase() &&
        t.id !== selectedTypeId
    );

    if (isColorTaken) {
      alert("Färgen används redan!");
      return;
    }

    if (typeDialogMode === "edit") {
      setAbsenceTypes((prev) =>
        prev.map((t) =>
          t.id === selectedTypeId
            ? { ...t, label: newTypeLabel, color: newTypeColor }
            : t
        )
      );
    } else {
      const newType = {
        id: "custom-" + Date.now(),
        color: newTypeColor,
        label: newTypeLabel,
      };
      setAbsenceTypes((prev) => [...prev, newType]);
    }

    setIsTypeDialogOpen(false);
    setNewTypeLabel("");
    setSelectedTypeId(null);
  };
  const handleSaveGroup = () => {
    if (!newGroupName.trim()) return;
    if (selectedGroupId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroupId ? { ...g, name: newGroupName } : g
        )
      );
    } else {
      setGroups([
        ...groups,
        { id: "g-" + Date.now(), name: newGroupName, resources: [] },
      ]);
    }
    setNewGroupName("");
    setSelectedGroupId(null);
    setIsGroupDialogOpen(false);
  };
  const handleOpenAddResource = () => {
    setResourceDialogMode("create");
    setNewResourceName("");
    setIsResourceDialogOpen(true);
    setGroupMenuAnchor(null);
  };

  const handleSaveResource = () => {
    if (!newResourceName.trim() || !selectedGroupId) return;

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== selectedGroupId) return g;

        if (resourceDialogMode === "edit") {
          return {
            ...g,
            resources: g.resources.map((r) =>
              r.id === selectedResourceId ? { ...r, name: newResourceName } : r
            ),
          };
        } else {
          return {
            ...g,
            resources: [
              ...g.resources,
              { id: "r-" + Date.now(), name: newResourceName },
            ],
          };
        }
      })
    );

    setIsResourceDialogOpen(false);
    setNewResourceName("");
  };
  // --- TIMELINE LOGIC ---
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
        scrollContainerRef.current.scrollLeft += diffDays * CELL_WIDTH;
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

  // --- BLOCK CREATION LOGIC (UNCHANGED FROM YOUR ORIGINAL) ---
  const handleGridPointerDown = (e: React.PointerEvent, rowId: string) => {
    if (e.button !== 0 || isDragging || isTooltipOpen) return;
    e.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isSelectingRef.current = true;
    pointerXRef.current = e.clientX;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const absoluteX = clientX + container.scrollLeft;
    const dayIndex = Math.floor(absoluteX / CELL_WIDTH);
    const snapX = dayIndex * CELL_WIDTH;
    setSelection({
      isSelecting: true,
      rowId,
      startX: snapX,
      currentX: snapX,
      startIndex: dayIndex,
    });
  };

  const handleGridPointerMove = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;
    pointerXRef.current = e.clientX;
    const container = scrollContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const absoluteX = clientX + container.scrollLeft;
    setSelection((prev) => ({ ...prev, currentX: absoluteX }));
  };

  const handleGridPointerUp = (e: React.PointerEvent) => {
    if (!isSelectingRef.current) return;
    isSelectingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
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
    if (duration > 0) {
      setDialogState({
        isOpen: true,
        mode: "create",
        data: {
          rowId,
          startDate: finalStartDate,
          duration,
          typeId: "vac",
          name: "Semester",
        },
      });
    }
  };
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
      if (item) {
        const newStartDate = dayjs(item.startDate)
          .add(finalDaysDiff, "day")
          .format("YYYY-MM-DD");
        if (!checkCollision(leaves, { ...item, startDate: newStartDate })) {
          setLeaves((prev) =>
            prev.map((l) =>
              l.id === active.id ? { ...l, startDate: newStartDate } : l
            )
          );
        }
      }
    }
  };
  const handleSaveDialog = () => {
    const { mode, data } = dialogState;
    const type = absenceTypes.find((t) => t.id === data.typeId);
    if (!type) return;
    const entry = {
      id: data.id || "new-" + Date.now(),
      rowId: data.rowId,
      name: data.name,
      startDate: data.startDate.format("YYYY-MM-DD"),
      durationDays: Number(data.duration),
      color: type.color,
    };
    if (mode === "create") {
      if (!checkCollision(leaves, entry)) {
        setLeaves((prev) => [...prev, entry]);
        setDialogState((p) => ({ ...p, isOpen: false }));
      } else {
        alert("Krockar med annan frånvaro!");
      }
    } else {
      setLeaves((prev) => prev.map((l) => (l.id === data.id ? entry : l)));
      setDialogState((p) => ({ ...p, isOpen: false }));
    }
  };
  // 1. Öppna dialogen i edit-läge
  const handleEditTypeOpen = (type: any) => {
    setSelectedTypeId(type.id);
    setNewTypeLabel(type.label);
    setNewTypeColor(type.color);
    setTypeDialogMode("edit");
    setIsTypeDialogOpen(true);
  };

  // 2. Ta bort en ledighetstyp
  const handleDeleteAbsenceType = () => {
    if (!selectedTypeId) return;

    // Kontrollera om du vill tillåta borttagning av standardtyper (valfritt)
    setAbsenceTypes((prev) => prev.filter((t) => t.id !== selectedTypeId));
    setIsTypeDialogOpen(false);
    setSelectedTypeId(null);
  };
  const handleResizeEnd = (
    id: string,
    newDuration: number,
    daysShifted: number
  ) => {
    setLeaves((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          // Calculate new start date if the left handle was dragged (daysShifted)
          const newStartDate = dayjs(l.startDate)
            .add(daysShifted, "day")
            .format("YYYY-MM-DD");

          const updatedItem = {
            ...l,
            durationDays: newDuration,
            startDate: newStartDate,
          };

          // Optional: Check for collisions before updating
          if (checkCollision(prev, updatedItem)) {
            alert("Krockar med annan frånvaro!");
            return l; // Return original if collision
          }

          return updatedItem;
        }
        return l;
      })
    );
  };

  const handleEdit = (id: string) => {
    const leave = leaves.find((l) => l.id === id);
    if (leave)
      setDialogState({
        isOpen: true,
        mode: "edit",
        data: {
          ...leave,
          startDate: dayjs(leave.startDate),
          duration: leave.durationDays,
          typeId:
            absenceTypes.find((t) => t.color === leave.color)?.id || "vac",
        },
      });
  };
  const handleDelete = (id: string) =>
    setLeaves((prev) => prev.filter((l) => l.id !== id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
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
      <style>{animationStyles}</style>
      {/* 1. APP BAR */}
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
            {absenceTypes.map((type) => (
              <Box
                key={type.id}
                onClick={() => handleEditTypeOpen(type)} // <--- LÄGG TILL DENNA
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  cursor: "pointer", // <--- GÖR DEN KLICKBAR
                  padding: "4px 8px",
                  borderRadius: "4px",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.05)" },
                }}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => jumpToDate(pickerDate.subtract(1, "month"))}
            >
              <ArrowBackIosNewIcon fontSize="small" />
            </IconButton>
            <Button
              onClick={() => setIsDatePickerOpen(true)}
              startIcon={<CalendarMonthIcon fontSize="small" />}
              sx={{
                fontWeight: 600,
                textTransform: "capitalize",
                color: "text.primary",
                minWidth: 160,
              }}
            >
              {startDate.format("D MMM YYYY")}, v.{startDate.isoWeek()}
            </Button>
            <IconButton
              size="small"
              onClick={() => jumpToDate(pickerDate.add(1, "month"))}
            >
              <ArrowForwardIosIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 2. MAIN CONTENT AREA */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* SIDEBAR (GLASSMORPHISM) */}
        <Box
          sx={{
            width:
              sidebarMode === "full"
                ? 200
                : sidebarMode === "initials"
                ? 70
                : 0,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            zIndex: 1100,
            overflow: "visible",
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              borderRight:
                sidebarMode === "hidden"
                  ? "none"
                  : "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow:
                sidebarMode === "hidden"
                  ? "none"
                  : "4px 0 15px rgba(0,0,0,0.05)",
            }}
          >
            <Box
              sx={{
                height: 105,
                borderBottom: "1px solid rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {sidebarMode !== "hidden" && (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "primary.main",
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                  }}
                >
                  P
                </Box>
              )}
            </Box>

            {/* List with Collapsible Animation */}
            <Box sx={{ overflowY: "auto", flex: 1, overflowX: "hidden" }}>
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.includes(group.id);
                const header = (
                  <Box
                    onClick={() => toggleGroup(group.id)}
                    sx={{
                      height: 40,
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        sidebarMode === "initials" ? "center" : "space-between",
                      px: sidebarMode === "initials" ? 0 : 2,
                      bgcolor: "rgba(0,0,0,0.04)",
                      borderBottom: "1px solid rgba(0,0,0,0.03)",
                      cursor: "pointer",
                      boxSizing: "border-box",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.08)",
                        "& .group-menu-btn": { opacity: 1 },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                      }}
                    >
                      {sidebarMode === "full" && (
                        <Box
                          sx={{
                            mr: 1,
                            display: "flex",
                            transition: "transform 0.3s",
                            transform: isCollapsed
                              ? "rotate(-90deg)"
                              : "rotate(0deg)",
                          }}
                        >
                          <KeyboardArrowDownIcon fontSize="small" />
                        </Box>
                      )}
                      <Typography
                        variant="subtitle1"
                        noWrap
                        sx={{
                          fontWeight: 700,
                          textAlign:
                            sidebarMode === "initials" ? "center" : "left",
                        }}
                      >
                        {sidebarMode === "initials"
                          ? getInitials(group.name)
                          : group.name}
                      </Typography>
                    </Box>
                    {sidebarMode === "full" && (
                      <IconButton
                        className="group-menu-btn"
                        size="small"
                        sx={{ opacity: 0 }}
                        onClick={(e) => handleGroupMenuOpen(e, group.id)}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                );

                return (
                  <Box key={group.id}>
                    {sidebarMode === "initials" ? (
                      <Tooltip title={group.name} placement="right" arrow>
                        {header}
                      </Tooltip>
                    ) : (
                      header
                    )}
                    <Collapse in={!isCollapsed}>
                      {group.resources.map((res, index) => {
                        const resRow = (
                          <Box
                            key={index}
                            sx={{
                              height: ROW_HEIGHT,
                              display: "flex",
                              alignItems: "center",
                              px: sidebarMode === "initials" ? 0 : 2,
                              justifyContent:
                                sidebarMode === "initials"
                                  ? "center"
                                  : "flex-start",
                              borderBottom: "1px solid rgba(0,0,0,0.03)",
                              pl: sidebarMode === "full" ? 5 : 0,
                              boxSizing: "border-box",
                              // LÄGG TILL DESSA RADER:
                              "&:hover": {
                                bgcolor: "rgba(0,0,0,0.04)",
                                "& .res-menu-btn": { opacity: 1 },
                              },
                            }}
                          >
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontWeight: 500,
                                textAlign:
                                  sidebarMode === "initials"
                                    ? "center"
                                    : "left",
                              }}
                            >
                              {sidebarMode === "initials"
                                ? getInitials(res.name)
                                : res.name}
                            </Typography>
                            {sidebarMode === "full" && (
                              <IconButton
                                className="res-menu-btn"
                                size="small"
                                sx={{ opacity: 0, ml: "auto", mr: 1 }}
                                onClick={(e) =>
                                  handleResourceMenuOpen(e, group.id, res.id)
                                }
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        );
                        return sidebarMode === "initials" ? (
                          <Tooltip
                            key={res.id}
                            title={res.name}
                            placement="right"
                            arrow
                          >
                            {resRow}
                          </Tooltip>
                        ) : (
                          resRow
                        );
                      })}
                    </Collapse>
                  </Box>
                );
              })}
            </Box>

            {/* Bottom Menu Button */}
            {sidebarMode !== "hidden" && (
              <Box
                sx={{
                  p: 1,
                  borderTop: "1px solid rgba(0,0,0,0.1)",
                  bgcolor: "white",
                }}
              >
                <Button
                  fullWidth
                  startIcon={<MenuIcon />}
                  onClick={(e) => setMainMenuAnchor(e.currentTarget)}
                  sx={{
                    justifyContent: "center",
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                >
                  {sidebarMode === "full" && "Meny"}
                </Button>
              </Box>
            )}
          </Box>

          <IconButton
            onClick={handleToggleSidebar}
            size="small"
            sx={{
              position: "absolute",
              bottom: 104,
              right: sidebarMode === "hidden" ? -24 : -14,
              zIndex: 1200,
              width: 38,
              height: 38,
              bgcolor: "white",
              border: "1px solid #ddd",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              "&:hover": { bgcolor: "#f8f9fa", transform: "scale(1.1)" },
              transition: "all 0.2s ease-in-out",
            }}
          >
            {sidebarMode === "hidden" ? (
              <KeyboardArrowRight fontSize="large" color="primary" />
            ) : (
              <KeyboardArrowLeft fontSize="medium" color="primary" />
            )}
          </IconButton>
        </Box>

        {/* TIMELINE AREA (SYNCED WITH SIDEBAR) */}
        <Box
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            flex: 1,
            overflowX: "auto",
            overflowY: "hidden",
            position: "relative",
            bgcolor: "#fff",
            zIndex: 1,
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
                position: "relative",
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
                      color: "primary.main",
                      textTransform: "capitalize",
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
                position: "relative",
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
                    Vecka.{day.isoWeek()}
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

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToHorizontalAxis]}
          >
            <Box sx={{ position: "relative", width: daysCount * CELL_WIDTH }}>
              {groups.map((group) => {
                const isCollapsed = collapsedGroups.includes(group.id);
                return (
                  <Box key={group.id}>
                    {/* Synchronized Group Row */}
                    <Box
                      sx={{
                        height: 40,
                        bgcolor: "#fcfcfc",
                        borderBottom: "1px solid #eee",
                        boxSizing: "border-box",
                      }}
                    />
                    <Collapse in={!isCollapsed}>
                      {group.resources.map((res) => (
                        <Box
                          key={res.id}
                          onPointerDown={(e) =>
                            handleGridPointerDown(e, res.id)
                          }
                          onPointerMove={handleGridPointerMove}
                          onPointerUp={handleGridPointerUp}
                          sx={{
                            height: ROW_HEIGHT,
                            borderBottom: "1px solid #eee",
                            backgroundImage: gridBackground,
                            position: "relative",
                            cursor: "crosshair",
                            boxSizing: "border-box",
                          }}
                        >
                          {selection.isSelecting &&
                            selection.rowId === res.id && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 5,
                                  height: ROW_HEIGHT - 10,
                                  bgcolor: "rgba(25, 118, 210, 0.15)", // Slightly lighter
                                  border: "2px dashed #1976d2",
                                  borderRadius: 1,
                                  zIndex: 10,
                                  pointerEvents: "none",
                                  left: Math.min(
                                    selection.startX,
                                    selection.currentX
                                  ),
                                  width: Math.abs(
                                    selection.currentX - selection.startX
                                  ),
                                  // ADD THIS ANIMATION:
                                  animation:
                                    "marchingAnts 0.5s linear infinite",
                                  backgroundImage: `linear-gradient(90deg, #1976d2 50%, transparent 50%), 
                        linear-gradient(90deg, #1976d2 50%, transparent 50%), 
                        linear-gradient(0deg, #1976d2 50%, transparent 50%), 
                        linear-gradient(0deg, #1976d2 50%, transparent 50%)`,
                                  backgroundRepeat:
                                    "repeat-x, repeat-x, repeat-y, repeat-y",
                                  backgroundSize:
                                    "15px 2px, 15px 2px, 2px 15px, 2px 15px",
                                  backgroundPosition:
                                    "0 0, 0 100%, 0 0, 100% 0",
                                }}
                              />
                            )}
                          {leaves
                            .filter((l) => l.rowId === res.id)
                            .map((l) => (
                              <LeaveBlock
                                key={l.id}
                                leave={l}
                                left={getDateOffset(l.startDate, startDate)}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onResizeEnd={handleResizeEnd}
                                scrollContainerRef={scrollContainerRef}
                                onTooltipOpen={() => setIsTooltipOpen(true)}
                                onTooltipClose={() => setIsTooltipOpen(false)}
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
              {activeLeave && <LeaveBlock leave={activeLeave} isOverlay />}
            </DragOverlay>
          </DndContext>
        </Box>
      </Box>

      {/* MENUS & DIALOGS */}
      {/* Group Actions Menu */}
      <Menu
        anchorEl={resourceMenuAnchor}
        open={Boolean(resourceMenuAnchor)}
        onClose={() => setResourceMenuAnchor(null)}
        slots={{ transition: Grow }}
        slotProps={{
          transition: { timeout: 450 },
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <MenuItem onClick={handleEditResourceTrigger} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" /> Redigera
        </MenuItem>
        <MenuItem
          onClick={handleDeleteResource}
          sx={{ gap: 1.5, color: "error.main" }}
        >
          <DeleteIcon fontSize="small" /> Ta bort
        </MenuItem>
      </Menu>
      <Menu
        anchorEl={groupMenuAnchor}
        open={Boolean(groupMenuAnchor)}
        onClose={handleGroupMenuClose}
        slots={{ transition: Grow }}
        slotProps={{
          transition: { timeout: 450 },
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <MenuItem onClick={handleOpenAddResource} sx={{ gap: 1.5 }}>
          <AddIcon fontSize="small" /> Lägg till anställd
        </MenuItem>
        <MenuItem onClick={handleEditGroupTrigger} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" /> Redigera
        </MenuItem>
        <MenuItem
          onClick={handleDeleteGroup}
          sx={{ gap: 1.5, color: "error.main" }}
        >
          <DeleteIcon fontSize="small" /> Ta bort
        </MenuItem>
      </Menu>

      {/* Sidebar Bottom Menu */}
      <Menu
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={() => setMainMenuAnchor(null)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        slots={{ transition: Grow }}
        slotProps={{
          transition: { timeout: 450 },
          paper: {
            sx: {
              borderRadius: 2,
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setSelectedGroupId(null);
            setNewGroupName("");
            setMainMenuAnchor(null);
            setIsGroupDialogOpen(true);
          }}
          sx={{ gap: 1.5 }}
        >
          <AddIcon fontSize="small" /> Lägg till grupp
        </MenuItem>
        <MenuItem
          onClick={() => {
            setTypeDialogMode("create"); // <--- LÄGG TILL DENNA
            setNewTypeLabel("");
            setNewTypeColor("#9c27b0");
            setIsTypeDialogOpen(true);
            setMainMenuAnchor(null);
          }}
          sx={{ gap: 1.5 }}
        >
          <CalendarMonthIcon fontSize="small" /> Lägg till ledighetstyp
        </MenuItem>
      </Menu>

      {/* Group Dialog */}
      <Dialog
        open={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        slots={{ transition: Grow }}
        slotProps={{ transition: { timeout: 450 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {selectedGroupId ? "Redigera grupp" : "Skapa ny grupp"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Gruppnamn"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSaveGroup()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsGroupDialogOpen(false)}>Avbryt</Button>
          <Button variant="contained" onClick={handleSaveGroup}>
            Spara
          </Button>
        </DialogActions>
      </Dialog>

      {/* Date Jump Picker */}
      <DatePicker
        open={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        value={startDate}
        onChange={jumpToDate}
        slotProps={{ textField: { sx: { display: "none" } } }}
      />

      {/* DIN ORIGINAL-DIALOG FÖR LEDIGHET (ORÖRD) */}
      <Dialog
        open={dialogState.isOpen}
        onClose={() => setDialogState((p) => ({ ...p, isOpen: false }))}
        fullWidth
        maxWidth="sm"
        slots={{ transition: Grow }}
        slotProps={{ transition: { timeout: 450 } }}
      >
        <DialogTitle>
          {dialogState.mode === "create"
            ? "Registrera frånvaro"
            : "Redigera frånvaro"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Typ av frånvaro</InputLabel>
              <Select
                value={dialogState.data.typeId}
                label="Typ av frånvaro"
                onChange={(e) => {
                  const sel = ABSENCE_TYPES.find(
                    (t) => t.id === e.target.value
                  );
                  setDialogState((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      typeId: e.target.value as string,
                      name: sel?.label || "",
                    },
                  }));
                }}
              >
                {absenceTypes.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: opt.color,
                        }}
                      />
                      <Typography variant="body2">{opt.label}</Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                Datumperiod
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <DatePicker
                  label="Startdatum"
                  value={dialogState.data.startDate}
                  onChange={(date) => {
                    if (date) {
                      const newStart = date.startOf("day");
                      const currentEnd = dialogState.data.startDate.add(
                        dialogState.data.duration - 1,
                        "day"
                      );
                      const diff = currentEnd.diff(newStart, "day") + 1;
                      setDialogState((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          startDate: newStart,
                          duration: diff >= 1 ? diff : 1,
                        },
                      }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />

                <DatePicker
                  label="Slutdatum"
                  value={dialogState.data.startDate.add(
                    dialogState.data.duration - 1,
                    "day"
                  )}
                  onChange={(date) => {
                    if (date) {
                      const newEnd = date.startOf("day");
                      const diff =
                        newEnd.diff(dialogState.data.startDate, "day") + 1;
                      setDialogState((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          duration: diff >= 1 ? diff : 1,
                          ...(diff < 1 && { startDate: newEnd }),
                        },
                      }));
                    }
                  }}
                  slotProps={{ textField: { fullWidth: true, size: "small" } }}
                />
              </Box>
            </Box>

            <TextField
              label="Antal dagar"
              type="number"
              value={dialogState.data.duration}
              onChange={(e) => {
                const d = parseInt(e.target.value) || 1;
                setDialogState((prev) => ({
                  ...prev,
                  data: { ...prev.data, duration: Math.max(1, d) },
                }));
              }}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              helperText="Minimiantal: 1 dag"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDialogState((p) => ({ ...p, isOpen: false }))}
          >
            Avbryt
          </Button>
          <Button variant="contained" onClick={handleSaveDialog}>
            {dialogState.mode === "create" ? "Registrera" : "Spara ändringar"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isResourceDialogOpen}
        onClose={() => setIsResourceDialogOpen(false)}
        slots={{ transition: Grow }}
        slotProps={{ transition: { timeout: 450 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {resourceDialogMode === "edit"
            ? "Redigera anställd"
            : "Lägg till anställd"}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            label="Namn på anställd"
            fullWidth
            value={newResourceName}
            onChange={(e) => setNewResourceName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSaveResource()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsResourceDialogOpen(false)}>Avbryt</Button>
          <Button variant="contained" onClick={handleSaveResource}>
            Spara
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={isTypeDialogOpen}
        onClose={() => setIsTypeDialogOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {typeDialogMode === "edit"
            ? "Redigera ledighetstyp"
            : "Skapa ny ledighetstyp"}
        </DialogTitle>

        <DialogContent
          sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 3 }}
        >
          <TextField
            autoFocus
            label="Namn"
            fullWidth
            value={newTypeLabel}
            onChange={(e) => setNewTypeLabel(e.target.value)}
          />
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, mb: 1, display: "block" }}
            >
              Välj färg:
            </Typography>
            <input
              type="color"
              value={newTypeColor}
              onChange={(e) => setNewTypeColor(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                cursor: "pointer",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          {/* TA BORT-KNAPP: Visas bara i edit-läge */}
          {typeDialogMode === "edit" ? (
            <Button
              color="error"
              onClick={handleDeleteAbsenceType}
              startIcon={<DeleteIcon />}
            >
              Ta bort
            </Button>
          ) : (
            <Box />
          )}{" "}
          {/* Tom box för att hålla Spara-knappen till höger */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setIsTypeDialogOpen(false)}>Avbryt</Button>
            <Button variant="contained" onClick={handleSaveAbsenceType}>
              Spara
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
