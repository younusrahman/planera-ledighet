using Microsoft.AspNetCore.Mvc;
using planera_ledighet.api.Services;
using planera_ledighet.api; // Ensure this is here for DbOperationStatus
using System.Collections.Generic;
using System.Threading.Tasks;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DatabaseController : ControllerBase
    {
        private readonly IDatabaseMaintenanceService _db;

        public DatabaseController(IDatabaseMaintenanceService db)
        {
            _db = db;
        }

        [HttpPost("reset")]
        public async Task<ActionResult<DbOperationStatus>> Reset()
            => Ok(await _db.ResetDatabaseAsync());

        // REMOVED: [HttpDelete("delete")] as requested

        [HttpPost("backup")]
        public async Task<ActionResult<DbOperationStatus>> Backup()
            => Ok(await _db.BackupDatabaseAsync());

        [HttpGet("list")]
        public ActionResult<IEnumerable<string>> List()
            => Ok(_db.ListBackups());

        [HttpGet("download/{fileName}")]
        public IActionResult Download(string fileName)
        {
            var stream = _db.GetBackupFile(fileName);
            if (stream == null) return NotFound();

            return File(stream, "application/octet-stream", fileName);
        }

        [HttpPost("restore/{*fileName}")]
        public async Task<ActionResult<DbOperationStatus>> Restore(string fileName)
        {
            return Ok(await _db.RestoreBackupAsync(fileName));
        }

        [HttpDelete("backup")]
        [HttpDelete("backup/{*fileName}")]
        public async Task<ActionResult<DbOperationStatus>> DeleteBackup(string? fileName = null)
        {
            return Ok(await _db.DeleteBackupAsync(fileName));
        }
    }
}