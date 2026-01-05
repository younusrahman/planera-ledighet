
import React, { useState } from "react";
import { TextField, FormControl, InputLabel, Select, MenuItem, Button, Box, DialogActions } from "@mui/material";

interface ResourceFormProps {
  initialName?: string;
  initialGroupId?: string;
  groups: { id: string; name: string }[];
  onSave: (name: string, groupId: string) => void;
  onClose: () => void;
}

const ResourceForm: React.FC<ResourceFormProps> = ({ initialName = "", initialGroupId = "", groups, onSave, onClose }) => {
  const [name, setName] = useState(initialName);
  const [groupId, setGroupId] = useState(initialGroupId);

  return (
    <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        autoFocus
        label="Namn på anställd"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <FormControl fullWidth>
        <InputLabel>Grupp</InputLabel>
        <Select
          value={groupId}
          label="Grupp"
          onChange={(e) => setGroupId(e.target.value)}
        >
          {groups.map((g) => (
            <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <DialogActions sx={{ px: 0, pb: 0, pt: 2 }}>
        <Button onClick={onClose}>Avbryt</Button>
        <Button variant="contained" onClick={() => onSave(name, groupId)}>Spara</Button>
      </DialogActions>
    </Box>
  );
};

export default ResourceForm;