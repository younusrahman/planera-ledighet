import AbsenceTypeForm from "../components/forms/AbsenceForm";
import ConfigForm from "../components/forms/ConfigForm";
import GroupForm from "../components/forms/GroupForm";
import ResourceForm from "../components/forms/ResourceForm";

export const DIALOG_COMPONENTS = {
  GROUP: GroupForm,
  RESOURCE: ResourceForm,
  ABSENCE_TYPE: AbsenceTypeForm,
  CONFIG: ConfigForm,
} as const;

export type DialogKey = keyof typeof DIALOG_COMPONENTS;