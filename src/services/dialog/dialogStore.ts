import { create } from "zustand";

type MaxWidth = "xs" | "sm" | "md" | "lg" | "xl";

interface DialogInstance {
  id: string;
  props: any;
  maxWidth?: MaxWidth;
}

interface DialogState {
  stack: DialogInstance[];
  open: (id: string, props: any, maxWidth?: MaxWidth) => void;
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
      stack: state.stack.slice(0, -1),
    })),
}));

export const dialog = {
  open: (id: string, props: any, maxWidth?: MaxWidth) =>
    useDialogStore.getState().open(id, props, maxWidth),
  close: () => useDialogStore.getState().close(),
};
