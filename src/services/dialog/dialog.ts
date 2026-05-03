import { create } from "zustand";
import AbsenceCategoryForm, {
  type AbsenceCategoryFormProps,
} from "./Content/AbsenceCategoryForm/AbsenceCategoryForm";
import AbsenceForm, {
  type AbsenceFormProps,
} from "./Content/AbsenceForm/AbsenceForm";
import { AnalyticsForm } from "./Content/AnalyticsForm/AnalyticsForm";
import ConfigForm from "./Content/ConfigForm";
import { DatabaseMaintenanceForm } from "./Content/DatabaseMaintenanceForm";
import DataManagementDashboard from "./Content/DataManagementDashboard";
import EmployeeForm, {
  type EmployeeFormProps,
} from "./Content/EmployeeForm/EmployeeForm";
import TeamForm, { type TeamFormProps } from "./Content/TeamForm/TeamForm";
import type { Absence, AbsenceCategory, Employee, Team } from "../../types";
import type { JSX } from "react";

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
} as const;

export type DialogId = keyof typeof dialogMap;

export type DialogPropsMap = {
  absenceForm: { title?: string, Icon?: JSX.Element  } & Omit<AbsenceFormProps, "onClose">;
  absenceCategory: { title?: string, Icon?: JSX.Element  } & Omit<
    AbsenceCategoryFormProps,
    "onClose"
  >;
  team: { title?: string, Icon?: JSX.Element } & Omit<TeamFormProps, "onClose">;
  employee: { title?: string, Icon?: JSX.Element } & Omit<
    EmployeeFormProps,
    "onClose"
  >;
  analytics: { title?: string, Icon?: JSX.Element };
  config: { title?: string, Icon?: JSX.Element };
  dataManagementDashboard: {
    title?: string;
    Icon?: JSX.Element;
    absences: Absence[];
    employees?: Employee[];
    categories: AbsenceCategory[];
    teams: Team[];
  };
  databaseMaintenance: { title?: string, Icon?: JSX.Element };
};

type DialogItem<T extends DialogId = DialogId> = {
  id: T;
  props: DialogPropsMap[T];
  maxWidth?: MaxWidth;
  title?: string;
  Icon?: JSX.Element;
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
      dialogs: [
        ...state.dialogs,
        {
          id,
          props,
          maxWidth,
          title: props?.title,
          Icon: props?.Icon,
        },
      ],
    })),

  close: (ids) =>
    set((state) => {
      if (ids === undefined) return { dialogs: state.dialogs.slice(0, -1) };
      if (ids.length === 0) return { dialogs: [] };
      return { dialogs: state.dialogs.filter((d) => !ids.includes(d.id)) };
    }),

  replace: (id, props, closeIds, maxWidth = "sm") =>
    set((state) => {
      let dialogs = state.dialogs;

      if (closeIds === undefined) dialogs = dialogs.slice(0, -1);
      else if (closeIds.length === 0) dialogs = [];
      else dialogs = dialogs.filter((d) => !closeIds.includes(d.id));

      return {
        dialogs: [...dialogs, { id, props, maxWidth, title: props?.title, Icon: props?.Icon }],
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
