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
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                DurationDays = l.DurationDays,
                Color = l.AbsenceCategory.Color,
                EmployeeId = l.EmployeeId,
                AbsenceCategoryId = l.AbsenceCategoryId,
                Status= l.Status,
                RejectionReason = l.RejectionReason

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
                StartDate = l.StartDate,
                EndDate = l.EndDate,
                DurationDays = l.DurationDays,
                Color = l.AbsenceCategory.Color,
                EmployeeId = l.EmployeeId,
                AbsenceCategoryId = l.AbsenceCategoryId,
                Status = l.Status,
                RejectionReason = l.RejectionReason
            };
        }

        // POST: api/Absence
        [HttpPost]
        public async Task<ActionResult<DtoAbsence>> CreateAbsence(DtoAbsence dto)
        {

            // target ID is null here because we are creating
            var (_, overlap) = await Helper.GetAbsenceState(_context.Absences, null, dto.EmployeeId, dto.StartDate, dto.DurationDays);

            if (overlap != null)
                return Conflict(new { message = "Det finns redan en bokning här." });

            var entity = new Absence
            {
                Id = dto.Id,
                EmployeeId = dto.EmployeeId,
                StartDate = dto.StartDate,
                DurationDays = dto.DurationDays,
                EndDate = dto.EndDate,
                AbsenceCategoryId = dto.AbsenceCategoryId,
                Status = dto.Status ,
                RejectionReason = dto.RejectionReason
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

            var (target, overlap) = await Helper.GetAbsenceState(
                _context.Absences,
                id,
                dto.EmployeeId,
                dto.StartDate,
                dto.DurationDays
            );

            if (target == null)
                return NotFound(new { message = "Frånvaron hittades inte." });

            if (overlap != null)
                return Conflict(new
                {
                    message = $"Krockar med {overlap.AbsenceCategory?.Label ?? "annan frånvaro"}.",
                    overlapId = overlap.Id
                });

            var startDateChanged = target.StartDate.Date != dto.StartDate.Date;
            var durationChanged = target.DurationDays != dto.DurationDays;
            var datesChanged = startDateChanged || durationChanged;

            if (target.Status == AbsenceStatus.Rejected && datesChanged)
            {
                target.Status = AbsenceStatus.Pending;
                target.RejectionReason = null;
            }

            target.StartDate = dto.StartDate;
            target.DurationDays = dto.DurationDays;
            target.EndDate = dto.StartDate.AddDays(dto.DurationDays - 1);
            target.EmployeeId = dto.EmployeeId;
            target.AbsenceCategoryId = dto.AbsenceCategoryId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                target.Id,
                target.EmployeeId,
                target.StartDate,
                target.EndDate,
                target.DurationDays,
                target.AbsenceCategoryId,
                target.Status,
                target.RejectionReason
            });
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

        // POST: api/Absence/{id}
        [HttpPost("change-absence-status")]
        public async Task<IActionResult> ChangeAbsenceStatus(ChangeAbsenceStatusDto dto )
        {
            var entity = await _context.Absences.FindAsync(dto.Id);
            if (entity == null)
                return NotFound();

            switch (dto.Status)
            {
                case AbsenceStatus.Pending:
                    entity.Status = dto.Status;
                    break;
                case AbsenceStatus.Approved:
                    entity.Status = dto.Status;
                    break;
                case AbsenceStatus.Rejected:
                    entity.Status = dto.Status;
                    entity.RejectionReason = dto.RejectionReason;
                    break;
                default:
                    break;
            }

            await _context.SaveChangesAsync();

            return Ok(entity);
        }
    }
}
