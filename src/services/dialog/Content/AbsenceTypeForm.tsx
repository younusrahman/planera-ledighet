import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Box,
  Typography,
  Button,
  DialogActions,
  DialogTitle,
  useTheme,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import CheckIcon from "@mui/icons-material/Check";

export const PREDEFINED_COLORS = [
  "#1976d2",
  "#0288d1",
  "#7b1fa2",
  "#512da8",
  "#1e21ed",
  "#00796b",
  "#689f38",
  "#d32f2f",
  "#c2185b",
  "#ad1457",
  "#ed6c02",
  "#f57c00",
  "#ffa000",
  "#afb42b",
  "#616161",
  "#455a64",
  "#5d4037",
  "#00acc1",
  "#e64a19",
  "#303f9f",
];

export interface AbsenceTypeFormProps {
  initialLabel?: string;
  initialColor?: string;
  typeId?: string; // ID på den post vi redigerar
  absenceTypes: { id: string; color: string; label: string }[];
  isEditMode?: boolean;
  onSave: (label: string, color: string) => void;
  onDelete?: () => void;
  onClose?: () => void;
}

const AbsenceTypeForm: React.FC<AbsenceTypeFormProps> = ({
  initialLabel = "",
  initialColor = "",
  typeId,
  absenceTypes = [],
  isEditMode = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const theme = useTheme();

  const [label, setLabel] = useState(initialLabel);
  const [color, setColor] = useState(initialColor || PREDEFINED_COLORS[0]);
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLabel(initialLabel);
    setColor(initialColor || PREDEFINED_COLORS[0]);
    setTouched(false);
  }, [initialLabel, initialColor, typeId]);

  // Kontrollera om namnet är upptaget (exkludera den vi redigerar)
  const isLabelTaken = useMemo(() => {
    const currentLabel = label.trim().toLowerCase();
    if (currentLabel.length === 0) return false;
    return absenceTypes.some(
      (t) => t.id !== typeId && t.label.toLowerCase().trim() === currentLabel,
    );
  }, [label, absenceTypes, typeId]);

  // Kontrollera om färgen är upptagen (exkludera den vi redigerar)
  const isColorTakenByOther = useMemo(() => {
    const currentColor = color.toLowerCase();
    return absenceTypes.some(
      (t) => t.id !== typeId && t.color.toLowerCase() === currentColor,
    );
  }, [color, absenceTypes, typeId]);

  // Kontrollera om ändringar gjorts (viktigt för redigering)
  const hasChanges = useMemo(() => {
    return (
      label.trim() !== initialLabel.trim() ||
      color.toLowerCase() !== initialColor.toLowerCase()
    );
  }, [label, color, initialLabel, initialColor]);

  // Validera längd (Minst 3 tecken)
  const isLabelValid = label.trim().length >= 3;

  // Spara-knappen aktiveras om:
  // 1. Namnet är giltigt (3+ tecken)
  // 2. Namnet inte är upptaget
  // 3. Färgen inte är upptagen
  // 4. Om vi redigerar: något måste ha ändrats. Om ny: alltid true.
  const canSave =
    isLabelValid &&
    !isLabelTaken &&
    !isColorTakenByOther &&
    (!isEditMode || hasChanges) &&
    !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSave(label.trim(), color);
    } finally {
      setIsSaving(false);
    }
  };

  const getColorContrast = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  return (
    <Box>
      <DialogTitle
        sx={{
          p: 0,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontWeight: 600,
        }}
      >
        <ColorLensIcon color="primary" />
        {isEditMode ? "Redigera frånvarotyp" : "Ny frånvarotyp"}
      </DialogTitle>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Namn på frånvarotyp (minst 3 tecken)
          </Typography>
          <TextField
            fullWidth
            value={label}
            disabled={isSaving}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setTouched(true)}
            error={touched && (!isLabelValid || isLabelTaken)}
            helperText={
              touched && !isLabelValid
                ? "Minst 3 tecken krävs"
                : isLabelTaken
                  ? "Detta namn används redan"
                  : " "
            }
          />
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Välj färg
          </Typography>

          {isColorTakenByOther && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Denna färg används redan. Välj en annan färg-cirkel.
            </Alert>
          )}

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {PREDEFINED_COLORS.map((c) => {
              const isSelected = color.toLowerCase() === c.toLowerCase();
              const isUsedByOther = absenceTypes.some(
                (t) =>
                  t.id !== typeId && t.color.toLowerCase() === c.toLowerCase(),
              );

              return (
                <Box
                  key={c}
                  onClick={() => !isUsedByOther && setColor(c)}
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    bgcolor: c,
                    cursor: isUsedByOther ? "not-allowed" : "pointer",
                    opacity: isUsedByOther ? 0.3 : 1,
                    border: isSelected
                      ? `3px solid ${theme.palette.primary.main}`
                      : "2px solid transparent",
                    boxShadow: isSelected ? theme.shadows[3] : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": {
                      transform: isUsedByOther ? "none" : "scale(1.1)",
                    },
                  }}
                >
                  {isSelected && (
                    <CheckIcon
                      sx={{ fontSize: 20, color: getColorContrast(c) }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>

        <DialogActions sx={{ px: 0, mt: 2 }}>
          {isEditMode && onDelete && (
            <Button
              color="error"
              onClick={onDelete}
              startIcon={<DeleteIcon />}
              variant="outlined"
            >
              Ta bort
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={onClose} variant="outlined" sx={{ mr: 1 }}>
            Avbryt
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>
            {isSaving ? "Sparar..." : isEditMode ? "Spara" : "Skapa"}
          </Button>
        </DialogActions>
      </Box>
    </Box>
  );
};

export default AbsenceTypeForm;
export { PREDEFINED_COLORS as predefinedColors };
