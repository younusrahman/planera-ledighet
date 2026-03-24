import React, { memo, useState, useRef, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { Team, TeamWithEmployees, SidebarMode } from "../types";
import { useConfigActions } from "../services/stores/uiStore";

dayjs.extend(isoWeek);

const realToday = dayjs().startOf("day");

const Icon = {
  Back: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Forward: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Calendar: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Group: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  User: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Database: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  ),
  Chart: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  Table: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  EventBusy: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="13" x2="15" y2="19" />
      <line x1="15" y1="13" x2="9" y2="19" />
    </svg>
  ),
};

function getSwedishHolidays(year: number) {
  const FIXED = [
    { name: "Nyårsdagen", date: dayjs(`${year}-01-01`) },
    { name: "Trettondedag jul", date: dayjs(`${year}-01-06`) },
    { name: "Första maj", date: dayjs(`${year}-05-01`) },
    { name: "Nationaldagen", date: dayjs(`${year}-06-06`) },
    { name: "Juldagen", date: dayjs(`${year}-12-25`) },
    { name: "Annandag jul", date: dayjs(`${year}-12-26`) },
  ];

  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const day = I - ((year + f(year / 4) + I + 2 - C + f(C / 4)) % 7) + 28;
  const month = day > 31 ? 4 : 3;
  const date = day > 31 ? day - 31 : day;
  const easter = dayjs(`${year}-${month}-${date}`);

  return [
    ...FIXED,
    { name: "Långfredagen", date: easter.subtract(2, "day") },
    { name: "Påskdagen", date: easter },
    { name: "Annandag påsk", date: easter.add(1, "day") },
    { name: "Kristi himmelsfärdsdag", date: easter.add(39, "day") },
    { name: "Pingstdagen", date: easter.add(49, "day") },
  ].sort((a, b) => a.date.diff(b.date));
}

