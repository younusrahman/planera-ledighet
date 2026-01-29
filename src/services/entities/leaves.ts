import { apiRequest } from "../apiInstance";
import { createEntityModule } from "../entityModule";
import type { AbsenceDetails } from "../../types";

export const leaves = createEntityModule<AbsenceDetails, AbsenceDetails>({
  name: "leaves",
  fetchAll: async () => {
    console.log("🔄 Fetching leaves from /leaves...");
    const data = await apiRequest<AbsenceDetails[]>("/leaves");
    console.log("✅ Leaves fetched:", data);
    return data;
  },
  create: (body) =>
    apiRequest<AbsenceDetails>("/leaves", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id, body) =>
    apiRequest<AbsenceDetails>(`/leaves/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  remove: (id) =>
    apiRequest<void>(`/leaves/${id}`, {
      method: "DELETE",
    }),
});



