import type { Team } from "../../types";
import { apiRequest } from "../apiInstance";
import { appServicesStatic } from "../appServices";
import { createEntityModule } from "../entityModule";

// Vi inkluderar groupId här eftersom din ResourceController behöver veta vilken grupp den anställda tillhör
type TeamBody = { id?: string; name: string; groupId: string };

export const resources = createEntityModule<Team, TeamBody>({
  name: "resources",
  fetchAll: () => apiRequest<Team[]>("/Resource"),
  create: (body) =>
    apiRequest<Team>("/Resource", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: async (id, body) => {
    const res = await apiRequest<Team>(`/Resource/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // Uppdatera allt efter lyckat anrop
    await appServicesStatic.leaves.loadAll();

    return res;
  },
  remove: (id) =>
    apiRequest<void>(`/Resource/${id}`, {
      method: "DELETE",
    }),
});
