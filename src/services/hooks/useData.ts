// src/hooks/useData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Employee, Team, AbsenceCategory } from "../../types";
import { apiRequest } from "../apiInstance";
import { absence } from "../stores/absenceDataStore";

// --------------------------------------------------
// QUERIES
// --------------------------------------------------

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

// --------------------------------------------------
// TEAM MUTATIONS
// --------------------------------------------------

export const useTeamMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newTeam: { name: string }) =>
      apiRequest<Team>("/team", {
        method: "POST",
        body: JSON.stringify(newTeam),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      apiRequest<Team>(`/team/${id}`, {
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

export const useTeamMutation = () => {
  const { createMutation, updateMutation, deleteMutation } = useTeamMutations();

  const createTeam = async (name: string) => {
    try {
      await createMutation.mutateAsync({ name });
      return true;
    } catch {
      return false;
    }
  };

  const updateTeam = async (id: string, name: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { name } });
      return true;
    } catch {
      return false;
    }
  };

  const deleteTeam = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// --------------------------------------------------
// EMPLOYEE MUTATIONS
// --------------------------------------------------

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
      apiRequest<Employee>(`/Employee/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      absence.loadAll(); // Absence uses Zustand only
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/Employee/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

export const useEmployeeMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useEmployeeMutations();

  const createEmployee = async (name: string, teamId: string) => {
    try {
      await createMutation.mutateAsync({ name, teamId });
      return true;
    } catch {
      return false;
    }
  };

  const updateEmployee = async (id: string, name: string, teamId: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { name, teamId } });
      return true;
    } catch {
      return false;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// --------------------------------------------------
// ABSENCE CATEGORY MUTATIONS
// --------------------------------------------------

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
      queryClient.invalidateQueries({ queryKey: ["absenceCategories"] });
      absence.loadAll(); // Absence uses Zustand only
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

export const useAbsenceCategoryMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useAbsenceCategoryMutations();

  const createAbsenceCategory = async (label: string, color: string) => {
    try {
      await createMutation.mutateAsync({ label, color });
      return true;
    } catch {
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
    } catch {
      return false;
    }
  };

  const deleteAbsenceCategory = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    createAbsenceCategory,
    updateAbsenceCategory,
    deleteAbsenceCategory,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// --------------------------------------------------
// DATABASE QUERIES
// --------------------------------------------------

export const useBackups = () =>
  useQuery({
    queryKey: ["backups"],
    queryFn: () => apiRequest<string[]>("/Database/list"),
  });

// --------------------------------------------------
// DATABASE MUTATIONS
// --------------------------------------------------

export const useDatabaseMutations = () => {
  const queryClient = useQueryClient();

  const backupMutation = useMutation({
    mutationFn: () => apiRequest("/Database/backup", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const resetMutation = useMutation({
    mutationFn: () => apiRequest("/Database/reset", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const restoreMutation = useMutation({
    mutationFn: (fileName: string) =>
      apiRequest(`/Database/restore/${fileName}`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (fileName?: string) =>
      apiRequest(`/Database/backup${fileName ? `?fileName=${fileName}` : ""}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) =>
      apiRequest("/Database/upload", { method: "POST", body: formData }),
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
