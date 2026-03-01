import { create } from "zustand";
import { AbsenceStatus } from "../../types";

export interface TeamSelection {
  teamId: string;
  employeeIds: string[]; // empty array means ALL employees in team are selected
  isIndeterminate: boolean;
}

interface FilterState {
  selectedTeamIds: string[];
  selectedEmployeeIds: string[];
  selectedCategoryIds: string[];
  selectedStatuses: number[];
  teamSelections: TeamSelection[];
  isAllSelected: boolean; // Track if all teams are selected for UI optimization

  setSelectedTeamIds: (ids: string[]) => void;
  setSelectedEmployeeIds: (ids: string[]) => void;
  setSelectedCategoryIds: (ids: string[]) => void;
  setSelectedStatuses: (statuses: number[]) => void;
  setTeamSelections: (selections: TeamSelection[]) => void;
  setIsAllSelected: (value: boolean) => void;

  getSelectedEmployeeIds: (
    allEmployees: Array<{ id: string; teamId: string }>,
  ) => string[];
  isEmployeeSelected: (empId: string, teamId: string) => boolean;
}

const useFilterStore = create<FilterState>((set, get) => ({
  // Legacy fields
  selectedTeamIds: ["ALL"],
  selectedEmployeeIds: ["ALL"],
  selectedCategoryIds: ["ALL"],
  selectedStatuses: [AbsenceStatus.Approved],

  // New hierarchical selection - empty by default, will be initialized in component
  teamSelections: [],
  isAllSelected: false,

  setSelectedTeamIds: (ids) => set({ selectedTeamIds: ids }),
  setSelectedEmployeeIds: (ids) => set({ selectedEmployeeIds: ids }),
  setSelectedCategoryIds: (ids) => set({ selectedCategoryIds: ids }),
  setSelectedStatuses: (statuses) => set({ selectedStatuses: statuses }),
  setTeamSelections: (teamSelections) => set({ teamSelections }),
  setIsAllSelected: (isAllSelected) => set({ isAllSelected }),

  getSelectedEmployeeIds: (allEmployees) => {
    const { teamSelections } = get();
    const selected: string[] = [];

    teamSelections.forEach((selection) => {
      if (selection.employeeIds.length === 0) {
        const teamEmployees = allEmployees.filter(
          (e) => e.teamId === selection.teamId,
        );
        selected.push(...teamEmployees.map((e) => e.id));
      } else {
        selected.push(...selection.employeeIds);
      }
    });

    return [...new Set(selected)];
  },

  isEmployeeSelected: (empId, teamId) => {
    const { teamSelections } = get();
    const selection = teamSelections.find((s) => s.teamId === teamId);

    if (!selection) return false;
    if (selection.employeeIds.length === 0) return true;

    return selection.employeeIds.includes(empId);
  },
}));

export default useFilterStore;
