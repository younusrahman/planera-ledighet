import React, { createContext, useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Grow,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import {
  PickersLayout,
  type PickersLayoutProps,
} from "@mui/x-date-pickers/PickersLayout";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from "@mui/icons-material/Settings";
import type { Team, TeamWithEmployees } from "../types";
import { useUIActions } from "../services/stores/uiStore";
import { Storage as DatabaseIcon } from "@mui/icons-material";
// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
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
  sidebarMode: "full" | "initials" | "hidden";
  handleDeleteResource: (groupId: string, resId: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleDialogGroupTrigger: (group?: Team) => void;
  handleDialogAbsenceTypeTrigger: () => void;
  handleDialogDatabaseSystemTrigger: () => void;
  handleDialogResourceTrigger: (
    resourceToEdit?: { id: string; name: string },
    currentGroupId?: string,
  ) => void;
  doseHaveAbsenceTypes?: boolean;
  disableDeletion: boolean;
}
// ---------------------------------------------------------
// Holiday Context
// ---------------------------------------------------------
const HolidayContext = createContext({
  holidays: [] as { name: string; date: Dayjs }[],
  onSelectHoliday: (d: Dayjs) => {},
  onClose: () => {}, // <--- LÄGG TILL DENNA RAD
});

const useHolidayContext = () => useContext(HolidayContext);

// ---------------------------------------------------------
// Swedish Holidays Logic
// ---------------------------------------------------------
const FIXED_HOLIDAYS = [
  { name: "Nyårsdagen", date: (y: number) => dayjs(`${y}-01-01`) },
  { name: "Trettondedag jul", date: (y: number) => dayjs(`${y}-01-06`) },
  { name: "Första maj", date: (y: number) => dayjs(`${y}-05-01`) },
  { name: "Nationaldagen", date: (y: number) => dayjs(`${y}-06-06`) },
  { name: "Juldagen", date: (y: number) => dayjs(`${y}-12-25`) },
  { name: "Annandag jul", date: (y: number) => dayjs(`${y}-12-26`) },
];

function easterSunday(year: number): Dayjs {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
  const day = I - ((year + f(year / 4) + I + 2 - C + f(C / 4)) % 7) + 28;
  const month = day > 31 ? 4 : 3;
  const date = day > 31 ? day - 31 : day;
  return dayjs(`${year}-${month}-${date}`);
}

function getSwedishHolidays(year: number) {
  const easter = easterSunday(year);
  return [
    ...FIXED_HOLIDAYS.map((h) => ({ name: h.name, date: h.date(year) })),
    { name: "Långfredagen", date: easter.subtract(2, "day") },
    { name: "Påskdagen", date: easter },
    { name: "Annandag påsk", date: easter.add(1, "day") },
    { name: "Kristi himmelsfärdsdag", date: easter.add(39, "day") },
    { name: "Pingstdagen", date: easter.add(49, "day") },
  ].sort((a, b) => a.date.diff(b.date));
}

// ---------------------------------------------------------
// Custom Layout: Calendar on Left, Holidays on Right
// ---------------------------------------------------------
function HolidayLayout(props: PickersLayoutProps<any>) {
  const { holidays, onSelectHoliday, onClose } = useHolidayContext();

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" } }}>
      <Box>
        <PickersLayout {...props} />
      </Box>

      <Box sx={{ width: { xs: "100%", sm: 220 } /* ... din styling ... */ }}>
        <Box
          sx={{
            p: 1,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="overline">Helgdagar</Typography>
          <Button
            size="small"
            onClick={() => {
              onClose(); // <--- STÄNGER MENYN
              setTimeout(() => onSelectHoliday(dayjs()), 10);
            }}
          >
            I dag
          </Button>
        </Box>

        <List dense sx={{ maxHeight: 350, overflowY: "auto" }}>
          {holidays.map((h) => (
            <ListItemButton
              key={h.name}
              onClick={() => {
                onClose(); // <--- STÄNGER MENYN OMEDELBART
                setTimeout(() => onSelectHoliday(h.date), 10); // HOPPAR TILL DATUM
              }}
            >
              <ListItemText
                primary={h.name}
                secondary={h.date.format("D MMM")}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  groups,
  pickerDate,
  isDatePickerOpen,
  datePickerAnchorRef,
  onPrevMonth,
  onNextMonth,
  onOpenDatePicker,
  onCloseDatePicker,
  onDateChange,
  handleDeleteResource,
  handleDeleteGroup,
  handleDialogGroupTrigger,
  handleDialogAbsenceTypeTrigger,
  handleDialogResourceTrigger,
  handleDialogDatabaseSystemTrigger,
  openConfig,
  doseHaveAbsenceTypes,
  disableDeletion,
}) => {
  const theme = useTheme();
  const { setSidebarMode } = useUIActions();
  const [mainMenuAnchor, setMainMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [resourceMenuAnchor, setResourceMenuAnchor] =
    useState<null | HTMLElement>(null);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null,
  );
  const closeMenus = () => {
    setMainMenuAnchor(null);
    setGroupMenuAnchor(null);
    setResourceMenuAnchor(null);
  };
  console.log("TimelineHeader rendered selectedGroupId", selectedGroupId);
  console.log("TimelineHeader rendered selectedResourceId", selectedResourceId);
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 }, py: 1 }}>
        {/* Title & Filters */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "text.primary" }}
          >
            Planera ledighet
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            bgcolor: "white",
            zIndex: 12,
            borderTop: "1px solid rgb(1, 98, 243)",
            p: 1,
            height: 56,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            fullWidth
            onClick={(e) => setMainMenuAnchor(e.currentTarget)}
            sx={{ fontWeight: 700 }}
          >
            Meny
          </Button>
        </Box>

        {/* --- MENYER --- */}

        {/* Huvudmeny (Botten) */}
        <Menu
          anchorEl={mainMenuAnchor}
          open={Boolean(mainMenuAnchor)}
          onClose={closeMenus}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          slots={{ transition: Grow }}
        >
          <MenuItem
            onClick={() => {
              closeMenus();
              handleDialogAbsenceTypeTrigger();
            }}
          >
            <EventBusyIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till
            frånvarotyper
          </MenuItem>
          <MenuItem
            disabled={!doseHaveAbsenceTypes}
            onClick={() => {
              closeMenus();
              handleDialogGroupTrigger();
            }}
          >
            <GroupsIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till grupp
          </MenuItem>
          <MenuItem
            disabled={groups.length === 0}
            onClick={() => {
              handleDialogResourceTrigger(undefined, selectedGroupId!);
              closeMenus();
            }}
          >
            <PersonIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till anställda
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenus();
              openConfig();
            }}
          >
            <SettingsIcon fontSize="small" sx={{ mr: 1.5 }} /> Konfigurera
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenus();
              handleDialogDatabaseSystemTrigger();
            }}
          >
            <DatabaseIcon fontSize="small" sx={{ mr: 1.5 }} />
            Databassystem
          </MenuItem>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="overline"
              display="block"
              sx={{
                color: "text.secondary",
                fontSize: "0.75rem",
                textAlign: "center",
                mt: 1,
                borderTop: "1px solid rgba(0,0,0,0.1)",
                pt: 1,
                fontWeight: 700,
              }}
            >
              Sidebar
            </Typography>
            <Button
              sx={{ fontSize: "13px", fontWeight: 700 }}
              variant="text"
              onClick={() => setSidebarMode("full")}
            >
              Full
            </Button>
            |
            <Button
              sx={{ fontSize: "13px", fontWeight: 700 }}
              variant="text"
              onClick={() => setSidebarMode("initials")}
            >
              Compact
            </Button>
            |
            <Button
              sx={{ fontSize: "13px", fontWeight: 700 }}
              variant="text"
              onClick={() => setSidebarMode("hidden")}
            >
              Hidden
            </Button>
          </Box>
        </Menu>

        {/* Resursmeny (Anställd) */}
        <Menu
          anchorEl={resourceMenuAnchor}
          open={Boolean(resourceMenuAnchor)}
          onClose={closeMenus}
          slots={{ transition: Grow }}
        >
          <MenuItem
            onClick={() => {
              const group = groups.find((g) => g.id === selectedGroupId);
              const res = (group?.employees || []).find(
                (r) => r.id === selectedResourceId,
              );
              if (res) handleDialogResourceTrigger(res, selectedGroupId!);
              closeMenus();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Redigera
          </MenuItem>
          {!disableDeletion && (
            <MenuItem
              onClick={() => {
                if (selectedGroupId && selectedResourceId)
                  handleDeleteResource(selectedGroupId, selectedResourceId);
                closeMenus();
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Ta bort
            </MenuItem>
          )}
        </Menu>

        {/* Gruppmeny */}
        <Menu
          anchorEl={groupMenuAnchor}
          open={Boolean(groupMenuAnchor)}
          onClose={closeMenus}
          slots={{ transition: Grow }}
        >
          <MenuItem
            onClick={() => {
              handleDialogResourceTrigger(undefined, selectedGroupId!);
              closeMenus();
            }}
          >
            <AddIcon fontSize="small" sx={{ mr: 1.5 }} /> Lägg till anställd
          </MenuItem>
          <MenuItem
            onClick={() => {
              const group = groups.find((g) => g.id === selectedGroupId);
              if (group) handleDialogGroupTrigger(group);
              closeMenus();
            }}
          >
            <EditIcon fontSize="small" sx={{ mr: 1.5 }} /> Redigera
          </MenuItem>
          {!disableDeletion && (
            <MenuItem
              onClick={() => {
                if (selectedGroupId) handleDeleteGroup(selectedGroupId);
                closeMenus();
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Ta bort
            </MenuItem>
          )}
        </Menu>
        <Box sx={{ flexGrow: 1 }} />

        {/* Date Navigation */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={onPrevMonth}>
            <ArrowBackIosNewIcon sx={{ fontSize: "1rem" }} />
          </IconButton>

          <Button
            ref={datePickerAnchorRef}
            onClick={onOpenDatePicker}
            startIcon={<CalendarMonthIcon sx={{ color: "primary.main" }} />}
            sx={{
              minWidth: 160,
              borderRadius: 1,
              fontWeight: 600,
              textTransform: "none",
              color: "text.primary",
              border: `1px solid ${theme.palette.divider}`,
              "&:hover": { borderColor: "primary.main" },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {pickerDate.format("D MMM YYYY")}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "text.secondary", fontSize: "0.7rem" }}
              >
                Vecka {pickerDate.isoWeek()}
              </Typography>
            </Box>
          </Button>

          <IconButton size="small" onClick={onNextMonth}>
            <ArrowForwardIosIcon sx={{ fontSize: "1rem" }} />
          </IconButton>
        </Box>

        {/* DatePicker Configuration */}
        <HolidayContext.Provider
          value={{
            holidays: getSwedishHolidays(pickerDate.year()),
            onSelectHoliday: (d: Dayjs) => {
              onDateChange(d);
              onCloseDatePicker();
            },
            onClose: onCloseDatePicker,
          }}
        >
          <DatePicker
            displayWeekNumber
            open={isDatePickerOpen}
            value={pickerDate}
            onChange={(newValue) => {
              if (newValue) onDateChange(newValue);
            }}
            onAccept={onCloseDatePicker}
            onClose={onCloseDatePicker}
            slots={{ layout: HolidayLayout }}
            slotProps={{
              textField: { sx: { display: "none" } },
              popper: {
                // HÄR ÄR FIXEN FÖR ATT ÖPPNA TILL HÖGER
                anchorEl: datePickerAnchorRef.current,
                placement: "bottom-end",
              },
            }}
          />
        </HolidayContext.Provider>
      </Toolbar>
    </AppBar>
  );
};
