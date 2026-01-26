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
        public async Task<ActionResult<DbOperationStatus>> DeleteBackup([FromQuery] string? fileName = null)
        {
            // [FromQuery] ensures that if ?fileName=xyz is present, it is captured.
            // If the query string is missing, fileName remains null (Delete All).
            return Ok(await _db.DeleteBackupAsync(fileName));
        }

        [HttpPost("upload")]
        public async Task<ActionResult<DbOperationStatus>> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return Ok(new DbOperationStatus { Success = false, Message = "Ingen fil vald." });

            using (var stream = file.OpenReadStream())
            {
                // This takes the file data and saves it into your project's backup folder
                var result = await _db.UploadBackupAsync(stream, file.FileName);
                return Ok(result);
            }
        }
    }
}