import React, { useState, useEffect, useMemo } from "react";
import {
  TextField,
  Box,
  Typography,
  Tooltip,
  Button,
  DialogActions,
  DialogTitle,
  useTheme,
  alpha,
  Alert,
  Fade,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import CheckIcon from "@mui/icons-material/Check";
import PaletteIcon from "@mui/icons-material/Palette";
import EditIcon from "@mui/icons-material/Edit";
import LockIcon from "@mui/icons-material/Lock";

const PREDEFINED_COLORS = [
  "#1976d2",
  "#0288d1",
  "#7b1fa2",
  "#512da8",
  "#2e7d32",
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
  title?: string;
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
  title = "Frånvarotyp",
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

  // KOLL 1: Är namnet upptaget av någon ANNAN?
  const isLabelTaken = useMemo(() => {
    const currentLabel = label.trim().toLowerCase();
    if (!currentLabel) return false;
    return absenceTypes.some(
      (t) => t.id !== typeId && t.label.toLowerCase().trim() === currentLabel
    );
  }, [label, absenceTypes, typeId]);

  // KOLL 2: Är färgen upptagen av någon ANNAN?
  const isColorTakenByOther = useMemo(() => {
    const currentColor = color.toLowerCase();
    return absenceTypes.some(
      (t) => t.id !== typeId && t.color.toLowerCase() === currentColor
    );
  }, [color, absenceTypes, typeId]);

  // KOLL 3: Har användaren ändrat något?
  const hasChanges = useMemo(() => {
    if (!isEditMode) return label.trim().length > 0;
    return (
      label.trim() !== initialLabel.trim() ||
      color.toLowerCase() !== initialColor.toLowerCase()
    );
  }, [label, color, initialLabel, initialColor, isEditMode]);

  const isLabelValid = label.trim().length > 0;

  // Spara-knappen aktiveras ENDAST om:
  // 1. Namnet inte är tomt
  // 2. Namnet inte är en dubblett
  // 3. Färgen inte är en dubblett
  // 4. Något har ändrats (vid redigering)
  const canSave =
    isLabelValid &&
    !isLabelTaken &&
    !isColorTakenByOther &&
    hasChanges &&
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
            Namn på frånvarotyp
          </Typography>
          <TextField
            fullWidth
            value={label}
            disabled={isSaving}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => setTouched(true)}
            error={touched && (isLabelTaken || !isLabelValid)}
            helperText={
              touched && !isLabelValid
                ? "Namn krävs"
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
            <Alert severity="error" sx={{ mb: 2, py: 0 }}>
              Denna färg används redan av en annan typ.
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
              gap: 1.5,
            }}
          >
            {PREDEFINED_COLORS.map((c) => {
              const isSelected = color.toLowerCase() === c.toLowerCase();
              const otherUser = absenceTypes.find(
                (t) =>
                  t.id !== typeId && t.color.toLowerCase() === c.toLowerCase()
              );

              return (
                <Tooltip
                  key={c}
                  title={otherUser ? `Används av: ${otherUser.label}` : c}
                >
                  <Box
                    onClick={() => !otherUser && setColor(c)}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      bgcolor: c,
                      cursor: otherUser ? "not-allowed" : "pointer",
                      opacity: otherUser ? 0.4 : 1,
                      outline: isSelected
                        ? `3px solid ${theme.palette.primary.main}`
                        : "none",
                      outlineOffset: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "transform 0.2s",
                      "&:hover": {
                        transform: otherUser ? "none" : "scale(1.1)",
                      },
                    }}
                  >
                    {isSelected && (
                      <CheckIcon
                        sx={{ fontSize: 20, color: getColorContrast(c) }}
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>

        <DialogActions sx={{ px: 0, mt: 2, justifyContent: "space-between" }}>
          <Box>
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
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} variant="outlined">
              Avbryt
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!canSave}
            >
              {isSaving
                ? "Sparar..."
                : isEditMode
                ? "Spara ändringar"
                : "Skapa"}
            </Button>
          </Box>
        </DialogActions>
      </Box>
    </Box>
  );
};

export default AbsenceTypeForm;
export { PREDEFINED_COLORS as predefinedColors };
