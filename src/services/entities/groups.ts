import type { Person } from "../../types";
import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";

// Vad vi skickar till servern (id behövs för update pga din C# check)
type PersonBody = { id?: string; name: string };

export const groups = createEntityModule<Person, PersonBody>({
  name: "groups",
  fetchAll: () => apiRequest<Person[]>("/Group"),
  create: (body) =>
    apiRequest<Person>("/Group", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<Person>(`/Group/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/Group/${id}`, {
      method: "DELETE",
    }),
});
