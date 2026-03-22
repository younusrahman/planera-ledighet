import React, { useEffect } from "react";
import { create } from "zustand";
import styles from "./GlobalSnackbar.module.css";

// 1. Logic & State (Zustand) - Removed MUI type dependencies
type ToastSeverity = "success" | "error" | "info" | "warning";

interface SnackbarStore {
  isOpen: boolean;
  message: string;
  severity: ToastSeverity;
  show: (message: string, severity?: ToastSeverity) => void;
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

// Exported helper function for global use
export const toast = (message: string, severity: ToastSeverity = "info") => {
  useSnackbarStore.getState().show(message, severity);
};

// SVG Icons for different types
const Icons = {
  success: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

// 2. The UI Component
export const GlobalSnackbar = () => {
  const { isOpen, message, severity, hide } = useSnackbarStore();

  // Auto-hide logic
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        hide();
      }, 5000); // 5 seconds duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, hide]);

  if (!isOpen) return null;

  const IconComponent = Icons[severity];

  return (
    <div className={styles.container}>
      <div className={`${styles.toast} ${styles[severity]}`}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <IconComponent />
        </div>

        <div className={styles.content}>{message}</div>

        <button className={styles.closeBtn} onClick={hide} aria-label="Close">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};
