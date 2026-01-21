import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";
import type { AbsenceItem } from "../../types";

export const leaves = createEntityModule<AbsenceItem, AbsenceItem>({
  name: "leaves",
  fetchAll: () => apiRequest<AbsenceItem[]>("/leaves"),
  create: (body) =>
    apiRequest<AbsenceItem>("/leaves", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<AbsenceItem>(`/leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/leaves/${id}`, {
      method: "DELETE",
    }),
});
