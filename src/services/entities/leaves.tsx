import type { AbsenceDetails } from "../../types";
import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";

export const leaves = createEntityModule<
  AbsenceDetails,
  Partial<AbsenceDetails>
>({
  name: "leaves",
  fetchAll: () => apiRequest("/absence"),
  create: (body) =>
    apiRequest("/absence", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest(`/absence/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest(`/absence/${id}`, {
      method: "DELETE",
    }),
});






