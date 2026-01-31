// src/hooks/useData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AbsenceReason,
  Person,
  AbsenceBlockData,
  Team,
} from "../../types";
import { apiRequest } from "../apiInstance";

// --- QUERIES ---

export const useAbsenceTypes = () =>
  useQuery({
    queryKey: ["absenceTypes"],
    queryFn: () => apiRequest<AbsenceReason[]>("/AbsenceType"),
  });

export const useGroups = () =>
  useQuery({
    queryKey: ["groups"],
    queryFn: () => apiRequest<Person[]>("/Group"),
  });

export const useAbsences = () =>
  useQuery({
    queryKey: ["absences"],
    queryFn: () => apiRequest<AbsenceBlockData[]>("/absence"),
  });
  
export const useResources = () =>
  useQuery({
    queryKey: ["resources"],
    queryFn: () => apiRequest<AbsenceBlockData[]>("/resource"),
  });

// --- MUTATIONS ---

// 1. ABSENCE MUTATIONS (Leaves)
export const useAbsenceMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newAbsence: Omit<AbsenceBlockData, "id">) =>
      apiRequest<AbsenceBlockData>("/absence", {
        method: "POST",
        body: JSON.stringify(newAbsence),
      }),
    onMutate: async (newAbsence) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<AbsenceBlockData[]>([
        "absences",
      ]);

      // Optimistically update to the new value with a temporary ID
      if (previousAbsences) {
        const tempId = `temp-${Date.now()}`;
        const optimisticAbsence: AbsenceBlockData = {
          ...newAbsence,
          id: tempId,
        } as AbsenceBlockData;
        queryClient.setQueryData<AbsenceBlockData[]>(["absences"], (old) => [
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
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AbsenceBlockData>;
    }) =>
      apiRequest<AbsenceBlockData>(`/absence/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<AbsenceBlockData[]>([
        "absences",
      ]);

      // Optimistically update to the new value
      if (previousAbsences) {
        queryClient.setQueryData<AbsenceBlockData[]>(["absences"], (old) =>
          (old || []).map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        );
      }

      // Return a context object with the snapshotted value
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
      const previousAbsences = queryClient.getQueryData<AbsenceBlockData[]>([
        "absences",
      ]);

      // Optimistically delete
      if (previousAbsences) {
        queryClient.setQueryData<AbsenceBlockData[]>(["absences"], (old) =>
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
export const useGroupMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newGroup: { name: string }) =>
      apiRequest<Person>("/Group", {
        method: "POST",
        body: JSON.stringify(newGroup),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      apiRequest<Person>(`/Group/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/Group/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Simplified hook for components to use TanStack Query with Groups
export const useGroupMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useGroupMutations();

  const createGroup = async (name: string) => {
    try {
      await createMutation.mutateAsync({ name });
      return true;
    } catch (error) {
      console.error("Failed to create group:", error);
      return false;
    }
  };

  const updateGroup = async (id: string, name: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { name } });
      return true;
    } catch (error) {
      console.error("Failed to update group:", error);
      return false;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete group:", error);
      return false;
    }
  };

  return {
    createGroup,
    updateGroup,
    deleteGroup,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// 3. RESOURCE (ANSTÄLLD) MUTATIONS
export const useResourceMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newResource: { name: string; groupId: string }) =>
      apiRequest<Team>("/Resource", {
        method: "POST",
        body: JSON.stringify(newResource),
      }),
    // Invalidate groups because resources are nested inside Group.resources
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; groupId: string };
    }) =>
      apiRequest<Team>(`/Resource/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/Resource/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Simplified hook for components to use TanStack Query with Resources
export const useResourceMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useResourceMutations();

  const createResource = async (name: string, groupId: string) => {
    try {
      await createMutation.mutateAsync({ name, groupId });
      return true;
    } catch (error) {
      console.error("Failed to create resource:", error);
      return false;
    }
  };

  const updateResource = async (id: string, name: string, groupId: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { name, groupId } });
      return true;
    } catch (error) {
      console.error("Failed to update resource:", error);
      return false;
    }
  };

  const deleteResource = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete resource:", error);
      return false;
    }
  };

  return {
    createResource,
    updateResource,
    deleteResource,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

// 4. ABSENCE TYPE MUTATIONS
export const useAbsenceTypeMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newType: { label: string; color: string }) =>
      apiRequest<AbsenceReason>("/AbsenceType", {
        method: "POST",
        body: JSON.stringify(newType),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["absenceTypes"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { label: string; color: string };
    }) =>
      apiRequest<AbsenceReason>(`/AbsenceType/${id}`, {
        method: "PUT",
        body: JSON.stringify({ id, ...data }),
      }),
    onSuccess: () => {
      // Refresh types AND absences because existing blocks might need to update their color/label
      queryClient.invalidateQueries({ queryKey: ["absenceTypes"] });
      queryClient.invalidateQueries({ queryKey: ["absences"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/AbsenceType/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["absenceTypes"] }),
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Simplified hook for components to use TanStack Query with AbsenceTypes
export const useAbsenceTypeMutation = () => {
  const { createMutation, updateMutation, deleteMutation } =
    useAbsenceTypeMutations();

  const createAbsenceType = async (label: string, color: string) => {
    try {
      await createMutation.mutateAsync({ label, color });
      return true;
    } catch (error) {
      console.error("Failed to create absence type:", error);
      return false;
    }
  };

  const updateAbsenceType = async (
    id: string,
    label: string,
    color: string,
  ) => {
    try {
      await updateMutation.mutateAsync({ id, data: { label, color } });
      return true;
    } catch (error) {
      console.error("Failed to update absence type:", error);
      return false;
    }
  };

  const deleteAbsenceType = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch (error) {
      console.error("Failed to delete absence type:", error);
      return false;
    }
  };

  return {
    createAbsenceType,
    updateAbsenceType,
    deleteAbsenceType,
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
