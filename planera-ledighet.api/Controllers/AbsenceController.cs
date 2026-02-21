using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AbsenceController : ControllerBase
    {

        private readonly AppDbContext _context;

        public AbsenceController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Absences
        [HttpGet("/api/absences")]
        public async Task<ActionResult<IEnumerable<DtoAbsence>>> GetAbsences()
        {
            var items = await _context.Absences
                .Include(l => l.Employee)
                .Include(l => l.AbsenceCategory)
                .ToListAsync();

            return items.Select(l => new DtoAbsence
            {
                Id = l.Id,
                Name = l.Employee.Name,
                StartDate = l.StartDate,
                DurationDays = l.DurationDays,
                Color = l.AbsenceCategory.Color,
                EmployeeId = l.EmployeeId,
                AbsenceCategoryId = l.AbsenceCategoryId
            }).ToList();
        }

        // GET: api/Absence/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<DtoAbsence>> GetAbsence(string id)
        {
            var l = await _context.Absences
                .Include(x => x.Employee)
                .Include(x => x.AbsenceCategory)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (l == null)
                return NotFound();

            return new DtoAbsence
            {
                Id = l.Id,
                Name = l.Employee.Name,
                StartDate = l.StartDate,
                DurationDays = l.DurationDays,
                Color = l.AbsenceCategory.Color,
                EmployeeId = l.EmployeeId,
                AbsenceCategoryId = l.AbsenceCategoryId
            };
        }

        // POST: api/Absence
        [HttpPost]
        public async Task<ActionResult<DtoAbsence>> CreateAbsence(DtoAbsence dto)
        {
            if (string.IsNullOrEmpty(dto.Id))
                dto.Id = "l-" + Guid.NewGuid().ToString().Substring(0, 8);

            var entity = new Absence
            {
                Id = dto.Id,
                EmployeeId = dto.EmployeeId, // your frontend uses EmployeeId as resource row
                StartDate = dto.StartDate,
                DurationDays = dto.DurationDays,
                EndDate = dto.StartDate.AddDays(dto.DurationDays),
                AbsenceCategoryId = dto.AbsenceCategoryId
            };

            _context.Absences.Add(entity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAbsence), new { id = entity.Id }, dto);
        }

        // PUT: api/Absence/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAbsence(string id, DtoAbsence dto)
        {
            if (id != dto.Id)
                return BadRequest();

            var entity = await _context.Absences.FindAsync(id);
            if (entity == null)
                return NotFound();

            entity.StartDate = dto.StartDate;
            entity.DurationDays = dto.DurationDays;
            entity.EndDate = dto.StartDate.AddDays(dto.DurationDays);
            entity.EmployeeId = dto.EmployeeId;
            entity.AbsenceCategoryId = dto.AbsenceCategoryId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Absence/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAbsence(string id)
        {
            var entity = await _context.Absences.FindAsync(id);
            if (entity == null)
                return NotFound();

            _context.Absences.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
