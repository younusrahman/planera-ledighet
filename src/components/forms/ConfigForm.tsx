import React, { useState } from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Button,
  DialogTitle,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import { Lock, Delete, Close } from "@mui/icons-material";

export interface ConfigFormProps {
  title?: string;
  blockPastDays: boolean;
  disableDeletion: boolean;
  onUpdate: (key: string, value: boolean) => void;
  onClose?: () => void;
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
    <Box sx={{ maxWidth: 500 }}>
      {title && (
        <DialogTitle sx={{ px: 0, pt: 0, fontWeight: 600 }}>
          {title}
        </DialogTitle>
      )}

      <Stack >
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 3 }}>
          Inställningar
        </Typography>

        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={block}
                onChange={(e) => handleBlockChange(e.target.checked)}
                icon={<Lock sx={{ opacity: 0.6 }} />}
                checkedIcon={<Lock color="primary" />}
                size="medium"
              />
            }
            label={
              <Box>
                <Typography variant="body1" fontWeight={550}>
                  Spärr för gångna dagar
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Förhindrar ändringar av historiska data
                </Typography>
              </Box>
            }
            sx={{ mb: 2 }}
          />

          <Box sx={{ ml: 5 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={disable}
                  onChange={(e) => handleDisableChange(e.target.checked)}
                  disabled={!block}
                  icon={<Delete sx={{ opacity: 0.6 }} />}
                  checkedIcon={<Delete color="error" />}
                  size="medium"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight={550}>
                    Ta bort möjligheten att radera
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Permanent borttagning av raderingsfunktionen
                  </Typography>
                </Box>
              }
              sx={{
                opacity: block ? 1 : 0.6,
                transition: "opacity 0.2s",
              }}
            />
          </Box>
        </FormGroup>

        <Stack direction="row" spacing={2} sx={{ mt: 4, pt: 2, }}>
          <Button
            variant="outlined"
            startIcon={<Close />}
            color="warning"
            onClick={onClose}
            sx={{
              flex: 1,
              borderRadius: 1.5,
              py: 1,
            }}
          >
            Stäng
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ConfigForm;
