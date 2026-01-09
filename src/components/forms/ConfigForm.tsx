import React, { useState } from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  DialogActions,
  DialogTitle,
  Paper,
} from "@mui/material";

export interface ConfigFormProps {
  title?: string;
  blockPastDays: boolean;
  disableDeletion: boolean;
  onUpdate: (key: string, value: boolean) => void;
  onClose?: () => void; // must be optional for global dialog
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  title,
  blockPastDays: initialBlock,
  disableDeletion: initialDisable,
  onUpdate,
  onClose,
}) => {
  const [block, setBlock] = useState(initialBlock);
  const [disable, setDisable] = useState(initialDisable);

  const handleBlockChange = (val: boolean) => {
    setBlock(val);
    onUpdate("blockPastDays", val);

    if (!val) {
      setDisable(false);
      onUpdate("disableDeletion", false);
    }
  };

  const handleDisableChange = (val: boolean) => {
    setDisable(val);
    onUpdate("disableDeletion", val);
  };

  return (
    <Box>
      {title && (
        <DialogTitle sx={{ fontWeight: 800, px: 0 }}>{title}</DialogTitle>
      )}
      <Paper sx={{ p: 2 }}>
        <FormGroup sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={block}
                onChange={(e) => handleBlockChange(e.target.checked)}
              />
            }
            label="Spärr för gångna dagar"
          />

          <Box sx={{ pl: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={disable}
                  onChange={(e) => handleDisableChange(e.target.checked)}
                  disabled={!block}
                />
              }
              label="Ta bort möjligheten att radera"
            />
          </Box>
        </FormGroup>
      </Paper>
      <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
        <Button variant="contained" onClick={onClose}>
          Stäng
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ConfigForm;
