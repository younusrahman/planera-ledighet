import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  DialogActions,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Chip,
  InputAdornment,
  Fade,
  useTheme,
  alpha,
  FormHelperText,
  Paper,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TodayIcon from "@mui/icons-material/Today";
import EventIcon from "@mui/icons-material/Event";

export interface AbsenceFormProps {
  title: string;
  mode: "create" | "edit";
  data: {
    typeId: string;
    startDate: any; // dayjs
    duration: number;
  };
  absenceTypes: { id: string; label: string; color: string }[];
  blockPastDays: boolean;
  today: any; // dayjs
  onSave: (data: AbsenceFormProps["data"]) => void;
  onClose?: () => void;
}

export default function AbsenceForm({
  title,
  mode,
  data,
  absenceTypes,
  blockPastDays,
  today,
  onSave,
  onClose,
}: AbsenceFormProps) {
  const theme = useTheme();
  const [state, setState] = useState(data);
  const [touched, setTouched] = useState({
    typeId: false,
    startDate: false,
    duration: false,
  });

  const isFormValid = state.typeId !== "" && state.duration > 0;
  const selectedType = absenceTypes.find((t) => t.id === state.typeId);
  const endDate = state.startDate.add(state.duration - 1, "day");

  useEffect(() => {
    setState(data);
    setTouched({ typeId: false, startDate: false, duration: false });
  }, [data]);

  const handleSave = () => {
    if (!isFormValid) {
      setTouched({ typeId: true, startDate: true, duration: true });
      return;
    }
    onSave(state);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFormValid) {
      handleSave();
    }
  };

  const handleTypeChange = (e: any) => {
    setState((prev) => ({
      ...prev,
      typeId: e.target.value,
    }));
    if (touched.typeId) setTouched((prev) => ({ ...prev, typeId: false }));
  };

  const handleStartDateChange = (date: any) => {
    if (!date) return;
    const newStart = date.startOf("day");
    const diff = endDate.diff(newStart, "day") + 1;

    setState((prev) => ({
      ...prev,
      startDate: newStart,
      duration: Math.max(1, diff),
    }));
    if (touched.startDate)
      setTouched((prev) => ({ ...prev, startDate: false }));
  };

  const handleEndDateChange = (date: any) => {
    if (!date) return;
    const newEnd = date.startOf("day");
    const diff = newEnd.diff(state.startDate, "day") + 1;

    setState((prev) => ({
      ...prev,
      duration: Math.max(1, diff),
      ...(diff < 1 && { startDate: newEnd }),
    }));
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = parseInt(e.target.value) || 1;
    setState((prev) => ({
      ...prev,
      duration: Math.max(1, d),
    }));
    if (touched.duration) setTouched((prev) => ({ ...prev, duration: false }));
  };

  return (
    <>
      <DialogTitle
        sx={{
          m: 0,
          px: 0,
          fontWeight: 600,
          fontSize: "1.25rem",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <EventAvailableIcon
          sx={{ color: "primary.main", fontSize: "1.5rem" }}
        />
        {title}
      </DialogTitle>

      <Stack spacing={3}>
        {/* TYPE SELECT */}
        <FormControl
          fullWidth
          error={touched.typeId && !state.typeId}
          variant="filled"
          sx={{
            "& .MuiFilledInput-root": {
              borderRadius: 1,
              backgroundColor: "action.hover",
              "&:hover": {
                backgroundColor: "action.selected",
              },
              "&.Mui-focused": {
                backgroundColor: "action.selected",
              },
            },
          }}
        >
          <InputLabel>Typ av frånvaro</InputLabel>
          <Select
            value={state.typeId}
            label="Typ av frånvaro"
            onChange={handleTypeChange}
            onBlur={() => setTouched((prev) => ({ ...prev, typeId: true }))}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: 1,
                  mt: 0.5,
                },
              },
            }}
          >
            {absenceTypes.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: opt.color,
                    }}
                  />
                  <Typography>{opt.label}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </Select>
          {touched.typeId && !state.typeId && (
            <FormHelperText>Välj en frånvarotyp</FormHelperText>
          )}
        </FormControl>

        {/* DATE RANGE */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.primary",
            }}
          >
            <CalendarTodayIcon sx={{ fontSize: 18, color: "action.active" }} />
            Datumperiod
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <DatePicker
              label="Startdatum"
              value={state.startDate}
              minDate={blockPastDays ? today : undefined}
              onChange={handleStartDateChange}
              onOpen={() =>
                setTouched((prev) => ({ ...prev, startDate: true }))
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                    },
                  },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <TodayIcon
                          sx={{ color: "action.active", fontSize: "1.25rem" }}
                        />
                      </InputAdornment>
                    ),
                  },
                },
                actionBar: {
                  actions: ["today", "cancel", "accept"],
                },
              }}
            />

            <DatePicker
              label="Slutdatum"
              value={endDate}
              minDate={state.startDate}
              onChange={handleEndDateChange}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                    },
                  },
                  InputProps: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon
                          sx={{ color: "action.active", fontSize: "1.25rem" }}
                        />
                      </InputAdornment>
                    ),
                  },
                },
                actionBar: {
                  actions: ["today", "cancel", "accept"],
                },
              }}
            />
          </Stack>

          {/* Duration Summary */}
          {state.duration > 0 && (
            <Fade in={state.duration > 0}>
              <Paper
                elevation={0}
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {state.duration} {state.duration === 1 ? "dag" : "dagar"}
                    </Box>
                    {" från "}
                    {state.startDate.format("D MMM")}
                    {" till "}
                    {endDate.format("D MMM YYYY")}
                  </Typography>
                  {selectedType && (
                    <Chip
                      label={selectedType.label}
                      size="small"
                      sx={{
                        bgcolor: selectedType.color,
                        color: theme.palette.getContrastText(
                          selectedType.color
                        ),
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  )}
                </Stack>
              </Paper>
            </Fade>
          )}
        </Box>

        {/* DURATION INPUT */}
        <TextField
          label="Antal dagar"
          type="number"
          value={state.duration}
          onChange={handleDurationChange}
          onKeyPress={handleKeyPress}
          onBlur={() => setTouched((prev) => ({ ...prev, duration: true }))}
          error={touched.duration && state.duration < 1}
          fullWidth
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccessTimeIcon
                  sx={{ color: "action.active", fontSize: "1.25rem" }}
                />
              </InputAdornment>
            ),
            inputProps: { min: 1, step: 1 },
            sx: { borderRadius: 1 },
          }}
          helperText={
            touched.duration && state.duration < 1
              ? "Antal dagar måste vara minst 1"
              : "Ange totalt antal dagar för frånvaron"
          }
        />
      </Stack>

      <DialogActions sx={{ px: 0, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 1,
            px: 3,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": {
              borderColor: "action.active",
              backgroundColor: alpha(theme.palette.action.active, 0.04),
            },
          }}
        >
          Avbryt
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isFormValid}
          sx={{
            borderRadius: 1,
            px: 3,
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              boxShadow: theme.shadows[2],
            },
            "&.Mui-disabled": {
              backgroundColor: "action.disabledBackground",
              color: "action.disabled",
              boxShadow: "none",
            },
            "&:not(.Mui-disabled)": {
              background: `linear-gradient(135deg, ${
                theme.palette.primary.main
              } 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
            },
          }}
        >
          {mode === "create" ? "Registrera" : "Spara ändringar"}
        </Button>
      </DialogActions>
    </>
  );
}
