import { apiRequest } from "../apiInstance";

export type DbOperationStatus = {
  success: boolean;
  message?: string;
};

export type UploadResponse = {
  success: boolean;
  fileName?: string;
  message?: string;
};

export const databaseService = {
  name: "database",

  reset: () =>
    apiRequest<DbOperationStatus>("/Database/reset", {
      method: "POST",
    }),

  backup: () =>
    apiRequest<DbOperationStatus>("/Database/backup", {
      method: "POST",
    }),

  list: () => apiRequest<string[]>("/Database/list"),

  restore: (fileName: string) =>
    apiRequest<DbOperationStatus>(`/Database/restore/${fileName}`, {
      method: "POST",
    }),

  deleteBackup: (fileName?: string) =>
    apiRequest<DbOperationStatus>(
      `/Database/backup${fileName ? `?fileName=${fileName}` : ""}`,
      { method: "DELETE" }
    ),

  upload: (formData: FormData) =>
    apiRequest<UploadResponse>("/Database/upload", {
      method: "POST",
      body: formData,
    }),
};
