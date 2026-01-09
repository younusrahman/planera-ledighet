using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AbsenceTypeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AbsenceTypeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/AbsenceType
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DtoAbsenceType>>> GetTypes()
        {
            var items = await _context.AbsenceTypes
                .Select(x => new DtoAbsenceType
                {
                    Id = x.Id,
                    Label = x.Label,
                    Color = x.Color
                })
                .ToListAsync();

            return items;
        }

        // POST: api/AbsenceType
        [HttpPost]
        public async Task<ActionResult<DtoAbsenceType>> CreateType(DtoAbsenceType dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Label))
                return BadRequest("Label is required.");

            var entity = new AbsenceType
            {
                Id = Guid.NewGuid().ToString(),
                Label = dto.Label,
                Color = dto.Color
            };

            _context.AbsenceTypes.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            return CreatedAtAction(nameof(GetTypes), new { id = entity.Id }, dto);
        }

        // PUT: api/AbsenceType/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateType(string id, DtoAbsenceType dto)
        {
            var entity = await _context.AbsenceTypes.FindAsync(id);
            if (entity == null)
                return NotFound($"No absence type with ID {id}");

            entity.Label = dto.Label;
            entity.Color = dto.Color;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/AbsenceType/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteType(string id)
        {
            var entity = await _context.AbsenceTypes.FindAsync(id);
            if (entity == null)
                return NotFound();

            // Optional: block delete if referenced
            if (await _context.LeaveItems.AnyAsync(l => l.AbsenceTypeId == id))
                return BadRequest("Cannot delete: AbsenceType is in use.");

            _context.AbsenceTypes.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
