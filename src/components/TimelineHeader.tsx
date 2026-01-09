import React from "react";
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
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";

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
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        backdropFilter: "blur(8px)",
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9))",
      }}
    >
      <Toolbar
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1,
          minHeight: { xs: 64, sm: 72 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.1rem", sm: "1.25rem" },
              color: "text.primary",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Planera ledighet
          </Typography>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 1.5,
              ml: 1,
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
                        border: `1px solid ${alpha("#000", 0.1)}`,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 500, color: "text.secondary" }}
                    >
                      {type.label}
                    </Typography>
                  </Box>
                }
                size="small"
                sx={{
                  height: 28,
                  borderRadius: 1.5,
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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.5, sm: 1 },
          }}
        >
          <IconButton size="small" onClick={onPrevMonth}>
            <ArrowBackIosNewIcon sx={{ fontSize: "1rem" }} />
          </IconButton>

          <Button
            ref={datePickerAnchorRef}
            onClick={onOpenDatePicker}
            startIcon={<CalendarMonthIcon sx={{ color: "primary.main" }} />}
            sx={{
              minWidth: { xs: 140, sm: 160 },
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
        {/* --- THE DATEPICKER IS NOW MOVED HERE --- */}
        <DatePicker
          displayWeekNumber
          open={isDatePickerOpen}
          desktopModeMediaQuery="@media (min-width: 0px)"
          value={pickerDate}
          onChange={(newValue) => {
            if (newValue) onDateChange(newValue);
          }}
          onAccept={onCloseDatePicker}
          onClose={onCloseDatePicker}
          slotProps={{
            textField: { sx: { display: "none" } },
            popper: {
              anchorEl: datePickerAnchorRef.current,
              placement: "bottom-end",
            },
            actionBar: {
              actions: ["today"],
            },
          }}
        />
      </Toolbar>
    </AppBar>
  );
};
