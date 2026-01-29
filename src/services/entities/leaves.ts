import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";
import type { LeaveItem } from "../../types";

export const leaves = createEntityModule<LeaveItem, LeaveItem>({
  name: "leaves",
  fetchAll: () => apiRequest<LeaveItem[]>("/leaves"),
  create: (body) =>
    apiRequest<LeaveItem>("/leaves", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<LeaveItem>(`/leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/leaves/${id}`, {
      method: "DELETE",
    }),
});

