

import { getEntity } from "./globalState";
import { leaves } from "./entities/leaves";

export const appServicesStatic = {
  get leaves() {
    return getEntity<typeof leaves>("leaves");
  },
};
