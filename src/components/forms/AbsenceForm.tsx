import React, { useState } from "react";
import {
  TextField,
  Box,
  Typography,
  Tooltip,
  Button,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface AbsenceTypeFormProps {
  initialLabel?: string;
  initialColor?: string;
  typeId?: string;
  absenceTypes: { id: string; color: string }[];
  predefinedColors: string[];
  onSave: (label: string, color: string) => void;
  onDelete?: () => void; // Optional: Only show if editing
  onClose: () => void;
}

const AbsenceTypeForm: React.FC<AbsenceTypeFormProps> = ({
  initialLabel = "",
  initialColor = "#ddd",
  typeId,
  absenceTypes,
  predefinedColors,
  onSave,
  onDelete,
  onClose,
}) => {
  const [label, setLabel] = useState(initialLabel);
  const [color, setColor] = useState(initialColor);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
      <TextField
        autoFocus
        label="Namn"
        fullWidth
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <Box>
        <Typography
          variant="caption"
          sx={{ fontWeight: 700, mb: 1, display: "block" }}
        >
          Välj färg:
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))",
            gap: 1,
          }}
        >
          {predefinedColors.map((c) => {
            const isSelected = color.toLowerCase() === c.toLowerCase();
            const isTaken = absenceTypes.some(
              (t) =>
                t.color.toLowerCase() === c.toLowerCase() && t.id !== typeId
            );

            return (
              <Tooltip title={c} key={c}>
                <Box
                  onClick={() => !isTaken && setColor(c)}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: c,
                    cursor: isTaken ? "not-allowed" : "pointer",
                    opacity: isTaken ? 0.3 : 1,
                    border: isSelected ? "3px solid #1976d2" : "1px solid #ddd",
                    transition: "transform 0.1s ease",
                    "&:hover": { transform: isTaken ? "none" : "scale(1.15)" },
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <DialogActions sx={{ px: 0, pb: 0, justifyContent: "space-between" }}>
        {onDelete ? (
          <Button color="error" onClick={onDelete} startIcon={<DeleteIcon />}>
            Ta bort
          </Button>
        ) : (
          <Box />
        )}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose}>Avbryt</Button>
          <Button variant="contained" onClick={() => onSave(label, color)}>
            Spara
          </Button>
        </Box>
      </DialogActions>
    </Box>
  );
};

export default AbsenceTypeForm;
