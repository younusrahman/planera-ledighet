// src/hooks/useData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Employee, Absence, Team, AbsenceCategory } from "../../types";
import { apiRequest } from "../apiInstance";
import { absence } from "../stores/absenceStore";

// --- QUERIES ---

export const useAbsenceCategories = () =>
  useQuery({
    queryKey: ["absenceCategories"],
    queryFn: () => apiRequest<AbsenceCategory[]>("/AbsenceCategorys"),
  });

export const useTeams = () =>
  useQuery({
    queryKey: ["teams"],
    queryFn: () => apiRequest<Team[]>("/teams"),
  });

export const useEmployees = () =>
  useQuery({
    queryKey: ["employees"],
    queryFn: () => apiRequest<Employee[]>("/employees"),
  });

// --- MUTATIONS ---

// 1. ABSENCE MUTATIONS (Leaves)
export const useAbsenceMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newAbsence: Omit<Absence, "id">) =>
      apiRequest<Absence>("/absence", {
        method: "POST",
        body: JSON.stringify(newAbsence),
      }),
    onMutate: async (newAbsence) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<Absence[]>([
        "absences",
      ]);

      // Optimistically update to the new value with a temporary ID
      if (previousAbsences) {
        const tempId = `temp-${Date.now()}`;
        const optimisticAbsence: Absence = {
          ...newAbsence,
          id: tempId,
        } as Absence;
        queryClient.setQueryData<Absence[]>(["absences"], (old) => [
          ...(old || []),
          optimisticAbsence,
        ]);
      }

      // Return a context object with the snapshotted value
      return { previousAbsences };
    },
    onError: (_err, _newAbsence, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAbsences) {
        queryClient.setQueryData(["absences"], context.previousAbsences);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Absence> }) =>
      apiRequest<Absence>(`/absence/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<Absence[]>([
        "absences",
      ]);

      // Optimistically update to the new value
      if (previousAbsences) {
        queryClient.setQueryData<Absence[]>(["absences"], (old) =>
          (old || []).map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        );
      }

      return { previousAbsences };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAbsences) {
        queryClient.setQueryData(["absences"], context.previousAbsences);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/absence/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<Absence[]>([
        "absences",
      ]);

      // Optimistically delete
      if (previousAbsences) {
        queryClient.setQueryData<Absence[]>(["absences"], (old) =>
          (old || []).filter((item) => item.id !== id),
        );
      }

      // Return a context object with the snapshotted value
      return { previousAbsences };
    },
    onError: (_err, _id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAbsences) {
        queryClient.setQueryData(["absences"], context.previousAbsences);
      }
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Hook specifically for AbsenceBlock - integrates TanStack Query with Zustand
export const useAbsenceBlockMutation = () => {
  const { updateMutation, deleteMutation } = useAbsenceMutations();

  // Update absence duration/dates via TanStack Query
  const updateAbsence = async (
    id: string,
    newDuration: number,
    newStartDate?: string,
  ) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: newStartDate
          ? { durationDays: newDuration, startDate: newStartDate }
          : { durationDays: newDuration },
      });
      return true;
    } catch (error) {
      console.error("Failed to update absence:", error);
      return false;
    }
  };

  // Delete absence via TanStack Query
  const deleteAbsence = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete absence:", error);
      return false;
    }
  };

  return {
    updateAbsence,
    deleteAbsence,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// 2. GROUP MUTATIONS
export const useTeamMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newTeam: { name: string }) =>
      apiRequest<Employee>("/team", {
        method: "POST",
        body: JSON.stringify(newTeam),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      apiRequest<Employee>(`/team/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/team/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Simplified hook for components to use TanStack Query with Groups
export const useTeamMutation = () => {
  const { createMutation, updateMutation, deleteMutation } = useTeamMutations();

  const createTeam = async (name: string) => {
    try {
      await createMutation.mutateAsync({ name });
      return true;
    } catch (error) {
      console.error("Failed to create team:", error);
      return false;
    }
  };

  const updateTeam = async (id: string, name: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { name } });
      return true;
    } catch (error) {
      console.error("Failed to update team:", error);
      return false;
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete team:", error);
      return false;
    }
  };

  return {
    createTeam: createTeam,
    updateTeam: updateTeam,
    deleteTeam: deleteTeam,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// 3. RESOURCE (ANSTÄLLD) MUTATIONS
export const useEmployeeMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newEmployee: { name: string; teamId: string }) =>
      apiRequest<Employee>("/Employee", {
        method: "POST",
        body: JSON.stringify(newEmployee),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; teamId: string };
    }) =>
      apiRequest<Team>(`/Employee/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["absences"] });
      absence.loadAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/Employee/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Simplified hook for components to use TanStack Query with Resources
export const useEmployeeMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useEmployeeMutations();

  const createEmployee = async (name: string, teamId: string) => {
    try {
      await createMutation.mutateAsync({ name, teamId: teamId });
      return true;
    } catch (error) {
      console.error("Failed to create employee:", error);
      return false;
    }
  };

  const updateEmployee = async (id: string, name: string, teamId: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { name, teamId: teamId } });
      return true;
    } catch (error) {
      console.error("Failed to update employee:", error);
      return false;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete employee:", error);
      return false;
    }
  };

  return {
    createEmployee: createEmployee,
    updateEmployee: updateEmployee,
    deleteEmployee: deleteEmployee,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// 4. ABSENCE TYPE MUTATIONS
export const useAbsenceCategoryMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newType: { label: string; color: string }) =>
      apiRequest<AbsenceCategory>("/AbsenceCategory", {
        method: "POST",
        body: JSON.stringify(newType),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["absenceCategories"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { label: string; color: string };
    }) =>
      apiRequest<AbsenceCategory>(`/AbsenceCategory/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => {
      (queryClient.invalidateQueries({ queryKey: ["absenceCategories"] }),
        queryClient.invalidateQueries({ queryKey: ["absences"] }));
      absence.loadAll();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/AbsenceCategory/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["absenceCategories"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Simplified hook for components to use TanStack Query with AbsenceCategories
export const useAbsenceCategoryMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useAbsenceCategoryMutations();

  const createAbsenceCategory = async (label: string, color: string) => {
    try {
      await createMutation.mutateAsync({ label, color });
      return true;
    } catch (error) {
      console.error("Failed to create absence category:", error);
      return false;
    }
  };

  const updateAbsenceCategory = async (
    id: string,
    label: string,
    color: string,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, data: { label, color } });
      return true;
    } catch (error) {
      console.error("Failed to update absence category:", error);
      return false;
    }
  };

  const deleteAbsenceCategory = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete absence category:", error);
      return false;
    }
  };

  return {
    createAbsenceCategory: createAbsenceCategory,
    updateAbsenceCategory: updateAbsenceCategory,
    deleteAbsenceCategory: deleteAbsenceCategory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// --- DATABASE QUERIES ---
export const useBackups = () =>
  useQuery({
    queryKey: ["backups"],
    queryFn: () => apiRequest<string[]>("/Database/list"),
  });

// --- DATABASE MUTATIONS ---
export const useDatabaseMutations = () => {
  const queryClient = useQueryClient();

  const backupMutation = useMutation({
    mutationFn: () => apiRequest<any>("/Database/backup", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiRequest<any>("/Database/reset", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(), // Uppdatera ALLT eftersom databasen är ny
  });

  const restoreMutation = useMutation({
    mutationFn: (fileName: string) =>
      apiRequest<any>(`/Database/restore/${fileName}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(), // Uppdatera ALLT
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (fileName?: string) =>
      apiRequest<any>(
        `/Database/backup${fileName ? `?fileName=${fileName}` : ""}`,
        { method: "DELETE" },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest<any>("/Database/upload", { method: "POST", body: formData }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  return {
    backupMutation,
    resetMutation,
    restoreMutation,
    deleteBackupMutation,
    uploadMutation,
  };
};
