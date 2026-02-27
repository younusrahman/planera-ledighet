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
  Fade,
  useTheme,
  alpha,
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

const ResourceForm: React.FC<ResourceFormProps> = ({
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

  const isNameValid = name.trim().length > 0;
  const isGroupValid = groupId !== "";
  const showNameError = touched.name && !isNameValid;
  const showGroupError = touched.group && !isGroupValid;
  const hasChanges = name !== initialName || groupId !== initialGroupId;
  const isFormValid = isNameValid && isGroupValid;

  useEffect(() => {
    setName(initialName);
    setGroupId(initialGroupId);
    setTouched({ name: false, group: false });
  }, [initialName, initialGroupId]);

  const handleSave = () => {
    if (!isNameValid || !isGroupValid) {
      setTouched({ name: true, group: true });
      return;
    }
    onSave(name.trim(), groupId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFormValid) {
      handleSave();
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
        sx={{
          p: 0,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <PersonIcon
          sx={{
            color: "primary.main",
            fontSize: "1.5rem",
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: "1.25rem",
            color: "text.primary",
            lineHeight: 1.3,
          }}
        >
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
          onKeyPress={handleKeyPress}
          onBlur={handleNameBlur}
          onFocus={() => setIsFocused(true)}
          error={showNameError}
          helperText={
            <Fade in={showNameError}>
              <span>{showNameError ? "Namn krävs" : " "}</span>
            </Fade>
          }
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              transition: theme.transitions.create([
                "border-color",
                "box-shadow",
              ]),
              "&:hover": {
                "& fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
              "&.Mui-focused": {
                "& fieldset": {
                  borderWidth: 2,
                  borderColor: theme.palette.primary.main,
                },
              },
            },
            "& .MuiInputLabel-root": {
              "&.Mui-focused": {
                color: theme.palette.primary.main,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonIcon
                  sx={{
                    color: isFocused ? "primary.main" : "action.active",
                    fontSize: "1.25rem",
                  }}
                />
              </InputAdornment>
            ),
          }}
          placeholder="Ange namn"
          variant="outlined"
          autoComplete="off"
        />

        <FormControl
          fullWidth
          error={showGroupError}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              transition: theme.transitions.create([
                "border-color",
                "box-shadow",
              ]),
              "&:hover": {
                "& fieldset": {
                  borderColor: theme.palette.primary.main,
                },
              },
              "&.Mui-focused": {
                "& fieldset": {
                  borderWidth: 2,
                  borderColor: theme.palette.primary.main,
                },
              },
            },
            "& .MuiInputLabel-root": {
              "&.Mui-focused": {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <InputLabel>Grupp</InputLabel>
          <Select
            value={groupId}
            label="Grupp"
            onChange={handleGroupChange}
            onBlur={handleGroupBlur}
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
                sx: {
                  borderRadius: 1,
                  mt: 0.5,
                  maxHeight: 300,
                },
              },
            }}
          >
            {groups.map((g) => (
              <MenuItem
                key={g.id}
                value={g.id}
                sx={{
                  py: 1,
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                  "&.Mui-selected": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.16),
                    },
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {g.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
          {showGroupError && (
            <Fade in={showGroupError}>
              <Typography
                variant="caption"
                color="error"
                sx={{ ml: 2, mt: 0.5, display: "block" }}
              >
                Välj en grupp
              </Typography>
            </Fade>
          )}
        </FormControl>

        <DialogActions
          sx={{
            px: 0,
            pb: 0,
            pt: 3,
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 1,
              px: 3,
              py: 1,
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
            startIcon={<PersonAddIcon />}
            sx={{
              borderRadius: 1,
              px: 3,
              py: 1,
              minWidth: 100,
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
            Spara
          </Button>
        </DialogActions>
      </Box>
    </Box>
  );
};

export default ResourceForm;
