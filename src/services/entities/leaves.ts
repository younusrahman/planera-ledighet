import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";
import type { AbsenceBlockData } from "../../types";

export const leaves = createEntityModule<AbsenceBlockData, AbsenceBlockData>({
  name: "leaves",
  fetchAll: async () => {
    console.log("🔄 Fetching leaves from /leaves...");
    const data = await apiRequest<AbsenceBlockData[]>("/leaves");
    console.log("✅ Leaves fetched:", data);
    return data;
  },
  create: (body) =>
    apiRequest<AbsenceBlockData>("/leaves", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<AbsenceBlockData>(`/leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/leaves/${id}`, {
      method: "DELETE",
    }),
});
