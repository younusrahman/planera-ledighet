using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeavesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeavesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/leaves
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DtoLeaveItem>>> GetLeaves()
        {
            var items = await _context.LeaveItems
                .Include(l => l.Resource)
                .Include(l => l.AbsenceType)
                .ToListAsync();

            return items.Select(l => new DtoLeaveItem
            {
                Id = l.Id,
                Name = l.Resource.Name,
                StartDate = l.StartDate,
                DurationDays = l.DurationDays,
                Color = l.AbsenceType.Color,
                RowId = l.RowId,
                AbsenceTypeId = l.AbsenceTypeId
            }).ToList();
        }

        // GET: api/leaves/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<DtoLeaveItem>> GetLeaveItem(string id)
        {
            var l = await _context.LeaveItems
                .Include(x => x.Resource)
                .Include(x => x.AbsenceType)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (l == null)
                return NotFound();

            return new DtoLeaveItem
            {
                Id = l.Id,
                Name = l.Resource.Name,
                StartDate = l.StartDate,
                DurationDays = l.DurationDays,
                Color = l.AbsenceType.Color,
                RowId = l.RowId,
                AbsenceTypeId = l.AbsenceTypeId
            };
        }

        // POST: api/leaves
        [HttpPost]
        public async Task<ActionResult<DtoLeaveItem>> CreateLeave(DtoLeaveItem dto)
        {
            if (string.IsNullOrEmpty(dto.Id))
                dto.Id = "l-" + Guid.NewGuid().ToString().Substring(0, 8);

            var entity = new LeaveItem
            {
                Id = dto.Id,
                ResourceId = dto.RowId, // your frontend uses RowId as resource row
                StartDate = dto.StartDate,
                DurationDays = dto.DurationDays,
                EndDate = dto.StartDate.AddDays(dto.DurationDays),
                RowId = dto.RowId,
                AbsenceTypeId = dto.AbsenceTypeId
            };

            _context.LeaveItems.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLeaveItem), new { id = entity.Id }, dto);
        }

        // PUT: api/leaves/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeave(string id, DtoLeaveItem dto)
        {
            if (id != dto.Id)
                return BadRequest();

            var entity = await _context.LeaveItems.FindAsync(id);
            if (entity == null)
                return NotFound();

            entity.StartDate = dto.StartDate;
            entity.DurationDays = dto.DurationDays;
            entity.EndDate = dto.StartDate.AddDays(dto.DurationDays);
            entity.RowId = dto.RowId;
            entity.AbsenceTypeId = dto.AbsenceTypeId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/leaves/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeave(string id)
        {
            var entity = await _context.LeaveItems.FindAsync(id);
            if (entity == null)
                return NotFound();

            _context.LeaveItems.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
