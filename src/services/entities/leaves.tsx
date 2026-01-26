import type { LeaveItem } from "../../types";
import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";

export const leaves = createEntityModule<LeaveItem, Partial<LeaveItem>>({
  name: "leaves",
  fetchAll: () => apiRequest("/leaves"),
  create: (body) =>
    apiRequest("/leaves", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest(`/leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest(`/leaves/${id}`, {
      method: "DELETE",
    }),
});
