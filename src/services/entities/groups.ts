import type { Group } from "../../types";
import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";

// Vad vi skickar till servern (id behövs för update pga din C# check)
type GroupBody = { id?: string; name: string };

export const groups = createEntityModule<Group, GroupBody>({
  name: "groups",
  fetchAll: () => apiRequest<Group[]>("/Group"),
  create: (body) =>
    apiRequest<Group>("/Group", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<Group>(`/Group/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/Group/${id}`, {
      method: "DELETE",
    }),
});