interface TimelineHeaderProps {
  openConfig: () => void;
  groups: TeamWithEmployees[];
  pickerDate: Dayjs;
  isDatePickerOpen: boolean;
  datePickerAnchorRef: React.RefObject<HTMLButtonElement>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDateChange: (date: Dayjs) => void;
  sidebarMode: SidebarMode;
  handleDialogGroupTrigger: (group?: Team) => void;
  handleDialogAbsenceTypeTrigger: () => void;
  handleDialogDatabaseSystemTrigger: () => void;
  openAnalyticsDashboard: () => void;
  openDataManagement: () => void;
  handleDialogResourceTrigger: (
    resourceToEdit?: { id: string; name: string },
    currentGroupId?: string,
  ) => void;
  doseHaveAbsenceTypes?: boolean;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  groups,
  pickerDate,
  isDatePickerOpen,
  datePickerAnchorRef,
  onPrevMonth,
  onNextMonth,
  onOpenDatePicker,
  onCloseDatePicker,
  onDateChange,
  handleDialogGroupTrigger,
  handleDialogAbsenceTypeTrigger,
  handleDialogResourceTrigger,
  handleDialogDatabaseSystemTrigger,
  openAnalyticsDashboard,
  openConfig,
  openDataManagement,
  doseHaveAbsenceTypes,
  sidebarMode,
}) => {
  const { setSidebarMode } = useConfigActions();
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [viewDate, setViewDate] = useState(pickerDate);
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  const mainMenuRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const modes: SidebarMode[] = ["full", "compact", "hidden"];

  const isMobile = windowWidth <= 768;
  const isSmallMobile = windowWidth <= 640;

  useEffect(() => {
    if (isDatePickerOpen) {
      setViewDate(pickerDate);
    }
  }, [isDatePickerOpen, pickerDate]);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showMainMenu &&
        mainMenuRef.current &&
        !mainMenuRef.current.contains(e.target as Node)
      ) {
        setShowMainMenu(false);
      }

      if (
        isDatePickerOpen &&
        datePopoverRef.current &&
        !datePopoverRef.current.contains(e.target as Node)
      ) {
        onCloseDatePicker();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMainMenu, isDatePickerOpen, onCloseDatePicker]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMainMenu(false);
        onCloseDatePicker();
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCloseDatePicker]);

  const startOfMonth = viewDate.startOf("month");
  const daysInMonth = viewDate.daysInMonth();
  const startDayOfWeek = (startOfMonth.day() + 6) % 7;

  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDayOfWeek + 1;
    return day > 0 && day <= daysInMonth ? startOfMonth.date(day) : null;
  });

  const calendarWeeks = Array.from({ length: 6 }, (_, weekIndex) => {
    const firstDayIndex = weekIndex * 7;
    const firstDayInRow = calendarDays[firstDayIndex];

    if (firstDayInRow) return firstDayInRow.isoWeek();

    const fallbackDate = startOfMonth
      .subtract(startDayOfWeek, "day")
      .add(firstDayIndex, "day");

    return fallbackDate.isoWeek();
  });

  const months = [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December",
  ];

  const years = Array.from({ length: 21 }, (_, i) => dayjs().year() - 10 + i);

  const getDaysLeft = (targetDate: Dayjs) => {
    const diff = targetDate.startOf("day").diff(realToday, "day");
    if (diff === 0) return "Idag";
    if (diff === 1) return "Imorgon";
    if (diff < 0) return "Passerad";
    return `${diff} dagar kvar`;
  };

  const stylesObj: Record<string, React.CSSProperties> = {
    header: {
      background: "white",
      borderBottom: "1px solid #ddd",
      minHeight: 64,
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "1fr auto 1fr",
      alignItems: "center",
      gap: isMobile ? 12 : 16,
      padding: isMobile ? "12px 14px" : "10px 24px",
      position: "relative",
      zIndex: 1100,
    },
    left: {
      display: "flex",
      alignItems: "center",
      justifyContent: isMobile ? "center" : "flex-start",
      minWidth: 0,
    },
    center: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    right: {
      display: "flex",
      alignItems: "center",
      justifyContent: isMobile ? "center" : "flex-end",
      width: isMobile ? "100%" : undefined,
    },
    title: {
      fontSize: isMobile ? "1rem" : "1.15rem",
      fontWeight: 800,
      color: "#111",
      margin: 0,
      whiteSpace: isMobile ? "normal" : "nowrap",
      textAlign: isMobile ? "center" : "left",
    },
    dateNav: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: isMobile ? "100%" : undefined,
      justifyContent: "center",
      flexWrap: isMobile ? "wrap" : "nowrap",
    },
    navBtn: {
      background: "white",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: 10,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    pickerTrigger: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "8px 16px",
      border: "1px solid #ddd",
      borderRadius: 10,
      background: "white",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      minWidth: isMobile ? 0 : undefined,
    },
    triggerIcon: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    triggerText: {
      display: "flex",
      flexDirection: "column",
    },
    dateDisplay: {
      fontSize: 13,
      fontWeight: 700,
      color: "#333",
      display: "block",
    },
    weekDisplay: {
      fontSize: 10,
      color: "#888",
      fontWeight: 500,
    },
    menuBtn: {
      background: "linear-gradient(135deg, #1976d2 0%, #0d5db8 100%)",
      color: "white",
      border: "none",
      borderRadius: 10,
      padding: "10px 20px",
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 8px 18px rgba(25, 118, 210, 0.22)",
      width: isMobile ? "100%" : undefined,
      maxWidth: isMobile ? 240 : undefined,
    },

    overlayRoot: {
      position: "fixed",
      inset: 0,
      zIndex: 5000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isSmallMobile ? 10 : 20,
    },
    overlayRootCentered: {
      position: "fixed",
      inset: 0,
      zIndex: 5000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: isSmallMobile ? 10 : 24,
    },
    overlayBackdrop: {
      position: "fixed",
      inset: 0,
      background:
        "radial-gradient(circle at top, rgba(25,118,210,0.08), transparent 35%), rgba(15,23,42,0.42)",
      backdropFilter: "blur(6px)",
      animation: "fadeBackdrop 0.22s ease",
    },
    overlayPanel: {
      position: "relative",
      zIndex: 1,
      width: "min(92vw, 760px)",
      background: "rgba(255,255,255,0.94)",
      backdropFilter: "blur(14px)",
      border: "1px solid rgba(255,255,255,0.7)",
      borderRadius: isSmallMobile ? 16 : 20,
      boxShadow: "0 30px 70px rgba(0,0,0,0.18), 0 10px 20px rgba(0,0,0,0.08)",
      overflow: "hidden",
      animation: "panelIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      transformOrigin: "center center",
    },
    menuPanel: {
      width: "min(92vw, 360px)",
      maxWidth: isSmallMobile ? 420 : undefined,
    },
    datePanel: {
      width: isSmallMobile ? "100%" : "min(96vw, 760px)",
      marginTop: 0,
      maxHeight: "calc(100vh - 20px)",
      overflow: "hidden",
    },
    panelHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 18px",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.85))",
    },
    overlayTitle: {
      fontSize: 13,
      fontWeight: 800,
      color: "#334155",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },
    closeBtn: {
      background: "#111827",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: 8,
      fontSize: 10,
      fontWeight: 800,
      cursor: "pointer",
    },

    menuItem: {
      padding: "12px 18px",
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      fontSize: 14,
      gap: 12,
      color: "#334155",
    },
    menuSep: {
      height: 1,
      background: "rgba(0,0,0,0.06)",
      margin: "8px 0",
    },
    sidebarModeToggle: {
      padding: 16,
      background: "rgba(248,250,252,0.8)",
      borderTop: "1px solid rgba(0,0,0,0.05)",
    },
    toggleTrack: {
      display: "flex",
      background: "#e5e7eb",
      borderRadius: 10,
      padding: 4,
      position: "relative",
    },
    toggleThumb: {
      position: "absolute",
      top: 4,
      bottom: 4,
      width: "32%",
      background: "white",
      borderRadius: 8,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    toggleBtn: {
      flex: 1,
      border: "none",
      background: "none",
      fontSize: 11,
      fontWeight: 600,
      zIndex: 1,
      padding: "8px 0",
      cursor: "pointer",
      color: "#64748b",
    },
    toggleBtnActive: {
      fontWeight: 800,
      color: "#1976d2",
    },

    popoverContent: {
      display: "flex",
      flexDirection: windowWidth <= 900 ? "column" : "row",
      alignItems: "stretch",
      maxHeight: "calc(100vh - 90px)",
      overflow: "hidden",
    },

    calendarSection: {
      width: windowWidth <= 900 ? "auto" : 340,
      padding: isSmallMobile ? 14 : 18,
      borderRight: windowWidth <= 900 ? "none" : "1px solid rgba(0,0,0,0.06)",
      borderBottom: windowWidth <= 900 ? "1px solid rgba(0,0,0,0.06)" : "none",
      background: "rgba(255,255,255,0.7)",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },

    calendarTopNav: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
      flexDirection: "row",
    },

    miniNavBtn: {
      width: isSmallMobile ? 32 : 36,
      height: isSmallMobile ? 32 : 36,
      border: "1px solid #ddd",
      borderRadius: 10,
      background: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      flexShrink: 0,
    },

    calendarSelectors: {
      display: "flex",
      gap: 8,
      flex: 1,
      flexDirection: "row",
      minWidth: 0,
    },

    monthSelect: {
      flex: 1,
      minWidth: 0,
      padding: isSmallMobile ? "7px 8px" : "8px 10px",
      borderRadius: 8,
      border: "1px solid #ddd",
      fontWeight: 600,
      fontSize: isSmallMobile ? 12 : 14,
      outline: "none",
      cursor: "pointer",
      background: "white",
    },

    yearSelect: {
      width: isSmallMobile ? 78 : 88,
      padding: isSmallMobile ? "7px 8px" : "8px 10px",
      borderRadius: 8,
      border: "1px solid #ddd",
      fontWeight: 600,
      fontSize: isSmallMobile ? 12 : 14,
      outline: "none",
      cursor: "pointer",
      background: "white",
      flexShrink: 0,
    },

    calendarGrid: {
      display: "grid",
      gridTemplateColumns: "28px repeat(7, 1fr)",
      gap: 4,
      alignItems: "center",
    },
    gridWeekLabel: {
      textAlign: "center",
      fontSize: 10,
      fontWeight: 800,
      color: "#bbb",
    },
    gridWeekday: {
      textAlign: "center",
      fontSize: 11,
      fontWeight: 800,
      color: "#cbd5e1",
    },
    weekNumberCell: {
      height: 34,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 10,
      fontWeight: 700,
      color: "#64748b",
      borderRadius: 8,
      background: "#f8fafc",
    },
    gridDayBase: {
      position: "relative",
      aspectRatio: "1",
      border: "1px solid transparent",
      background: "none",
      borderRadius: 10,
      fontSize: 12,
      cursor: "pointer",
      fontWeight: 700,
      color: "#334155",
    },
    gridDaySelected: {
      background: "#1976d2",
      color: "white",
      borderColor: "#1976d2",
      boxShadow: "0 8px 18px rgba(25,118,210,0.22)",
    },
    gridDayToday: {
      borderColor: "#1976d2",
    },
    btnToday: {
      width: "100%",
      border: "1px solid #1976d2",
      color: "#1976d2",
      background: "white",
      padding: "9px 10px",
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 800,
      cursor: "pointer",
    },

    holidaySection: {
      flex: 1,
      minWidth: 0,
      background: "rgba(248,250,252,0.75)",
    },
    holidayHeader: {
      padding: isSmallMobile ? "10px 12px" : "12px 16px",
      fontSize: 11,
      fontWeight: 800,
      color: "#1976d2",
      borderBottom: "1px solid rgba(0,0,0,0.05)",
    },
    holidayList: {
      maxHeight: windowWidth <= 900 ? 220 : 280,
      overflowY: "auto",
      padding: "6px 0",
    },
    holidayItem: {
      padding: isSmallMobile ? "10px 12px" : "10px 16px",
      cursor: "pointer",
      borderBottom: "1px solid rgba(250,250,250,0.9)",
      display: "flex",
    },
    holidayItemSelected: {
      background: "#f0f7ff",
      borderLeft: "4px solid #1976d2",
      paddingLeft: isSmallMobile ? 8 : 12,
    },
    holidayRowContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      width: "100%",
      gap: 10,
    },
    hInfo: {
      display: "flex",
      flexDirection: "column",
      flex: 1,
      minWidth: 0,
    },
    hName: {
      fontSize: 13,
      fontWeight: 700,
      color: "#333",
    },
    hDateUnder: {
      fontSize: 11,
      color: "#999",
      marginTop: 2,
    },
    daysLeftBadge: {
      fontSize: 10,
      fontWeight: 700,
      color: "#1976d2",
      background: "#e3f2fd",
      padding: "2px 8px",
      borderRadius: 10,
      whiteSpace: "nowrap",
    },
    daysLeftPassed: {
      color: "#999",
      background: "#eee",
    },
    daysLeftToday: {
      color: "#d32f2f",
      background: "#ffebee",
    },
    todayDot: {
      position: "absolute",
      bottom: 4,
      left: "50%",
      transform: "translateX(-50%)",
      width: 4,
      height: 4,
      background: "#d32f2f",
      borderRadius: "50%",
    },
  };

  return (
    <>
      <header style={stylesObj.header}>
        <div style={stylesObj.left}>
          <h1 style={stylesObj.title}>Planera ledighet</h1>
        </div>

        <div style={stylesObj.center}>
          <div style={stylesObj.dateNav}>
            <button onClick={onPrevMonth} style={stylesObj.navBtn}>
              <Icon.Back />
            </button>

            <div style={{ position: "relative" }}>
              <button
                ref={datePickerAnchorRef}
                onClick={onOpenDatePicker}
                style={stylesObj.pickerTrigger}
              >
                <div style={stylesObj.triggerIcon}>
                  <Icon.Calendar />
                </div>
                <div style={stylesObj.triggerText}>
                  <span style={stylesObj.dateDisplay}>
                    {pickerDate.format("D MMM YYYY")}
                  </span>
                  <span style={stylesObj.weekDisplay}>
                    Vecka {pickerDate.isoWeek()}
                  </span>
                </div>
              </button>
            </div>

            <button onClick={onNextMonth} style={stylesObj.navBtn}>
              <Icon.Forward />
            </button>
          </div>
        </div>

        <div style={stylesObj.right}>
          <button
            onClick={() => setShowMainMenu(true)}
            style={stylesObj.menuBtn}
            aria-expanded={showMainMenu}
          >
            Meny
          </button>
        </div>
      </header>

      {showMainMenu && (
        <div style={stylesObj.overlayRootCentered}>
          <div
            style={stylesObj.overlayBackdrop}
            onClick={() => setShowMainMenu(false)}
          />
          <div
            ref={mainMenuRef}
            style={{ ...stylesObj.overlayPanel, ...stylesObj.menuPanel }}
          >
            <div style={stylesObj.panelHeader}>
              <span style={stylesObj.overlayTitle}>Meny</span>
              <button
                style={stylesObj.closeBtn}
                onClick={() => setShowMainMenu(false)}
              >
                STÄNG
              </button>
            </div>

            <div
              style={stylesObj.menuItem}
              onClick={() => {
                setShowMainMenu(false);
                handleDialogAbsenceTypeTrigger();
              }}
            >
              <Icon.EventBusy /> Frånvarotyper
            </div>

            <div
              style={{
                ...stylesObj.menuItem,
                opacity: doseHaveAbsenceTypes ? 1 : 0.5,
              }}
              onClick={() => {
                if (doseHaveAbsenceTypes) {
                  setShowMainMenu(false);
                  handleDialogGroupTrigger();
                }
              }}
            >
              <Icon.Group /> Lägg till grupp
            </div>

            <div
              style={{
                ...stylesObj.menuItem,
                opacity: groups.length > 0 ? 1 : 0.5,
              }}
              onClick={() => {
                if (groups.length > 0) {
                  setShowMainMenu(false);
                  handleDialogResourceTrigger();
                }
              }}
            >
              <Icon.User /> Lägg till anställda
            </div>

            <div style={stylesObj.menuSep} />

            <div
              style={stylesObj.menuItem}
              onClick={() => {
                setShowMainMenu(false);
                openDataManagement();
              }}
            >
              <Icon.Table /> Data Management
            </div>

            <div
              style={stylesObj.menuItem}
              onClick={() => {
                setShowMainMenu(false);
                openAnalyticsDashboard();
              }}
            >
              <Icon.Chart /> Analytics
            </div>

            <div
              style={stylesObj.menuItem}
              onClick={() => {
                setShowMainMenu(false);
                openConfig();
              }}
            >
              <Icon.Settings /> Konfigurera
            </div>

            <div
              style={stylesObj.menuItem}
              onClick={() => {
                setShowMainMenu(false);
                handleDialogDatabaseSystemTrigger();
              }}
            >
              <Icon.Database /> Databassystem
            </div>

            <div style={stylesObj.sidebarModeToggle}>
              <div style={stylesObj.toggleTrack}>
                <div
                  style={{
                    ...stylesObj.toggleThumb,
                    left: `${modes.indexOf(sidebarMode) * 33.33 + 0.5}%`,
                  }}
                />
                {modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSidebarMode(mode)}
                    style={{
                      ...stylesObj.toggleBtn,
                      ...(sidebarMode === mode
                        ? stylesObj.toggleBtnActive
                        : {}),
                    }}
                  >
                    {mode === "compact"
                      ? "Compact"
                      : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isDatePickerOpen && (
        <div style={stylesObj.overlayRoot}>
          <div style={stylesObj.overlayBackdrop} onClick={onCloseDatePicker} />
          <div
            ref={datePopoverRef}
            style={{ ...stylesObj.overlayPanel, ...stylesObj.datePanel }}
          >
            <div style={stylesObj.panelHeader}>
              <span style={stylesObj.overlayTitle}>Navigera kalender</span>
              <button style={stylesObj.closeBtn} onClick={onCloseDatePicker}>
                STÄNG
              </button>
            </div>

            <div style={stylesObj.popoverContent}>
              <div style={stylesObj.calendarSection}>
                <div style={stylesObj.calendarTopNav}>
                  <button
                    style={stylesObj.miniNavBtn}
                    onClick={() => setViewDate(viewDate.subtract(1, "month"))}
                  >
                    <Icon.Back />
                  </button>

                  <div style={stylesObj.calendarSelectors}>
                    <select
                      style={stylesObj.monthSelect}
                      value={viewDate.month()}
                      onChange={(e) =>
                        setViewDate(viewDate.month(parseInt(e.target.value)))
                      }
                    >
                      {months.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      style={stylesObj.yearSelect}
                      value={viewDate.year()}
                      onChange={(e) =>
                        setViewDate(viewDate.year(parseInt(e.target.value)))
                      }
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    style={stylesObj.miniNavBtn}
                    onClick={() => setViewDate(viewDate.add(1, "month"))}
                  >
                    <Icon.Forward />
                  </button>
                </div>

                <div style={stylesObj.calendarGrid}>
                  <span style={stylesObj.gridWeekLabel}>v</span>
                  {["M", "T", "O", "T", "F", "L", "S"].map((d, i) => (
                    <span key={`${d}-${i}`} style={stylesObj.gridWeekday}>
                      {d}
                    </span>
                  ))}

                  {Array.from({ length: 6 }, (_, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                      <div style={stylesObj.weekNumberCell}>
                        {calendarWeeks[weekIndex]}
                      </div>

                      {calendarDays
                        .slice(weekIndex * 7, weekIndex * 7 + 7)
                        .map((d, i) => {
                          const isSelected = d?.isSame(pickerDate, "day");
                          const isToday = d?.isSame(realToday, "day");

                          return (
                            <button
                              key={`${weekIndex}-${i}`}
                              disabled={!d}
                              onClick={() => {
                                if (d) {
                                  onDateChange(d);
                                  onCloseDatePicker();
                                }
                              }}
                              style={{
                                ...stylesObj.gridDayBase,
                                ...(isSelected
                                  ? stylesObj.gridDaySelected
                                  : {}),
                                ...(isToday ? stylesObj.gridDayToday : {}),
                              }}
                            >
                              {d?.date()}
                              {isToday && <span style={stylesObj.todayDot} />}
                            </button>
                          );
                        })}
                    </React.Fragment>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setViewDate(realToday);
                    onDateChange(realToday);
                  }}
                  style={stylesObj.btnToday}
                >
                  VISA IDAG I KALENDERN
                </button>
              </div>

              <div style={stylesObj.holidaySection}>
                <div style={stylesObj.holidayHeader}>
                  HELGDAGAR {viewDate.year()}
                </div>

                <div style={stylesObj.holidayList}>
                  {getSwedishHolidays(viewDate.year()).map((h) => {
                    const daysLeftText = getDaysLeft(h.date);
                    const isUpcoming = !daysLeftText.includes("Passerad");

                    return (
                      <div
                        key={h.name}
                        onClick={() => {
                          onDateChange(h.date);
                          onCloseDatePicker();
                        }}
                        style={{
                          ...stylesObj.holidayItem,
                          ...(h.date.isSame(pickerDate, "day")
                            ? stylesObj.holidayItemSelected
                            : {}),
                        }}
                      >
                        <div style={stylesObj.holidayRowContent}>
                          <div style={stylesObj.hInfo}>
                            <span style={stylesObj.hName}>{h.name}</span>
                            <span style={stylesObj.hDateUnder}>
                              {h.date.format("dddd D MMMM")} • v.
                              {h.date.isoWeek()}
                            </span>
                          </div>

                          <span
                            style={{
                              ...stylesObj.daysLeftBadge,
                              ...(!isUpcoming
                                ? stylesObj.daysLeftPassed
                                : daysLeftText === "Idag"
                                  ? stylesObj.daysLeftToday
                                  : {}),
                            }}
                          >
                            {daysLeftText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default memo(TimelineHeader);
