import { create } from "zustand";

export type SidebarMode = "full" | "initials" | "hidden";
export type ViewMode = "timeline" | "year"; // Add this

interface UIState {
  sidebarMode: SidebarMode;
  viewMode: ViewMode; // Add this
  actions: {
    setSidebarMode: (mode: SidebarMode) => void;
    setViewMode: (mode: ViewMode) => void; // Add this
    toggleSidebar: () => void;
  };
}

export const useUIStore = create<UIState>((set) => ({
  sidebarMode: "full",
  viewMode: "timeline", // Default
  actions: {
    setViewMode: (mode) => set({ viewMode: mode }),
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
export const useViewMode = () => useUIStore((state) => state.viewMode);
