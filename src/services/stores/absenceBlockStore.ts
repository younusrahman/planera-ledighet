import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export interface AbsenceBlockState {
  isResizing: boolean;
  visualDuration: number;
  visualStartShift: number;
  isTooltipOpen: boolean;
}

export interface AbsenceBlockStore {
  blocks: Record<string, AbsenceBlockState>;
  getBlock: (id: string) => AbsenceBlockState | undefined;
  setBlock: (id: string, state: Partial<AbsenceBlockState>) => void;
  resetBlock: (id: string, durationDays: number) => void;
  removeBlock: (id: string) => void;
}

const defaultBlockState = (durationDays: number): AbsenceBlockState => ({
  isResizing: false,
  visualDuration: durationDays,
  visualStartShift: 0,
  isTooltipOpen: false,
});

export const useAbsenceBlockStore = create<AbsenceBlockStore>((set, get) => ({
  blocks: {},

  getBlock: (id: string) => {
    return get().blocks[id];
  },

  setBlock: (id: string, state: Partial<AbsenceBlockState>) => {
    set((current) => {
      const currentBlock = current.blocks[id] || defaultBlockState(0);
      return {
        blocks: {
          ...current.blocks,
          [id]: { ...currentBlock, ...state },
        },
      };
    });
  },

  resetBlock: (id: string, durationDays: number) => {
    set((current) => ({
      blocks: {
        ...current.blocks,
        [id]: defaultBlockState(durationDays),
      },
    }));
  },

  removeBlock: (id: string) => {
    set((current) => {
      const { [id]: _, ...rest } = current.blocks;
      return { blocks: rest };
    });
  },
}));

// --- SELECTORS FOR INDIVIDUAL BLOCKS ---

export const useAbsenceBlockState = (id: string) =>
  useAbsenceBlockStore(useShallow((s) => s.blocks[id]));

export const useAbsenceBlockIsResizing = (id: string) =>
  useAbsenceBlockStore((s) => s.blocks[id]?.isResizing ?? false);

export const useAbsenceBlockVisualDuration = (id: string) =>
  useAbsenceBlockStore((s) => s.blocks[id]?.visualDuration ?? 0);

export const useAbsenceBlockVisualStartShift = (id: string) =>
  useAbsenceBlockStore((s) => s.blocks[id]?.visualStartShift ?? 0);

export const useAbsenceBlockIsTooltipOpen = (id: string) =>
  useAbsenceBlockStore((s) => s.blocks[id]?.isTooltipOpen ?? false);

// --- BATCH ACTIONS ---

export const useAbsenceBlockActions = () =>
  useAbsenceBlockStore(
    useShallow((s) => ({
      setBlock: s.setBlock,
      resetBlock: s.resetBlock,
      removeBlock: s.removeBlock,
      getBlock: s.getBlock,
    })),
  );


