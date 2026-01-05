import React, { useState } from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  DialogActions,
} from "@mui/material";

interface ConfigFormProps {
  blockPastDays: boolean;
  disableDeletion: boolean;
  onUpdate: (key: string, value: boolean) => void;
  onClose: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({
  blockPastDays: initialBlock,
  disableDeletion: initialDisable,
  onUpdate,
  onClose,
}) => {
  // 1. Create local state from the initial props
  const [block, setBlock] = useState(initialBlock);
  const [disable, setDisable] = useState(initialDisable);

  // 2. Handle changes locally so the checkbox UI updates immediately
  const handleBlockChange = (val: boolean) => {
    setBlock(val);
    onUpdate("blockPastDays", val);

    // Logic: If block is turned off, disable must also be turned off
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
      <FormGroup>
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
                disabled={!block} // This now works with local state!
              />
            }
            label="Ta bort möjligheten att radera"
          />
        </Box>
      </FormGroup>

      <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
        <Button variant="contained" onClick={onClose}>
          Stäng
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ConfigForm;
