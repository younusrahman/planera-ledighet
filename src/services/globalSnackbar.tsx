import { create } from "zustand";
import { Snackbar, Alert, type AlertColor } from "@mui/material";

// 1. Logic & State (Zustand)
interface SnackbarStore {
  isOpen: boolean;
  message: string;
  severity: AlertColor;
  show: (message: string, severity?: AlertColor) => void;
  hide: () => void;
}

const useSnackbarStore = create<SnackbarStore>((set) => ({
  isOpen: false,
  message: "",
  severity: "info",
  show: (message, severity = "info") =>
    set({ isOpen: true, message, severity }),
  hide: () => set({ isOpen: false }),
}));

/**
 * UNIVERSAL TOAST FUNCTION
 * Call this from anywhere: .ts files, .tsx components, or inside hooks.
 */
export const toast = (message: string, severity: AlertColor = "info") => {
  useSnackbarStore.getState().show(message, severity);
};

// 2. The UI Component
export const GlobalSnackbar = () => {
  const { isOpen, message, severity, hide } = useSnackbarStore();

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={5000}
      onClose={hide}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert
        onClose={hide}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
