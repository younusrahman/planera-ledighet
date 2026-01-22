import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";
import type { Absence } from "../../types";

export const absences = createEntityModule<Absence, Absence>({
  name: "absences",
  fetchAll: () => apiRequest<Absence[]>("/absences"),
  create: (body) =>
    apiRequest<Absence>("/absences", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<Absence>(`/absences/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/absences/${id}`, {
      method: "DELETE",
    }),
});
