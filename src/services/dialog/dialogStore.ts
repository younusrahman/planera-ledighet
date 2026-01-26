import { create } from "zustand";
import type { DialogId, DialogPropsMap } from "./DialogRegistry";

interface DialogState<K extends DialogId = DialogId> {
  id: K | null;
  props: DialogPropsMap[K] | null;
  open: <T extends DialogId>(id: T, props: DialogPropsMap[T]) => void;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  id: null,
  props: null,
  open: (id, props) => set({ id, props }),
  close: () => set({ id: null, props: null }),
}));

// For .ts files
export const dialog = {
  open: <T extends DialogId>(id: T, props: DialogPropsMap[T]) =>
    useDialogStore.getState().open(id, props),
  close: () => useDialogStore.getState().close(),
};
