import { resources } from "./entities/resources";
import { groups } from "./entities/groups";
import { absenceTypes } from "./entities/absenceTypes";
import { getEntity } from "./globalState";
import { leaves } from "./entities/leaves";

const _initializers = [absenceTypes, groups, resources, leaves];

export const appServicesStatic = {
  get absenceTypes() {
    return getEntity<typeof absenceTypes>("absenceTypes");
  },
  get groups() {
    return getEntity<typeof groups>("groups");
  },
  get resources() {
    return getEntity<typeof resources>("resources");
  },
  get leaves() {
    return getEntity<typeof leaves>("leaves");
  },
};
