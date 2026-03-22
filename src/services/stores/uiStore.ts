import { create } from "zustand";
import type { SidebarMode } from "../../types";

export const DEFAULT_CELL_WIDTH = 35;
export const DEFAULT_ROW_HEIGHT = 28;

export const DEFAULT_SIDEBAR_WIDTH_FULL = 140;
export const DEFAULT_SIDEBAR_WIDTH_COMPACT = 70;
export const DEFAULT_SIDEBAR_WIDTH_HIDDEN = 0;

export const DEFAULT_SIDEBAR_MODE: SidebarMode = "full";

type BackendConfig = {
  blockPastDays?: boolean | null;
  disableDeletion?: boolean | null;
  cellWidth?: number | null;
  rowHeight?: number | null;
  sidebarMode?: SidebarMode | null;
  sidebarWidthFull?: number | null;
  sidebarWidthCompact?: number | null;
  sidebarWidthHidden?: number | null;
};

interface ConfigState {
  blockPastDays: boolean;
  disableDeletion: boolean;
  cellWidth: number;
  rowHeight: number;
  sidebarMode: SidebarMode;
  sidebarWidthFull: number;
  sidebarWidthCompact: number;
  sidebarWidthHidden: number;

  actions: {
    setBlockPastDays: (value: boolean) => void;
    setDisableDeletion: (value: boolean) => void;
    setCellWidth: (value: number) => void;
    setRowHeight: (value: number) => void;
    setSidebarMode: (value: SidebarMode) => void;
    toggleSidebar: () => void;
    setSidebarWidthFull: (value: number) => void;
    setSidebarWidthCompact: (value: number) => void;
    setSidebarWidthHidden: (value: number) => void;
    hydrateFromBackend: (values?: BackendConfig) => void;
    resetToDefaults: () => void;
  };
}

