import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  DialogActions,
  DialogTitle,
  Typography,
  useTheme,
  alpha,
  InputAdornment,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import DeleteIcon from "@mui/icons-material/Delete";

export interface GroupFormProps {
  title: string;
  initialName?: string;
  isEditMode?: boolean;
  onSave: (name: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({
  title,
  initialName = "",
  isEditMode = false,
  onSave,
  onDelete,
  onClose,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [isFocused, setIsFocused] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  const maxLength = 50;
  const minAlphabetChars = 3;

  // Återställ formuläret när det öppnas/props ändras
  useEffect(() => {
    setName(initialName);
    setSaveAttempted(false);
  }, [initialName]);

  // Räkna endast faktiska bokstäver (inte siffror/mellanslag) enligt din original-regex
  const countAlphabetChars = (text: string) => {
    const alphabetRegex = /[a-zA-ZåäöÅÄÖ]/g;
    const matches = text.match(alphabetRegex);
    return matches ? matches.length : 0;
  };

  const alphabetCount = countAlphabetChars(name);
  const isNameValid =
    name.trim().length > 0 && alphabetCount >= minAlphabetChars;
  const showError = saveAttempted && !isNameValid;

  const handleSave = () => {
    if (isNameValid) {
      onSave(name.trim());
    } else {
      setSaveAttempted(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };


  return (
    <Box>
      <DialogTitle
        component="div"
        sx={{
          p: 0,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <GroupsIcon sx={{ color: "primary.main", fontSize: "1.5rem" }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          {title}
        </Typography>
      </DialogTitle>

      <TextField
        fullWidth
        autoFocus
        label="Gruppnamn"
        value={name}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) setName(e.target.value);
        }}
        onKeyPress={handleKeyPress}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        error={showError}
       
        placeholder="Ange gruppnamn..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <GroupsIcon color={isFocused ? "primary" : "action"} />
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 1,
          },
        }}
      />

      <DialogActions
        sx={{
          px: 0,
          pb: 0,
          pt: 2,
          justifyContent: "space-between",
        }}
      >
        {/* Ta bort-knapp visas endast vid redigering */}
        <Box>
          {isEditMode && onDelete && (
            <Button
              color="error"
              variant="outlined"
              onClick={onDelete}
              startIcon={<DeleteIcon />}
              sx={{ borderRadius: 1 }}
            >
              Ta bort
            </Button>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 1 }}>
            Avbryt
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            // ÄNDRING HÄR: Knappen är låst tills valideringen går igenom
            disabled={!isNameValid}
            sx={{
              borderRadius: 1,
              px: 4,
              fontWeight: 600,
              boxShadow: "none",
              // Gör knappen gråaktig när den är disabled
              "&.Mui-disabled": {
                background: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
              "&:not(.Mui-disabled)": {
                background: isEditMode
                  ? `linear-gradient(135deg, ${
                      theme.palette.warning.main
                    } 0%, ${alpha(theme.palette.warning.dark, 0.9)} 100%)`
                  : `linear-gradient(135deg, ${
                      theme.palette.primary.main
                    } 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
              },
            }}
          >
            {isEditMode ? "Spara" : "Skapa"}
          </Button>
        </Box>
      </DialogActions>
    </Box>
  );
};

export default GroupForm;
