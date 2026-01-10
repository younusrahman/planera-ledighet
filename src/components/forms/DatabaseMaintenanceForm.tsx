import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Dialog,
  DialogContentText,
  Paper,
} from "@mui/material";
import {
  Storage as DatabaseIcon,
  CloudDownload as DownloadIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  RestartAlt as ResetIcon,
  FolderOpen as PathIcon,
  FileOpen as BrowseIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";
import { databaseService } from "../../services/entities/database"; // Path to your service
import { toast } from "../../services/globalSnackbar";
import { BASE_URL } from "../../services/apiInstance";
import { appServicesStatic } from "../../services/appServices";
import { ProTooltip } from "../ProTooltip";
export interface DatabaseMaintenanceProps {
  title: string;
  onClose: () => void; // This matches what GlobalDialogProvider passes
}
export const DatabaseMaintenanceForm: React.FC<DatabaseMaintenanceProps> = ({
  title,
  onClose,
}) => {
  const [backups, setBackups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MUI Confirmation State
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    action: () => {},
    isDanger: false,
  });

  const loadBackups = async () => {
    try {
      const data = await databaseService.list();
      setBackups(data);
    } catch (e) {
      toast("Kunde inte hämta backuper", "error");
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const openConfirm = (
    title: string,
    message: string,
    action: () => void,
    isDanger: boolean = false
  ) => {
    setConfirm({ open: true, title, message, action, isDanger });
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, open: false }));

  // Helper to execute actions and refresh UI
  const executeAction = async (
    task: () => Promise<any>,
    successMsg: string
  ) => {
    setLoading(true);
    try {
      const res = await task();
      if (res.success) {
        toast(successMsg, "success");
        if (
          successMsg.includes("nollställt") ||
          successMsg.includes("återställt")
        ) {
          await appServicesStatic.refreshAllData();
        }
        await loadBackups();
        if (successMsg.includes("återställt")) setManualPath("");
      } else {
        toast(res.message || "Åtgärden misslyckades", "error");
      }
    } catch (e: any) {
      toast(e.message || "Ett oväntat fel uppstod", "error");
    } finally {
      setLoading(false);
      closeConfirm();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await databaseService.upload(formData);
      if (res.success) {
        toast("Filen har laddats upp till servern!", "success");
        await loadBackups();
        setManualPath(file.name); // Set the name in text field for easy restore
      } else {
        toast(res.message || "Uppladdning misslyckades", "error");
      }
    } catch (e) {
      toast("Kunde inte ansluta till servern för uppladdning", "error");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (fileName: string) => {
    // Uses the BASE_URL to trigger a direct browser download
    window.open(`${BASE_URL}/Database/download/${fileName}`, "_blank");
  };

  return (
    <Box>
      <Typography
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontWeight: 700,
          mb: 2,
          fontSize: "1.25rem",
        }}
      >
        <DatabaseIcon color="primary" /> {title}
      </Typography>

      <Stack spacing={3} sx={{ mt: 1 }}>
        {/* SECTION 1: SYSTEM OPERATIONS */}
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Systemåtgärder
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              fullWidth
              disableElevation
              startIcon={<BackupIcon />}
              onClick={() =>
                executeAction(databaseService.backup, "Ny backup skapad")
              }
              disabled={loading}
            >
              Skapa Backup
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<ResetIcon />}
              onClick={() =>
                openConfirm(
                  "Fabriksåterställning",
                  "Detta raderar ALLA data i den aktiva databasen. Systemet återställs till ett tomt läge. Vill du fortsätta?",
                  () =>
                    executeAction(databaseService.reset, "Systemet nollställt"),
                  true
                )
              }
              disabled={loading}
            >
              Nollställ allt
            </Button>
          </Stack>
        </Box>

        <Divider />

        {/* SECTION 2: FILE UPLOAD & RESTORE */}
        <Box>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Återställ från fil / Sökväg
          </Typography>
          <input
            type="file"
            accept=".db"
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Filnamn eller C:\Sökväg\fil.db"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PathIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <ProTooltip title="Bläddra efter lokal fil (.db)">
                      <IconButton
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                      >
                        <BrowseIcon fontSize="small" />
                      </IconButton>
                    </ProTooltip>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              color="warning"
              disabled={!manualPath || loading}
              startIcon={<UploadIcon />}
              onClick={() =>
                openConfirm(
                  "Bekräfta Återställning",
                  `Nuvarande data kommer att skrivas över med filen: ${manualPath}. Vill du fortsätta?`,
                  () =>
                    executeAction(
                      () => databaseService.restore(manualPath),
                      "Systemet återställt"
                    )
                )
              }
            >
              Kör
            </Button>
          </Stack>
        </Box>

        <Divider />

        {/* SECTION 3: BACKUP LIST */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ fontWeight: 700 }}
            >
              Serverns Backuphistorik ({backups.length})
            </Typography>
            <Button
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              disabled={backups.length === 0 || loading}
              onClick={() =>
                openConfirm(
                  "Rensa alla backuper?",
                  "Detta raderar permanent samtliga backup-filer i mappen på servern. Vill du fortsätta?",
                  () =>
                    executeAction(
                      databaseService.deleteBackup,
                      "Alla backuper raderade"
                    ),
                  true
                )
              }
            >
              Rensa alla
            </Button>
          </Stack>

          <Paper
            variant="outlined"
            sx={{ bgcolor: "action.hover", maxHeight: 250, overflow: "auto" }}
          >
            <List dense>
              {backups.map((file) => (
                <ListItem
                  key={file}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={0.5}>
                      <ProTooltip title="Ladda ner till din dator">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(file)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </ProTooltip>
                      <ProTooltip title="Återställ systemet från denna fil">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            openConfirm(
                              "Återställ backup?",
                              `Vill du ersätta live-databasen med data från ${file}?`,
                              () =>
                                executeAction(
                                  () => databaseService.restore(file),
                                  "Systemet återställt"
                                )
                            )
                          }
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </ProTooltip>
                      <ProTooltip title="Radera filen från servern">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() =>
                            openConfirm(
                              "Radera fil?",
                              `Är du säker på att du vill radera ${file} permanent?`,
                              () =>
                                executeAction(
                                  () => databaseService.deleteBackup(file),
                                  "Backup raderad"
                                ),
                              true
                            )
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ProTooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={file}
                    primaryTypographyProps={{
                      variant: "body2",
                      sx: { fontWeight: 500 },
                    }}
                  />
                </ListItem>
              ))}
              {backups.length === 0 && (
                <Box sx={{ p: 3, textAlign: "center", color: "text.disabled" }}>
                  Inga sparade backuper hittades på servern.
                </Box>
              )}
            </List>
          </Paper>
        </Box>
      </Stack>

      <DialogActions sx={{ py: 2, px: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Stäng
        </Button>
      </DialogActions>

      {/* --- REUSABLE MUI CONFIRMATION DIALOG --- */}
      <Dialog open={confirm.open} onClose={closeConfirm}>
        <DialogTitle sx={{ fontWeight: 700 }}>{confirm.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ pb: 2, px: 2 }}>
          <Button onClick={closeConfirm} color="inherit">
            Avbryt
          </Button>
          <Button
            onClick={confirm.action}
            color={confirm.isDanger ? "error" : "primary"}
            variant="contained"
            autoFocus
            disableElevation
          >
            Bekräfta
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Loading Overlay inside Dialog */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(255,255,255,0.7)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};
