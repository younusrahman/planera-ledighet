
import { AbsenceReason } from "../../types";
import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";

export const leaves = createEntityModule<
  AbsenceReason,
  Partial<AbsenceReason>
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






