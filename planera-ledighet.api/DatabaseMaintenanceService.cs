using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Services
{
    public interface IDatabaseMaintenanceService
    {
        Task<DbOperationStatus> ResetDatabaseAsync();
        Task<DbOperationStatus> BackupDatabaseAsync();
        IEnumerable<string> ListBackups();
        FileStream? GetBackupFile(string fileName);
        Task<DbOperationStatus> RestoreBackupAsync(string fileName);
        Task<DbOperationStatus> DeleteBackupAsync(string? fileName);
    }

    public class DatabaseMaintenanceService : IDatabaseMaintenanceService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IServiceProvider _services;
        private readonly IDatabaseCloser _databaseCloser;

        public DatabaseMaintenanceService(
            IWebHostEnvironment env,
            IServiceProvider services,
            IDatabaseCloser databaseCloser)
        {
            _env = env;
            _services = services;
            _databaseCloser = databaseCloser;
        }

        private string DbPath => Path.Combine(_env.ContentRootPath, "planera.db");
        private string BackupDir => Path.Combine(_env.ContentRootPath, "backups");

        private void ForceRelease()
        {
            // 1. Close the specific connection in the current scope
            _databaseCloser.CloseConnections();

            // 2. Clear all SQLite connection pools to release file handles
            SqliteConnection.ClearAllPools();

            // 3. Force garbage collection to clean up lingering objects
            GC.Collect();
            GC.WaitForPendingFinalizers();
        }

        private void TryDelete(string path)
        {
            if (File.Exists(path))
            {
                File.SetAttributes(path, FileAttributes.Normal);
                File.Delete(path);
            }
        }

        public async Task<DbOperationStatus> ResetDatabaseAsync()
        {
            try
            {
                ForceRelease();

                TryDelete(DbPath);
                TryDelete(DbPath + "-shm");
                TryDelete(DbPath + "-wal");

                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();

                return new DbOperationStatus { Success = true, Message = "Database reset and recreated successfully." };
            }
            catch (Exception ex)
            {
                return new DbOperationStatus { Success = false, Message = "Error resetting database: " + ex.Message };
            }
        }

        public async Task<DbOperationStatus> BackupDatabaseAsync()
        {
            try
            {
                ForceRelease();
                Directory.CreateDirectory(BackupDir);

                string fileName = $"planera-backup-{DateTime.Now:yyyyMMdd-HHmmss}.db";
                string backupFile = Path.Combine(BackupDir, fileName);

                File.Copy(DbPath, backupFile);

                return new DbOperationStatus { Success = true, Message = "Backup created successfully.", BackupFile = fileName };
            }
            catch (Exception ex)
            {
                return new DbOperationStatus { Success = false, Message = "Error creating backup: " + ex.Message };
            }
        }

        public IEnumerable<string> ListBackups()
        {
            Directory.CreateDirectory(BackupDir);
            return Directory.GetFiles(BackupDir, "*.db")
                            .Select(Path.GetFileName)
                            .OrderByDescending(x => x)
                            .ToList()!;
        }

        public FileStream? GetBackupFile(string fileName)
        {
            string fullPath = Path.Combine(BackupDir, fileName);
            return File.Exists(fullPath) ? File.OpenRead(fullPath) : null;
        }

        public async Task<DbOperationStatus> DeleteBackupAsync(string? fileName)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(fileName))
                {
                    // Delete ALL backups
                    var files = Directory.GetFiles(BackupDir, "*.db");
                    foreach (var file in files) File.Delete(file);
                    return new DbOperationStatus { Success = true, Message = "All backup files have been deleted." };
                }
                else
                {
                    // Delete SPECIFIC backup
                    string safeName = Path.GetFileName(fileName); // Prevents directory traversal
                    string fullPath = Path.Combine(BackupDir, safeName);

                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                        return new DbOperationStatus { Success = true, Message = $"Backup '{safeName}' deleted." };
                    }
                    return new DbOperationStatus { Success = false, Message = "Backup file not found." };
                }
            }
            catch (Exception ex)
            {
                return new DbOperationStatus { Success = false, Message = "Error deleting backup: " + ex.Message };
            }
        }

        public async Task<DbOperationStatus> RestoreBackupAsync(string fileName)
        {
            try
            {
                // Detect if fileName is a full path or just a name in the backup folder
                string backupPath = Path.IsPathRooted(fileName)
                    ? fileName
                    : Path.Combine(BackupDir, fileName);

                if (!File.Exists(backupPath))
                {
                    return new DbOperationStatus { Success = false, Message = $"Source file not found at: {backupPath}" };
                }

                ForceRelease();

                // Delete current live database files
                TryDelete(DbPath);
                TryDelete(DbPath + "-shm");
                TryDelete(DbPath + "-wal");

                // Copy backup to live location
                File.Copy(backupPath, DbPath);

                // Run migrations to ensure schema is up to date
                using var scope = _services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await db.Database.MigrateAsync();

                return new DbOperationStatus { Success = true, Message = "Database restored successfully." };
            }
            catch (Exception ex)
            {
                return new DbOperationStatus { Success = false, Message = "Error restoring database: " + ex.Message };
            }
        }
    }
}
