using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UiConfigsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UiConfigsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetUiConfigs()
        {
            var config = await _context.UiConfigs.FirstOrDefaultAsync();

            if (config == null)
            {
                return Ok(new
                {
                    blockPastDays = false,
                    disableDeletion = false,
                    cellWidth = 35,
                    rowHeight = 28,
                    sidebarWidthFull = 140,
                    sidebarWidthCompact = 70,
                    sidebarWidthHidden = 0
                });
            }

            return Ok(new
            {
                blockPastDays = config.BlockPastDays,
                disableDeletion = config.DisableDeletion,
                cellWidth = config.CellWidth,
                rowHeight = config.RowHeight,
                sidebarWidthFull = config.SidebarWidthFull,
                sidebarWidthCompact = config.SidebarWidthCompact,
                sidebarWidthHidden = config.SidebarWidthHidden
            });
        }

        [HttpPut]
        public async Task<IActionResult> SaveUiConfigs([FromBody] UiConfig dto)
        {
            var config = await _context.UiConfigs.FirstOrDefaultAsync();

            if (config == null)
            {
                config = new UiConfig();
                _context.UiConfigs.Add(config);
            }

            config.BlockPastDays = dto.BlockPastDays;
            config.DisableDeletion = dto.DisableDeletion;
            config.CellWidth = dto.CellWidth;
            config.RowHeight = dto.RowHeight;
            config.SidebarWidthFull = dto.SidebarWidthFull;
            config.SidebarWidthCompact = dto.SidebarWidthCompact;
            config.SidebarWidthHidden = dto.SidebarWidthHidden;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                blockPastDays = config.BlockPastDays,
                disableDeletion = config.DisableDeletion,
                cellWidth = config.CellWidth,
                rowHeight = config.RowHeight,
                sidebarWidthFull = config.SidebarWidthFull,
                sidebarWidthCompact = config.SidebarWidthCompact,
                sidebarWidthHidden = config.SidebarWidthHidden
            });
        }
    }
}