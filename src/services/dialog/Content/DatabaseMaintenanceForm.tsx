import React, { useState, useRef } from "react";
import {
  Storage as DatabaseIcon,
  CloudDownload as DownloadIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  RestartAlt as ResetIcon,
  FolderOpen as PathIcon,
  FileOpen as BrowseIcon,
  UploadFile as UploadIcon,
} from "@mui/icons-material";
import { toast } from "../../stores/globalSnackbar";
import { BASE_URL } from "../../apiInstance";
import { ProTooltip } from "../../../components/ProTooltip";
import { useBackups, useDatabaseMutations } from "../../hooks/useData";

export interface DatabaseMaintenanceProps {
  title: string;
  onClose: () => void;
}

export const DatabaseMaintenanceForm: React.FC<DatabaseMaintenanceProps> = ({
  title,
  onClose,
}) => {
  const [manualPath, setManualPath] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: backups = [] } = useBackups();
  const {
    backupMutation,
    resetMutation,
    restoreMutation,
    deleteBackupMutation,
    uploadMutation,
  } = useDatabaseMutations();

  const isLoading =
    backupMutation.isPending ||
    resetMutation.isPending ||
    restoreMutation.isPending ||
    deleteBackupMutation.isPending ||
    uploadMutation.isPending;

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    action: () => {},
    isDanger: false,
  });

  const openConfirm = (
    title: string,
    message: string,
    action: () => void,
    isDanger: boolean = false,
  ) => {
    setConfirm({ open: true, title, message, action, isDanger });
  };

  const closeConfirm = () => setConfirm((prev) => ({ ...prev, open: false }));

  const executeAction = async (
    task: () => Promise<void>,
    successMsg: string,
  ) => {
    try {
      await task();
      toast(successMsg, "success");
      if (successMsg.includes("återställt")) setManualPath("");
    } catch (e: any) {
      toast(e.message || "Ett oväntat fel uppstod", "error");
    } finally {
      closeConfirm();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadMutation.mutateAsync(formData);
      toast("Filen har laddats upp till servern!", "success");
      setManualPath(file.name);
    } catch (e) {
      toast("Kunde inte ansluta till servern för uppladdning", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (fileName: string) => {
    window.open(`${BASE_URL}/Database/download/${fileName}`, "_blank");
  };

  return (
    <div className="relative">
      <div className="mb-2 flex items-center gap-2 text-xl font-bold text-gray-900">
        <DatabaseIcon className="text-blue-600" />
        <span>{title}</span>
      </div>

      <div className="mt-1 space-y-6">
        {/* SECTION 1 */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Systemåtgärder
          </div>

          <div className="mt-2 flex flex-row gap-2">
            <button
              type="button"
              onClick={() =>
                executeAction(async () => {
                  await backupMutation.mutateAsync();
                }, "Ny backup skapad")
              }
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BackupIcon fontSize="small" />
              Skapa Backup
            </button>

            <button
              type="button"
              onClick={() =>
                openConfirm(
                  "Fabriksåterställning",
                  "Detta raderar ALLA data i den aktiva databasen. Systemet återställs till ett tomt läge. Vill du fortsätta?",
                  () =>
                    executeAction(async () => {
                      await resetMutation.mutateAsync();
                    }, "Systemet nollställt"),
                  true,
                )
              }
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-amber-500 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ResetIcon fontSize="small" />
              Nollställ allt
            </button>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* SECTION 2 */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Återställ från fil / Sökväg
          </div>

          <input
            type="file"
            accept=".db"
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />

          <div className="mt-2 flex gap-2">
            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <PathIcon fontSize="small" />
              </div>

              <input
                type="text"
                placeholder="Filnamn eller C:\Sökväg\fil.db"
                value={manualPath}
                onChange={(e) => setManualPath(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
              />

              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ProTooltip title="Bläddra efter lokal fil (.db)">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="rounded p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                  >
                    <BrowseIcon fontSize="small" />
                  </button>
                </ProTooltip>
              </div>
            </div>

            <button
              type="button"
              disabled={!manualPath || isLoading}
              onClick={() =>
                openConfirm(
                  "Bekräfta Återställning",
                  `Nuvarande data kommer att skrivas över med filen: ${manualPath}. Vill du fortsätta?`,
                  () =>
                    executeAction(async () => {
                      await restoreMutation.mutateAsync(manualPath);
                    }, "Systemet återställt"),
                )
              }
              className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadIcon fontSize="small" />
              Kör
            </button>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* SECTION 3 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Serverns Backuphistorik ({backups.length})
            </div>

            <button
              type="button"
              disabled={backups.length === 0 || isLoading}
              onClick={() =>
                openConfirm(
                  "Rensa alla backuper?",
                  "Detta raderar permanent samtliga backup-filer i mappen på servern. Vill du fortsätta?",
                  () =>
                    executeAction(async () => {
                      await deleteBackupMutation.mutateAsync(undefined);
                    }, "Alla backuper raderade"),
                  true,
                )
              }
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <DeleteIcon fontSize="small" />
              Rensa alla
            </button>
          </div>

          <div className="max-h-[250px] overflow-auto rounded-md border border-gray-300 bg-gray-50">
            {backups.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {backups.map((file) => (
                  <li
                    key={file}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {file}
                    </div>

                    <div className="flex items-center gap-1">
                      <ProTooltip title="Ladda ner till din dator">
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="rounded p-2 text-gray-600 transition hover:bg-gray-200 hover:text-gray-900"
                        >
                          <DownloadIcon fontSize="small" />
                        </button>
                      </ProTooltip>

                      <ProTooltip title="Återställ systemet från denna fil">
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(
                              "Återställ backup?",
                              `Vill du ersätta live-databasen med data från ${file}?`,
                              () =>
                                executeAction(async () => {
                                  await restoreMutation.mutateAsync(file);
                                }, "Systemet återställt"),
                            )
                          }
                          className="rounded p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <RestoreIcon fontSize="small" />
                        </button>
                      </ProTooltip>

                      <ProTooltip title="Radera filen från servern">
                        <button
                          type="button"
                          onClick={() =>
                            openConfirm(
                              "Radera fil?",
                              `Är du säker på att du vill radera ${file} permanent?`,
                              () =>
                                executeAction(async () => {
                                  await deleteBackupMutation.mutateAsync(file);
                                }, "Backup raderad"),
                              true,
                            )
                          }
                          className="rounded p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </ProTooltip>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-gray-400">
                Inga sparade backuper hittades på servern.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-0 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Stäng
        </button>
      </div>

      {/* Confirmation Dialog */}
      {confirm.open && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="px-6 pt-6 text-lg font-bold text-gray-900">
              {confirm.title}
            </div>

            <div className="px-6 py-4 text-sm text-gray-600">
              {confirm.message}
            </div>

            <div className="flex justify-end gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={closeConfirm}
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
              >
                Avbryt
              </button>

              <button
                type="button"
                onClick={confirm.action}
                autoFocus
                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                  confirm.isDanger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                Bekräfta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-white/70">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        </div>
      )}
    </div>
  );
};
