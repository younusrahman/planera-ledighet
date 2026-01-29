import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export interface LeaveBlockState {
  isResizing: boolean;
  visualDuration: number;
  visualStartShift: number;
  isTooltipOpen: boolean;
}

export interface LeaveBlockStore {
  blocks: Record<string, LeaveBlockState>;
  getBlock: (id: string) => LeaveBlockState | undefined;
  setBlock: (id: string, state: Partial<LeaveBlockState>) => void;
  resetBlock: (id: string, durationDays: number) => void;
  removeBlock: (id: string) => void;
}

const defaultBlockState = (durationDays: number): LeaveBlockState => ({
  isResizing: false,
  visualDuration: durationDays,
  visualStartShift: 0,
  isTooltipOpen: false,
});

export const useLeaveBlockStore = create<LeaveBlockStore>((set, get) => ({
  blocks: {},

  getBlock: (id: string) => {
    return get().blocks[id];
  },

  setBlock: (id: string, state: Partial<LeaveBlockState>) => {
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

export const useLeaveBlockState = (id: string) =>
  useLeaveBlockStore(useShallow((s) => s.blocks[id]));

export const useLeaveBlockIsResizing = (id: string) =>
  useLeaveBlockStore((s) => s.blocks[id]?.isResizing ?? false);

export const useLeaveBlockVisualDuration = (id: string) =>
  useLeaveBlockStore((s) => s.blocks[id]?.visualDuration ?? 0);

export const useLeaveBlockVisualStartShift = (id: string) =>
  useLeaveBlockStore((s) => s.blocks[id]?.visualStartShift ?? 0);

export const useLeaveBlockIsTooltipOpen = (id: string) =>
  useLeaveBlockStore((s) => s.blocks[id]?.isTooltipOpen ?? false);

// --- BATCH ACTIONS ---

export const useLeaveBlockActions = () =>
  useLeaveBlockStore(
    useShallow((s) => ({
      setBlock: s.setBlock,
      resetBlock: s.resetBlock,
      removeBlock: s.removeBlock,
      getBlock: s.getBlock,
    })),
  );

