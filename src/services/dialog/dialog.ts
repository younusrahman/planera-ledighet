import { create } from "zustand";

import AbsenceCategoryForm, {
  type AbsenceCategoryFormProps,
} from "./Content/AbsenceCategoryForm";

import { AnalyticsForm } from "./Content/AnalyticsForm";
import DataManagementDashboard from "./Content/DataManagementDashboard";
import {
  DatabaseMaintenanceForm,
  type DatabaseMaintenanceProps,
} from "./Content/DatabaseMaintenanceForm";
import EmployeeForm, { type EmployeeFormProps } from "./Content/EmployeeForm";
import TeamForm, { type TeamFormProps } from "./Content/TeamForm";
import ConfigForm from "./Content/ConfigForm";
import AbsenceForm, { type AbsenceFormProps } from "./Content/AbsenceForm";

export type MaxWidth = "xs" | "sm" | "md" | "lg" | "xl";

export const dialogMap = {
  absenceForm: AbsenceForm,
  absenceCategory: AbsenceCategoryForm,
  team: TeamForm,
  employee: EmployeeForm,
  analytics: AnalyticsForm,
  config: ConfigForm,
  dataManagementDashboard: DataManagementDashboard,
  databaseMaintenance: DatabaseMaintenanceForm,
};

export type DialogId = keyof typeof dialogMap;

export type DialogPropsMap = {
  absenceForm: Omit<AbsenceFormProps, "onClose">;
  absenceCategory: Omit<AbsenceCategoryFormProps, "onClose">;
  team: Omit<TeamFormProps, "onClose">;
  employee: Omit<EmployeeFormProps, "onClose">;
  analytics: {};
  config: Omit<{}, "onClose">;
  dataManagementDashboard: {};
  databaseMaintenance: Omit<DatabaseMaintenanceProps, "onClose">;
};

type DialogItem<T extends DialogId = DialogId> = {
  id: T;
  props: DialogPropsMap[T];
  maxWidth?: MaxWidth;
};

type DialogStore = {
  dialogs: DialogItem[];
  open: <T extends DialogId>(
    id: T,
    props: DialogPropsMap[T],
    maxWidth?: MaxWidth,
  ) => void;
  close: (ids?: DialogId[]) => void;
  replace: <T extends DialogId>(
    id: T,
    props: DialogPropsMap[T],
    closeIds?: DialogId[],
    maxWidth?: MaxWidth,
  ) => void;
};

export const useDialogStore = create<DialogStore>((set) => ({
  dialogs: [],

  open: (id, props, maxWidth = "sm") =>
    set((state) => ({
      dialogs: [...state.dialogs, { id, props, maxWidth }],
    })),

  close: (ids) =>
    set((state) => {
      if (ids === undefined) {
        return { dialogs: state.dialogs.slice(0, -1) };
      }

      if (ids.length === 0) {
        return { dialogs: [] };
      }

      return {
        dialogs: state.dialogs.filter((dialog) => !ids.includes(dialog.id)),
      };
    }),

  replace: (id, props, closeIds, maxWidth = "sm") =>
    set((state) => {
      let dialogs = state.dialogs;

      if (closeIds === undefined) {
        dialogs = dialogs.slice(0, -1);
      } else if (closeIds.length === 0) {
        dialogs = [];
      } else {
        dialogs = dialogs.filter((dialog) => !closeIds.includes(dialog.id));
      }

      return {
        dialogs: [...dialogs, { id, props, maxWidth }],
      };
    }),
}));

export const dialog = {
  open: <T extends DialogId>(
    id: T,
    props: DialogPropsMap[T],
    maxWidth?: MaxWidth,
  ) => useDialogStore.getState().open(id, props, maxWidth),

  close: (ids?: DialogId[]) => useDialogStore.getState().close(ids),

  replace: <T extends DialogId>(
    id: T,
    props: DialogPropsMap[T],
    closeIds?: DialogId[],
    maxWidth?: MaxWidth,
  ) => useDialogStore.getState().replace(id, props, closeIds, maxWidth),
};
