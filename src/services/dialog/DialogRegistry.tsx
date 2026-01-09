// src/utils/DialogRegistry.tsx
import AbsenceForm, {
  type AbsenceFormProps,
} from "../../components/forms/AbsenceForm";
import type { AbsenceTypeFormProps } from "../../components/forms/AbsenceTypeForm";
import AbsenceTypeForm from "../../components/forms/AbsenceTypeForm";
import type { ConfigFormProps } from "../../components/forms/ConfigForm";
import ConfigForm from "../../components/forms/ConfigForm";
import type { GroupFormProps } from "../../components/forms/GroupForm";
import GroupForm from "../../components/forms/GroupForm";
import type { ResourceFormProps } from "../../components/forms/ResourceForm";
import ResourceForm from "../../components/forms/ResourceForm";
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
    component: ResourceForm,
  },
  absence: { component: AbsenceForm },
} satisfies {
  [K in DialogId]: {
    component: React.ComponentType<DialogPropsMap[K]>;
  };
};

// 2. All dialog IDs in your app
export type DialogId = "absenceType" | "config" | "group" | "resource" | "absence";

// 3. Map each dialog ID → its props
export interface DialogPropsMap {
  absenceType: AbsenceTypeFormProps;
  config: ConfigFormProps;
  group: GroupFormProps;
  resource: ResourceFormProps;
  absence: AbsenceFormProps;
}
