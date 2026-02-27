import { create } from "zustand";

interface DialogInstance {
  id: string;
  props: any;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
}

interface DialogState {
  stack: DialogInstance[];
  open: (id: string, props: any, maxWidth?: any) => void;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  stack: [],
  open: (id, props, maxWidth = "sm") =>
    set((state) => ({
      stack: [...state.stack, { id, props, maxWidth }],
    })),
  close: () =>
    set((state) => ({
      stack: state.stack.slice(0, -1), // Removes only the top dialog
    })),
}));

export const dialog = {
  open: (id: string, props: any, maxWidth?: any) =>
    useDialogStore.getState().open(id, props, maxWidth),
  close: () => useDialogStore.getState().close(),
};
