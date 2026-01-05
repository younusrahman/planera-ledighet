import React, { useState } from "react";
import { TextField, Button, Box, DialogActions } from "@mui/material";

interface GroupFormProps {
  initialName?: string;
  onSave: (name: string) => void;
  onClose: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ initialName = "", onSave, onClose }) => {
  const [name, setName] = useState(initialName);

  return (
    <Box sx={{ pt: 1 }}>
      <TextField
        autoFocus
        label="Gruppnamn"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && onSave(name)}
      />
      <DialogActions sx={{ px: 0, pb: 0, pt: 3 }}>
        <Button onClick={onClose}>Avbryt</Button>
        <Button variant="contained" onClick={() => onSave(name)}>Spara</Button>
      </DialogActions>
    </Box>
  );
};

export default GroupForm;