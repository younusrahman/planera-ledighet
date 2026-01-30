import type { AbsenceReason } from "../../types";
import { apiRequest } from "../apiInstance";
import { appServicesStatic } from "../appServices";
import { createEntityModule } from "../entityModule";

export type AbsenceReasonBody = {
  id?: string;
  label: string;
  color: string;
};

export const absenceTypes = createEntityModule<
  AbsenceReason,
  AbsenceReasonBody
>({
  name: "absenceTypes",
  fetchAll: () => apiRequest<AbsenceReason[]>("/AbsenceType"),
  create: (body) =>
    apiRequest<AbsenceReason>("/AbsenceType", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: async (id, body) => {
    const res = await apiRequest<AbsenceReason>(`/AbsenceType/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    // Uppdatera allt efter lyckat anrop
    await appServicesStatic.leaves.loadAll();

    return res;
  },
  remove: (id) =>
    apiRequest<void>(`/AbsenceType/${id}`, {
      method: "DELETE",
    }),
});
