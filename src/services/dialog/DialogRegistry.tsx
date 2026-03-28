// src/utils/DialogRegistry.tsx
import AbsenceForm, { type AbsenceFormProps } from "./Content/AbsenceForm";
import type { AbsenceTypeFormProps } from "./Content/AbsenceTypeForm";
import AbsenceTypeForm from "./Content/AbsenceTypeForm";
import { AnalyticsForm } from "./Content/AnalyticsForm";
import ConfigForm from "./Content/ConfigForm";
import {
  DatabaseMaintenanceForm,
  type DatabaseMaintenanceProps,
} from "./Content/DatabaseMaintenanceForm";
import type { GroupFormProps } from "./Content/GroupForm";
import GroupForm from "./Content/GroupForm";
import DataManagementDashboard from "./Content/DataManagementDashboard";
import type { ResourceFormProps } from "./Content/TeamForm";
import TeamForm from "./Content/TeamForm";
import type { Absence, AbsenceCategory, Employee, Team } from "../../types";

// 1. All dialog content
export const dialogRegistry = {
  absenceType: {
    component: AbsenceTypeForm,
  },
  config: {
    component: ConfigForm,
  },
  group: {
    component: GroupForm,
  },
  resource: {
    component: TeamForm,
  },
  absence: { component: AbsenceForm },
  databaseSystem: {
    component: DatabaseMaintenanceForm,
  },
  analytics: {
    component: AnalyticsForm,
  },
  dataManagementDashboard: {
    component: DataManagementDashboard,
  },
} satisfies {
  [K in DialogId]: {
    component: React.ComponentType<DialogPropsMap[K]>;
  };
};

// 2. All dialog IDs in your app
export type DialogId =
  | "absenceType"
  | "config"
  | "group"
  | "resource"
  | "absence"
  | "databaseSystem"
  | "analytics"
  | "dataManagementDashboard";

// 3. Map each dialog ID → its props
export interface DialogPropsMap {
  absenceType: AbsenceTypeFormProps;
  config: ConfigFormProps;
  group: GroupFormProps;
  resource: ResourceFormProps;
  absence: AbsenceFormProps;
  databaseSystem: DatabaseMaintenanceProps;
  analytics: {};
  dataManagementDashboard: {};
}
