// src/hooks/useData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AbsenceType, Group, AbsenceDetails, Resource } from "../../types";
import { apiRequest } from "../apiInstance";

// --- QUERIES ---

export const useAbsenceTypes = () =>
  useQuery({
    queryKey: ["absenceTypes"],
    queryFn: () => apiRequest<AbsenceType[]>("/AbsenceType"),
  });

export const useGroups = () =>
  useQuery({
    queryKey: ["groups"],
    queryFn: () => apiRequest<Group[]>("/Group"),
  });

export const useAbsences = () =>
  useQuery({
    queryKey: ["absences"],
    queryFn: () => apiRequest<AbsenceDetails[]>("/absence"),
  });

// --- MUTATIONS ---

// 1. ABSENCE MUTATIONS (Leaves)
export const useAbsenceMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newAbsence: Omit<AbsenceDetails, "id">) =>
      apiRequest<AbsenceDetails>("/absence", {
        method: "POST",
        body: JSON.stringify(newAbsence),
      }),
    onMutate: async (newAbsence) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<AbsenceDetails[]>([
        "absences",
      ]);

      // Optimistically update to the new value with a temporary ID
      if (previousAbsences) {
        const tempId = `temp-${Date.now()}`;
        const optimisticAbsence: AbsenceDetails = {
          ...newAbsence,
          id: tempId,
        } as AbsenceDetails;
        queryClient.setQueryData<AbsenceDetails[]>(["absences"], (old) => [
          ...(old || []),
          optimisticAbsence,
        ]);
      }

      // Return a context object with the snapshotted value
      return { previousAbsences };
    },
    onError: (err, newAbsence, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAbsences) {
        queryClient.setQueryData(["absences"], context.previousAbsences);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AbsenceDetails> }) =>
      apiRequest<AbsenceDetails>(`/absence/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["absences"] });

      // Snapshot the previous value
      const previousAbsences = queryClient.getQueryData<AbsenceDetails[]>([
        "absences",
      ]);

      // Optimistically update to the new value
      if (previousAbsences) {
        queryClient.setQueryData<AbsenceDetails[]>(["absences"], (old) =>
          (old || []).map((item) =>
            item.id === id ? { ...item, ...data } : item,
          ),
        );
      }

      // Return a context object with the snapshotted value
      return { previousAbsences };
    },
    onError: (err, variables, context) => {
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
      const previousAbsences = queryClient.getQueryData<AbsenceDetails[]>([
        "absences",
      ]);

      // Optimistically delete
      if (previousAbsences) {
        queryClient.setQueryData<AbsenceDetails[]>(["absences"], (old) =>
          (old || []).filter((item) => item.id !== id),
        );
      }

      // Return a context object with the snapshotted value
      return { previousAbsences };
    },
    onError: (err, id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAbsences) {
        queryClient.setQueryData(["absences"], context.previousAbsences);
      }
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

// 2. GROUP MUTATIONS
export const useGroupMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newGroup: { name: string }) =>
      apiRequest<Group>("/Group", {
        method: "POST",
        body: JSON.stringify(newGroup),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      apiRequest<Group>(`/Group/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
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

// 3. RESOURCE (ANSTÄLLD) MUTATIONS
export const useResourceMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newResource: { name: string; groupId: string }) =>
      apiRequest<Resource>("/Resource", {
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
      apiRequest<Resource>(`/Resource/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
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

// 4. ABSENCE TYPE MUTATIONS
export const useAbsenceTypeMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (newType: { label: string; color: string }) =>
      apiRequest<AbsenceType>("/AbsenceType", {
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
      apiRequest<AbsenceType>(`/AbsenceType/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
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






