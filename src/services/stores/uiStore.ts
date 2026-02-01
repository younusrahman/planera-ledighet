import { create } from "zustand";

export type SidebarMode = "full" | "initials" | "hidden";

interface UIState {
  sidebarMode: SidebarMode;
  actions: {
    setSidebarMode: (mode: SidebarMode) => void;
    toggleSidebar: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  sidebarMode: "full",
  actions: {
    setSidebarMode: (mode) => set({ sidebarMode: mode }),
    toggleSidebar: () =>
      set((state) => {
        if (state.sidebarMode === "full") return { sidebarMode: "initials" };
        if (state.sidebarMode === "initials") return { sidebarMode: "hidden" };
        return { sidebarMode: "full" };
      }),
  },
}));

// Selectors for better performance
export const useSidebarMode = () => useUIStore((state) => state.sidebarMode);
export const useUIActions = () => useUIStore((state) => state.actions);
