import { resources } from "./entities/resources";
import { groups } from "./entities/groups";
import { absenceTypes } from "./entities/absenceTypes";
import { getEntity } from "./globalState";
import { absences } from "./entities/absences";

export const appServicesStatic = {
  // NEW: Global refresh helper
  async refreshAllData() {
    await Promise.all([
      this.absenceTypes.loadAll(),
      this.groups.loadAll(),
      this.resources.loadAll(),
      this.absences.loadAll(),
    ]);
  },
  get absenceTypes() {
    return getEntity<typeof absenceTypes>("absenceTypes");
  },
  get groups() {
    return getEntity<typeof groups>("groups");
  },
  get resources() {
    return getEntity<typeof resources>("resources");
  },
  get absences() {
    return getEntity<typeof absences>("absences");
  },
};
