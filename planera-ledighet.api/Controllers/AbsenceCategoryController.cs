using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AbsenceCategoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AbsenceCategoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/AbsenceCategory
        [HttpGet("/api/AbsenceCategorys")]
        public async Task<ActionResult<IEnumerable<DtoAbsenceCategory>>> GetAbsenceCategorys()
        {
            var items = await _context.AbsenceCategorys
                .Select(x => new DtoAbsenceCategory
                {
                    Id = x.Id,
                    Label = x.Label,
                    Color = x.Color
                })
                .ToListAsync();

            return items;
        }

        // POST: api/AbsenceCategory
        [HttpPost]
        public async Task<ActionResult<DtoAbsenceCategory>> CreateAbsenceCategory(DtoAbsenceCategory dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Label))
                return BadRequest("Label is required.");

            var entity = new AbsenceCategory
            {
                Id = Guid.NewGuid().ToString(),
                Label = dto.Label,
                Color = dto.Color
            };

            _context.AbsenceCategorys.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            return CreatedAtAction(nameof(GetAbsenceCategorys), new { id = entity.Id }, dto);
        }

        // PUT: api/AbsenceCategory/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateType(string id, DtoAbsenceCategory dto)
        {
            var entity = await _context.AbsenceCategorys.FindAsync(id);
            if (entity == null)
                return NotFound($"No absence type with ID {id}");

            entity.Label = dto.Label;
            entity.Color = dto.Color;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/AbsenceCategory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteType(string id)
        {
            var entity = await _context.AbsenceCategorys.FindAsync(id);
            if (entity == null)
                return NotFound();

            // Optional: block delete if referenced
            if (await _context.Absences.AnyAsync(l => l.AbsenceCategoryId == id))
                return BadRequest("Cannot delete: AbsenceCategory is in use.");

            _context.AbsenceCategorys.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
