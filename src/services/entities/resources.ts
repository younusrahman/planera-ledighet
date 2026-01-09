import type { Resource } from "../../types";
import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";

// Vi inkluderar groupId här eftersom din ResourceController behöver veta vilken grupp den anställda tillhör
type ResourceBody = { id?: string; name: string; groupId: string };

export const resources = createEntityModule<Resource, ResourceBody>({
  name: "resources",
  fetchAll: () => apiRequest<Resource[]>("/Resource"),
  create: (body) =>
    apiRequest<Resource>("/Resource", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<Resource>(`/Resource/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/Resource/${id}`, {
      method: "DELETE",
    }),
});
