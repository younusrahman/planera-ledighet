import React, { memo, useState, useRef, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { type Team, type TeamWithEmployees } from "../types";
import { useUIActions, type SidebarMode } from "../services/stores/uiStore";

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
  const { setSidebarMode } = useUIActions();
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [viewDate, setViewDate] = useState(pickerDate);

  const mainMenuRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const modes: SidebarMode[] = ["full", "initials", "hidden"];

  useEffect(() => {
    if (isDatePickerOpen) setViewDate(pickerDate);
  }, [isDatePickerOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showMainMenu &&
        mainMenuRef.current &&
        !mainMenuRef.current.contains(e.target as Node)
      )
        setShowMainMenu(false);
      if (
        isDatePickerOpen &&
        datePopoverRef.current &&
        !datePopoverRef.current.contains(e.target as Node) &&
        !datePickerAnchorRef.current?.contains(e.target as Node)
      )
        onCloseDatePicker();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMainMenu, isDatePickerOpen, onCloseDatePicker, datePickerAnchorRef]);

  // Kalender-grid beräkning
  const startOfMonth = viewDate.startOf("month");
  const daysInMonth = viewDate.daysInMonth();
  const startDayOfWeek = (startOfMonth.day() + 6) % 7;
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDayOfWeek + 1;
    return day > 0 && day <= daysInMonth ? startOfMonth.date(day) : null;
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

  return (
    <header className="timeline-header">
      <h1 className="header-title">Planera ledighet</h1>
      <div style={{ flexGrow: 1 }} />

      <div style={{ position: "relative" }} ref={mainMenuRef}>
        <button
          onClick={() => setShowMainMenu(!showMainMenu)}
          className="btn-menu"
        >
          Meny
        </button>
        {showMainMenu && (
          <div className="dropdown-anim dropdown-box">
            <div
              className="menu-item"
              onClick={() => {
                setShowMainMenu(false);
                handleDialogAbsenceTypeTrigger();
              }}
            >
              <Icon.EventBusy /> Frånvarotyper
            </div>
            <div
              className="menu-item"
              style={{ opacity: doseHaveAbsenceTypes ? 1 : 0.5 }}
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
              className="menu-item"
              style={{ opacity: groups.length > 0 ? 1 : 0.5 }}
              onClick={() => {
                if (groups.length > 0) {
                  setShowMainMenu(false);
                  handleDialogResourceTrigger();
                }
              }}
            >
              <Icon.User /> Lägg till anställda
            </div>
            <div className="menu-sep" />
            <div
              className="menu-item"
              onClick={() => {
                setShowMainMenu(false);
                openDataManagement();
              }}
            >
              <Icon.Table /> Data Management
            </div>
            <div
              className="menu-item"
              onClick={() => {
                setShowMainMenu(false);
                openAnalyticsDashboard();
              }}
            >
              <Icon.Chart /> Analytics
            </div>
            <div
              className="menu-item"
              onClick={() => {
                setShowMainMenu(false);
                openConfig();
              }}
            >
              <Icon.Settings /> Konfigurera
            </div>
            <div
              className="menu-item"
              onClick={() => {
                setShowMainMenu(false);
                handleDialogDatabaseSystemTrigger();
              }}
            >
              <Icon.Database /> Databassystem
            </div>
            <div className="sidebar-mode-toggle">
              <div className="toggle-track">
                <div
                  className="toggle-thumb"
                  style={{
                    left: `${modes.indexOf(sidebarMode) * 33.33 + 0.5}%`,
                  }}
                />
                {modes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSidebarMode(mode)}
                    className={`toggle-btn ${sidebarMode === mode ? "active" : ""}`}
                  >
                    {mode === "initials"
                      ? "Compact"
                      : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ width: "20px" }} />

      <div className="date-nav-container">
        <button onClick={onPrevMonth} className="nav-icon-btn">
          <Icon.Back />
        </button>
        <div style={{ position: "relative" }}>
          <button
            ref={datePickerAnchorRef}
            onClick={onOpenDatePicker}
            className="picker-trigger"
          >
            <div className="trigger-icon">
              <Icon.Calendar />
            </div>
            <div className="trigger-text">
              <span className="date-display">
                {pickerDate.format("D MMM YYYY")}
              </span>
              <span className="week-display">Vecka {pickerDate.isoWeek()}</span>
            </div>
          </button>

          {isDatePickerOpen && (
            <div ref={datePopoverRef} className="dropdown-anim date-popover">
              <div className="popover-header">
                <span className="header-label">NAVIGERA</span>
                <button onClick={onCloseDatePicker} className="close-btn">
                  STÄNG
                </button>
              </div>

              <div className="popover-content">
                <div className="calendar-section">
                  <div className="calendar-selectors">
                    <select
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
                  <div className="calendar-grid">
                    {["M", "T", "O", "T", "F", "L", "S"].map((d) => (
                      <span key={d} className="grid-weekday">
                        {d}
                      </span>
                    ))}
                    {calendarDays.map((d, i) => {
                      const isSelected = d?.isSame(pickerDate, "day");
                      const isToday = d?.isSame(realToday, "day");
                      return (
                        <button
                          key={i}
                          disabled={!d}
                          onClick={() => {
                            if (d) {
                              onDateChange(d);
                            }
                          }}
                          className={`grid-day ${isSelected ? "selected" : ""} ${isToday ? "is-today" : ""}`}
                        >
                          {d?.date()}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setViewDate(realToday)}
                    className="btn-today"
                  >
                    VISA IDAG I KALENDERN
                  </button>
                </div>

                <div className="holiday-section">
                  <div className="holiday-header">
                    HELGDAGAR {viewDate.year()}
                  </div>
                  <div className="holiday-list custom-scroll">
                    {getSwedishHolidays(viewDate.year()).map((h) => {
                      const daysLeftText = getDaysLeft(h.date);
                      const isUpcoming = !daysLeftText.includes("Passerad");
                      return (
                        <div
                          key={h.name}
                          onClick={() => onDateChange(h.date)}
                          className={`holiday-item ${h.date.isSame(pickerDate, "day") ? "selected-holiday" : ""}`}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              width: "100%",
                            }}
                          >
                            <div className="h-info">
                              <span className="h-name">{h.name}</span>
                              <span className="h-date-under">
                                {h.date.format("dddd D MMMM")}
                              </span>
                            </div>
                            <span
                              className={`days-left-badge ${!isUpcoming ? "passed" : daysLeftText === "Idag" ? "today" : ""}`}
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
          )}
        </div>
        <button onClick={onNextMonth} className="nav-icon-btn">
          <Icon.Forward />
        </button>
      </div>

      <style>{`
        .timeline-header { background: white; border-bottom: 1px solid #ddd; height: 64px; display: flex; align-items: center; padding: 0 24px; position: relative; z-index: 2000; }
        .header-title { font-size: 1.15rem; font-weight: 800; color: #111; margin: 0; }
        .btn-menu { background: #1976d2; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .dropdown-box { position: absolute; top: calc(100% + 10px); right: 0; width: 280px; background: white; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #ddd; overflow: hidden; }
        .menu-item { padding: 10px 16px; display: flex; align-items: center; cursor: pointer; font-size: 14px; gap: 12px; transition: 0.2s; color: #333; }
        .menu-item:hover { background: #f0f7ff; color: #1976d2; padding-left: 20px; }
        .sidebar-mode-toggle { padding: 16px; background: #fcfcfc; border-top: 1px solid #eee; }
        .toggle-track { display: flex; background: #eee; border-radius: 6px; padding: 3px; position: relative; }
        .toggle-thumb { position: absolute; top: 3px; bottom: 3px; width: 32%; background: white; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .toggle-btn { flex: 1; border: none; background: none; font-size: 11px; font-weight: 500; z-index: 1; padding: 8px 0; cursor: pointer; color: #777; }
        .toggle-btn.active { font-weight: 800; color: #1976d2; }
        .date-nav-container { display: flex; align-items: center; gap: 10px; }
        .nav-icon-btn { background: none; border: 1px solid #eee; border-radius: 6px; padding: 10px; cursor: pointer; display: flex; align-items: center; transition: 0.2s; }
        .picker-trigger { display: flex; align-items: center; gap: 14px; padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; }
        .date-display { font-size: 13px; font-weight: 700; color: #333; display: block; }
        .week-display { font-size: 10px; color: #888; font-weight: 500; }
        .date-popover { position: absolute; top: calc(100% + 10px); right: 0; width: 680px; background: white; border-radius: 12px; box-shadow: 0 15px 45px rgba(0,0,0,0.18); border: 1px solid #ddd; overflow: hidden; z-index: 3000; }
        .popover-header { padding: 10px 16px; background: #f9f9f9; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
        .close-btn { background: #333; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 800; cursor: pointer; }
        .close-btn:hover { background: #000; }
        .popover-content { display: flex; }
        .calendar-section { width: 300px; padding: 20px; border-right: 1px solid #eee; }
        .calendar-selectors { display: flex; gap: 10px; margin-bottom: 15px; }
        .calendar-selectors select { flex: 1; padding: 5px; border-radius: 4px; border: 1px solid #ddd; font-weight: 600; outline: none; cursor: pointer; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .grid-weekday { text-align: center; font-size: 11px; font-weight: 800; color: #ccc; }
        .grid-day { position: relative; aspect-ratio: 1; border: none; background: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600; color: #444; }
        .grid-day:hover:not(:disabled) { background: #f0f7ff; color: #1976d2; }
        .grid-day.selected { background: #1976d2; color: white; }
        .grid-day.is-today::after { content: ""; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; background: #d32f2f; border-radius: 50%; }
        .btn-today { margin-top: 15px; width: 100%; border: 1px solid #1976d2; color: #1976d2; background: white; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 800; cursor: pointer; }
        .holiday-section { flex: 1; background: #fdfdfd; }
        .holiday-header { padding: 15px 20px; font-size: 11px; font-weight: 800; color: #1976d2; border-bottom: 1px solid #f5f5f5; }
        .holiday-list { max-height: 320px; overflow-y: auto; padding: 10px 0; }
        .holiday-item { padding: 12px 20px; cursor: pointer; border-bottom: 1px solid #fafafa; display: flex; transition: 0.2s; }
        .holiday-item:hover { background: #f8faff; padding-left: 28px; }
        .holiday-item.selected-holiday { background: #f0f7ff; border-left: 4px solid #1976d2; padding-left: 16px; }
        .h-info { display: flex; flex-direction: column; flex: 1; }
        .h-name { font-size: 13px; font-weight: 700; color: #333; }
        .h-date-under { font-size: 11px; color: #999; margin-top: 2px; }
        .days-left-badge { font-size: 10px; font-weight: 700; color: #1976d2; background: #e3f2fd; padding: 2px 8px; border-radius: 10px; white-space: nowrap; margin-left: 10px; }
        .days-left-badge.passed { color: #999; background: #eee; }
        .days-left-badge.today { color: #d32f2f; background: #ffebee; }
        .dropdown-anim { animation: popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top right; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .custom-scroll::-webkit-scrollbar { width: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
      `}</style>
    </header>
  );
};

export default memo(TimelineHeader);
