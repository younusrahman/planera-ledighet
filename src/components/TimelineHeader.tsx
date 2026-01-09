import React, { createContext, useContext } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  alpha,
  useTheme,
  List,
  ListItemButton,
  ListItemText,
  Divider,
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
// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
interface TimelineHeaderProps {
  absenceTypes: any[];
  pickerDate: Dayjs;
  isDatePickerOpen: boolean;
  datePickerAnchorRef: React.RefObject<HTMLButtonElement>;
  onAbsenceTypeClick: (type: any) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenDatePicker: () => void;
  onCloseDatePicker: () => void;
  onDateChange: (date: Dayjs) => void;
}
// ---------------------------------------------------------
// Holiday Context
// ---------------------------------------------------------
const HolidayContext = createContext({
  holidays: [] as { name: string; date: Dayjs }[],
  onSelectHoliday: (d: Dayjs) => {},
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
  const { holidays, onSelectHoliday } = useHolidayContext();

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" } }}>
      {/* Vänster: Standardkalender */}
      <Box>
        <PickersLayout {...props} />
      </Box>

      {/* Höger: Panel med Helgdagar och den nya "I dag"-knappen */}
      <Box
        sx={{
          width: { xs: "100%", sm: 220 },
          borderLeft: { xs: "none", sm: "1px solid #eee" },
          borderTop: { xs: "1px solid #eee", sm: "none" },
          bgcolor: alpha("#000", 0.02),
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Rubrikrad med "Helgdagar" och "I dag"-knapp */}
        <Box
          sx={{
            p: 1,
            px: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #eee",
          }}
        >
          <Typography
            variant="overline"
            sx={{ fontWeight: 700, color: "text.secondary", lineHeight: 2.5 }}
          >
            Helgdagar
          </Typography>

          <Button
            size="small"
            variant="text"
            onClick={() => onSelectHoliday(dayjs())} // Hoppar till dagens datum
            sx={{ fontSize: "0.65rem", fontWeight: 700 }}
          >
            I dag
          </Button>
        </Box>

        <List dense sx={{ maxHeight: 350, overflowY: "auto" }}>
          {holidays.map((h) => (
            <ListItemButton
              key={h.name + h.date.toString()}
              onClick={() => onSelectHoliday(h.date)}
            >
              <ListItemText
                primary={h.name}
                secondary={h.date.format("D MMM")}
                primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
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
  absenceTypes,
  pickerDate,
  isDatePickerOpen,
  datePickerAnchorRef,
  onAbsenceTypeClick,
  onPrevMonth,
  onNextMonth,
  onOpenDatePicker,
  onCloseDatePicker,
  onDateChange,
}) => {
  const theme = useTheme();

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
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {absenceTypes.map((type) => (
              <Chip
                key={type.id}
                onClick={() => onAbsenceTypeClick(type)}
                label={
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: type.color,
                      }}
                    />
                    <Typography variant="caption">{type.label}</Typography>
                  </Box>
                }
                size="small"
                sx={{
                  cursor: "pointer",
                  bgcolor: "transparent",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              />
            ))}
          </Box>
        </Box>

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
