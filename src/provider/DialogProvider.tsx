import React, { createContext, useContext, useState, type ReactNode } from "react";
import { Dialog, DialogTitle, DialogContent, Grow, type Breakpoint } from "@mui/material";
import { type DialogKey, DIALOG_COMPONENTS } from "../utils/DialogRegistry";


interface DialogOptions {
  title: string;
  content: DialogKey;
  props?: any;
  funcs?: Record<string, (...args: any[]) => void>;
  maxWidth?: Breakpoint;
}

interface DialogContextType {
  openDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [active, setActive] = useState<DialogOptions | null>(null);

  const openDialog = (options: DialogOptions) => setActive(options);
  const closeDialog = () => setActive(null);

  const CurrentContent = active ? DIALOG_COMPONENTS[active.content] : null;

  return (
    <DialogContext.Provider value={{ openDialog, closeDialog }}>
      {children}
      <Dialog
        open={Boolean(active)}
        onClose={closeDialog}
        fullWidth
        maxWidth={active?.maxWidth || "xs"}
        slots={{ transition: Grow }}
        slotProps={{ transition: { timeout: 450 } as any }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{active?.title}</DialogTitle>
        <DialogContent sx={{ pt: "10px !important" }}>
          {CurrentContent && (
            <CurrentContent 
              {...active?.props} 
              {...active?.funcs} 
              onClose={closeDialog} 
            />
          )}
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used within DialogProvider");
  return ctx;
};