import type { AbsenceType } from "../../types";
import { apiRequest } from "../apiInstance";
import { appServicesStatic } from "../appServices";
import { createEntityModule } from "../entityModule";

export type AbsenceTypeBody = {
  id?: string;
  label: string;
  color: string;
};

export const absenceTypes = createEntityModule<AbsenceType, AbsenceTypeBody>({
  name: "absenceTypes",
  fetchAll: () => apiRequest<AbsenceType[]>("/AbsenceType"),
  create: (body) =>
    apiRequest<AbsenceType>("/AbsenceType", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: async (id, body) => {
    const res = await apiRequest<AbsenceType>(`/AbsenceType/${id}`, {
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
