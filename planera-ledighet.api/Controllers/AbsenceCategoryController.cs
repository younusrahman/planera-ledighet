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

        // GET: api/AbsenceCategorys
        [HttpGet("/api/absenceCategorys")]
        public async Task<ActionResult<IEnumerable<DtoAbsenceCategory>>> GetAbsenceCategories()
        {
            var categories = await _context.AbsenceCategorys.ToListAsync();

            return categories.Select(c => new DtoAbsenceCategory
            {
                Id = c.Id,
                Label = c.Label,
                Color = c.Color
            }).ToList();
        }

        // POST: api/AbsenceCategory
        [HttpPost]
        public async Task<ActionResult<DtoAbsenceCategory>> CreateAbsenceCategory(DtoAbsenceCategory dto)
        {
            if(dto.Id is not null) BadRequest("ID should not be given.");

            var entity = new AbsenceCategory
            {
                Id = Guid.NewGuid().ToString(),
                Label = dto.Label,
                Color = dto.Color
            };

            _context.AbsenceCategorys.Add(entity);
            await _context.SaveChangesAsync();

            return Ok(new DtoAbsenceCategory
            {
                Id = entity.Id,
                Label = entity.Label,
                Color = entity.Color
            });
        }

        // PUT: api/AbsenceCategory/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<DtoAbsenceCategory>> UpdateAbsenceCategory(string id, DtoAbsenceCategory dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.AbsenceCategorys.FindAsync(id);
            if (entity == null)
                return NotFound($"Absence category with ID {id} not found.");

            entity.Label = dto.Label;
            entity.Color = dto.Color;

            await _context.SaveChangesAsync();

            return Ok(new DtoAbsenceCategory
            {
                Id = entity.Id,
                Label = entity.Label,
                Color = entity.Color
            });
        }

        // DELETE: api/AbsenceCategory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAbsenceCategory(string id)
        {
            var entity = await _context.AbsenceCategorys.FindAsync(id);
            if (entity == null)
                return NotFound();

            _context.AbsenceCategorys.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
