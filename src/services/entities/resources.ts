import type { Resource } from "../../types";
import { apiRequest } from "../apiInstance";
import { appServicesStatic } from "../appServices";
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
  update: async (id, body) => {
    const res = await apiRequest<Resource>(`/Resource/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // Uppdatera allt efter lyckat anrop
    await appServicesStatic.absences.loadAll();

    return res;
  },
  remove: (id) =>
    apiRequest<void>(`/Resource/${id}`, {
      method: "DELETE",
    }),
});