const isValidSidebarMode = (value: unknown): value is SidebarMode =>
  value === "full" || value === "compact" || value === "hidden";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const useConfigStore = create<ConfigState>((set) => ({
  blockPastDays: false,
  disableDeletion: false,
  cellWidth: DEFAULT_CELL_WIDTH,
  rowHeight: DEFAULT_ROW_HEIGHT,
  sidebarMode: DEFAULT_SIDEBAR_MODE,
  sidebarWidthFull: DEFAULT_SIDEBAR_WIDTH_FULL,
  sidebarWidthCompact: DEFAULT_SIDEBAR_WIDTH_COMPACT,
  sidebarWidthHidden: DEFAULT_SIDEBAR_WIDTH_HIDDEN,

  actions: {
    setBlockPastDays: (value) =>
      set((state) => ({
        blockPastDays: value,
        disableDeletion: value ? state.disableDeletion : false,
      })),

    setDisableDeletion: (value) =>
      set((state) => ({
        disableDeletion: state.blockPastDays ? value : false,
      })),

    setCellWidth: (value) =>
      set({
        cellWidth:
          typeof value === "number" && !Number.isNaN(value)
            ? clamp(value, 20, 120)
            : DEFAULT_CELL_WIDTH,
      }),

    setRowHeight: (value) =>
      set({
        rowHeight:
          typeof value === "number" && !Number.isNaN(value)
            ? clamp(value, 20, 80)
            : DEFAULT_ROW_HEIGHT,
      }),

    setSidebarMode: (value) =>
      set({
        sidebarMode: isValidSidebarMode(value) ? value : DEFAULT_SIDEBAR_MODE,
      }),

    toggleSidebar: () =>
      set((state) => {
        if (state.sidebarMode === "full") return { sidebarMode: "compact" };
        if (state.sidebarMode === "compact") return { sidebarMode: "hidden" };
        return { sidebarMode: "full" };
      }),

    setSidebarWidthFull: (value) =>
      set({
        sidebarWidthFull:
          typeof value === "number" && !Number.isNaN(value)
            ? clamp(value, 0, 400)
            : DEFAULT_SIDEBAR_WIDTH_FULL,
      }),

    setSidebarWidthCompact: (value) =>
      set({
        sidebarWidthCompact:
          typeof value === "number" && !Number.isNaN(value)
            ? clamp(value, 0, 400)
            : DEFAULT_SIDEBAR_WIDTH_COMPACT,
      }),

    setSidebarWidthHidden: (value) =>
      set({
        sidebarWidthHidden:
          typeof value === "number" && !Number.isNaN(value)
            ? clamp(value, 0, 400)
            : DEFAULT_SIDEBAR_WIDTH_HIDDEN,
      }),

    hydrateFromBackend: (values) =>
      set({
        blockPastDays:
          typeof values?.blockPastDays === "boolean"
            ? values.blockPastDays
            : false,

        disableDeletion:
          typeof values?.blockPastDays === "boolean" &&
          values.blockPastDays &&
          typeof values?.disableDeletion === "boolean"
            ? values.disableDeletion
            : false,

        cellWidth:
          typeof values?.cellWidth === "number" &&
          !Number.isNaN(values.cellWidth)
            ? clamp(values.cellWidth, 20, 120)
            : DEFAULT_CELL_WIDTH,

        rowHeight:
          typeof values?.rowHeight === "number" &&
          !Number.isNaN(values.rowHeight)
            ? clamp(values.rowHeight, 20, 80)
            : DEFAULT_ROW_HEIGHT,

        sidebarMode: isValidSidebarMode(values?.sidebarMode)
          ? values.sidebarMode
          : DEFAULT_SIDEBAR_MODE,

        sidebarWidthFull:
          typeof values?.sidebarWidthFull === "number" &&
          !Number.isNaN(values.sidebarWidthFull)
            ? clamp(values.sidebarWidthFull, 0, 400)
            : DEFAULT_SIDEBAR_WIDTH_FULL,

        sidebarWidthCompact:
          typeof values?.sidebarWidthCompact === "number" &&
          !Number.isNaN(values.sidebarWidthCompact)
            ? clamp(values.sidebarWidthCompact, 0, 400)
            : DEFAULT_SIDEBAR_WIDTH_COMPACT,

        sidebarWidthHidden:
          typeof values?.sidebarWidthHidden === "number" &&
          !Number.isNaN(values.sidebarWidthHidden)
            ? clamp(values.sidebarWidthHidden, 0, 400)
            : DEFAULT_SIDEBAR_WIDTH_HIDDEN,
      }),

    resetToDefaults: () =>
      set({
        blockPastDays: false,
        disableDeletion: false,
        cellWidth: DEFAULT_CELL_WIDTH,
        rowHeight: DEFAULT_ROW_HEIGHT,
        sidebarMode: DEFAULT_SIDEBAR_MODE,
        sidebarWidthFull: DEFAULT_SIDEBAR_WIDTH_FULL,
        sidebarWidthCompact: DEFAULT_SIDEBAR_WIDTH_COMPACT,
        sidebarWidthHidden: DEFAULT_SIDEBAR_WIDTH_HIDDEN,
      }),
  },
}));

// -------------------------------
// React Selectors
// -------------------------------
export const useBlockPastDays = () =>
  useConfigStore((state) => state.blockPastDays);

export const useDisableDeletion = () =>
  useConfigStore((state) => state.disableDeletion);

export const useCellWidth = () => useConfigStore((state) => state.cellWidth);

export const useRowHeight = () => useConfigStore((state) => state.rowHeight);

export const useSidebarMode = () =>
  useConfigStore((state) => state.sidebarMode);

export const useSidebarWidthFull = () =>
  useConfigStore((state) => state.sidebarWidthFull);

export const useSidebarWidthCompact = () =>
  useConfigStore((state) => state.sidebarWidthCompact);

export const useSidebarWidthHidden = () =>
  useConfigStore((state) => state.sidebarWidthHidden);

export const useCurrentSidebarWidth = () =>
  useConfigStore((state) => {
    if (state.sidebarMode === "hidden") return 0;
    if (state.sidebarMode === "compact") return state.sidebarWidthCompact;
    return state.sidebarWidthFull;
  });

// -------------------------------
// Non-React Getters (TS-safe)
// -------------------------------
export const getCellWidth = () => useConfigStore.getState().cellWidth;
export const getRowHeight = () => useConfigStore.getState().rowHeight;

export const getCurrentSidebarWidth = () => {
  const state = useConfigStore.getState();
  if (state.sidebarMode === "hidden") return 0;
  if (state.sidebarMode === "compact") return state.sidebarWidthCompact;
  return state.sidebarWidthFull;
};

// -------------------------------
export const useConfigActions = () => useConfigStore((state) => state.actions);
