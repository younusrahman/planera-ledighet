import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Team, Employee, AbsenceCategory } from "../../types";
import { apiRequest } from "../apiInstance";
// --------------------------------------------------
// QUERIES
// --------------------------------------------------

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

export const useAbsenceCategories = () =>
  useQuery({
    queryKey: ["absenceCategories"],
    queryFn: () => apiRequest<AbsenceCategory[]>("/AbsenceCategorys"),
  });

// --------------------------------------------------
// TEAM MUTATIONS
// --------------------------------------------------

export const useTeamMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiRequest<Team>(`/Team?name=${encodeURIComponent(data.name)}`, {
        method: "POST",
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<Team[]>(["teams"], (old) =>
        old ? [...old, created] : [created],
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiRequest<Team>(`/Team/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, name }),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Team[]>(["teams"], (old) =>
        old?.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/Team/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Team[]>(["teams"], (old) =>
        old?.filter((t) => t.id !== id),
      );
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

export const useTeamMutation = () => {
  const { createMutation, updateMutation, deleteMutation } = useTeamMutations();

  return {
    createTeam: (name: string) => createMutation.mutateAsync({ name }),
    updateTeam: (id: string, name: string) =>
      updateMutation.mutateAsync({ id, name }),
    deleteTeam: (id: string) => deleteMutation.mutateAsync(id),

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
    mutationFn: (data: { name: string; teamId: string }) =>
      apiRequest<Employee>("/Employee", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<Employee[]>(["employees"], (old) =>
        old ? [...old, created] : [created],
      );
    },
  });

  const updateMutation = useMutation<
    Employee, // TData
    Error, // TError
    { id: string; name: string; teamId: string } // TVariables
  >({
    mutationFn: ({ id, name, teamId }) =>
      apiRequest<Employee>(`/Employee/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, name, teamId }),
      }),

    onSuccess: (updated) => {
      // 1. Update employees cache
      queryClient.setQueryData<Employee[]>(["employees"], (old) =>
        old?.map((e) => (e.id === updated.id ? updated : e)),
      );

      // 2. No need to update absences — employee name is not stored there
      //    Timeline will re-render automatically because employees changed.
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/Employee/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Employee[]>(["employees"], (old) =>
        old?.filter((e) => e.id !== id),
      );
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

export const useEmployeeMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useEmployeeMutations();

  return {
    createEmployee: (name: string, teamId: string) =>
      createMutation.mutateAsync({ name, teamId }),
    updateEmployee: (id: string, name: string, teamId: string) =>
      updateMutation.mutateAsync({ id, name, teamId }),
    deleteEmployee: (id: string) => deleteMutation.mutateAsync(id),

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
    mutationFn: (data: { label: string; color: string }) =>
      apiRequest<AbsenceCategory>("/AbsenceCategory", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (created) => {
      queryClient.setQueryData<AbsenceCategory[]>(
        ["absenceCategories"],
        (old) => (old ? [...old, created] : [created]),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      label,
      color,
    }: {
      id: string;
      label: string;
      color: string;
    }) =>
      apiRequest<AbsenceCategory>(`/AbsenceCategory/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, label, color }),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<AbsenceCategory[]>(
        ["absenceCategories"],
        (old) =>
          old?.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/AbsenceCategory/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      queryClient.setQueryData<AbsenceCategory[]>(
        ["absenceCategories"],
        (old) => old?.filter((c) => c.id !== id),
      );
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

export const useAbsenceCategoryMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useAbsenceCategoryMutations();

  return {
    createAbsenceCategory: (label: string, color: string) =>
      createMutation.mutateAsync({ label, color }),
    updateAbsenceCategory: (id: string, label: string, color: string) =>
      updateMutation.mutateAsync({ id, label, color }),
    deleteAbsenceCategory: (id: string) => deleteMutation.mutateAsync(id),

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
