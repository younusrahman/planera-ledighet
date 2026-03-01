import React, { useState, useEffect } from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  DialogActions,
  DialogTitle,
  Typography,
  InputAdornment,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

export interface ResourceFormProps {
  title?: string;
  initialName?: string;
  initialGroupId?: string;
  groups: { id: string; name: string }[];
  onSave: (name: string, groupId: string) => void;
  onClose: () => void;
}

const TeamForm: React.FC<ResourceFormProps> = ({
  title = "Anställd",
  initialName = "",
  initialGroupId = "",
  groups,
  onSave,
  onClose,
}) => {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [groupId, setGroupId] = useState(initialGroupId);
  const [touched, setTouched] = useState({ name: false, group: false });
  const [isFocused, setIsFocused] = useState(false);

  // VALIDERING
  const isNameValid = name.trim().length > 0;
  // Kontrollerar att groupId inte är en tom sträng, null eller undefined
  const isGroupValid =
    groupId !== "" && groupId !== null && groupId !== undefined;

  // Formuäret är giltigt endast om BÅDE namn och grupp är korrekt ifyllda
  const isFormValid = isNameValid && isGroupValid;

  const showNameError = touched.name && !isNameValid;
  const showGroupError = touched.group && !isGroupValid;

  useEffect(() => {
    setName(initialName);
    setGroupId(initialGroupId);
    setTouched({ name: false, group: false });
  }, [initialName, initialGroupId]);

  const handleSave = () => {
    if (isFormValid) {
      onSave(name.trim(), groupId);
    } else {
      setTouched({ name: true, group: true });
    }
  };


  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
  };

  const handleGroupBlur = () => {
    setTouched((prev) => ({ ...prev, group: true }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (touched.name) setTouched((prev) => ({ ...prev, name: false }));
  };

  const handleGroupChange = (e: any) => {
    setGroupId(e.target.value);
    if (touched.group) setTouched((prev) => ({ ...prev, group: false }));
  };

  return (
    <Box>
      <DialogTitle
        component="div"
        sx={{ p: 0, mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}
      >
        <PersonIcon sx={{ color: "primary.main", fontSize: "1.5rem" }} />
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.25rem" }}>
          {title}
        </Typography>
      </DialogTitle>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <TextField
          autoFocus
          label="Namn på anställd"
          fullWidth
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onFocus={() => setIsFocused(true)}
          error={showNameError}
          helperText={showNameError ? "Namn krävs" : " "}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon
                  sx={{ color: isFocused ? "primary.main" : "action.active" }}
                />
              </InputAdornment>
            ),
          }}
        />

        <FormControl
          fullWidth
          error={showGroupError}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              // ... dina övriga stilar
            },
          }}
        >
          {/* shrink={true} är nyckeln här, annars täcker labeln placeholder-texten */}
          <InputLabel shrink id="group-select-label">
            Grupp
          </InputLabel>

          <Select
            labelId="group-select-label"
            value={groupId}
            label="Grupp"
            displayEmpty // Tillåter visning av placeholder när värdet är ""
            onChange={handleGroupChange}
            onBlur={handleGroupBlur}
            notched // Ser till att ramen lämnar plats för labeln eftersom vi kör shrink={true}
            renderValue={(selected) => {
              if (!selected || selected.length === 0) {
                return (
                  <Typography
                    sx={{ color: theme.palette.text.secondary, opacity: 0.7 }}
                  >
                    Välj grupp...
                  </Typography>
                );
              }
              // Hitta namnet på vald grupp för att visa det i rutan
              const selectedGroup = groups.find((g) => g.id === selected);
              return selectedGroup ? selectedGroup.name : selected;
            }}
            startAdornment={
              <InputAdornment position="start" sx={{ ml: 1 }}>
                <GroupsIcon
                  sx={{
                    color: groupId ? "primary.main" : "action.active",
                    fontSize: "1.25rem",
                    mr: 1,
                  }}
                />
              </InputAdornment>
            }
            MenuProps={{
              sx: { zIndex: 3000 },
              PaperProps: {
                sx: { borderRadius: 1, mt: 0.5, maxHeight: 300 },
              },
            }}
          >
            {/* Detta alternativet finns i listan men är dolt, så användaren måste välja en riktig grupp */}
            <MenuItem value="" disabled sx={{ display: "none" }}>
              Välj grupp...
            </MenuItem>

            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DialogActions sx={{ px: 0, pb: 0, pt: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            Avbryt
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            // HÄR INAKTIVERAS KNAPPEN OM FORMULÄRET INTE ÄR GILTIGT
            disabled={!isFormValid}
            startIcon={<PersonAddIcon />}
            sx={{
              fontWeight: 600,
              "&.Mui-disabled": {
                backgroundColor: "action.disabledBackground",
                color: "action.disabled",
              },
            }}
          >
            Spara
          </Button>
        </DialogActions>
      </Box>
    </Box>
  );
};

export default TeamForm;
