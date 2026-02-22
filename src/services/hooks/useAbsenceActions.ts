import { absence } from "../stores/absenceDataStore";

export const useAbsenceBlockMutation = () => {
  const updateAbsence = async (
    id: string,
    newDuration: number,
    newStartDate?: string,
  ) => {

    return absence.updateOne(id, {
      durationDays: newDuration,
      ...(newStartDate ? { startDate: newStartDate } : {}),
    });
  };

  const deleteAbsence = async (id: string) => {
    return absence.removeOne(id);
  };

  return {
    updateAbsence,
    deleteAbsence,

    // Zustand has no async mutation state
    isUpdating: false,
    isDeleting: false,
  };
};
