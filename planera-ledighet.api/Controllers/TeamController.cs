using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamController : ControllerBase
    {

        private readonly AppDbContext _context;

        public TeamController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Team
        [HttpGet("/api/teams")]
        public async Task<ActionResult<IEnumerable<DtoTeam>>> GetTeams()
        {
            var groups = await _context.Teams
                .Include(g => g.Employees)
                .ToListAsync();

            return groups.Select(g => new DtoTeam
            {
                Id = g.Id,
                Name = g.Name,
                Employees = g.Employees.Select(r => new DtoEmployee
                {
                    Id = r.Id,
                    Name = r.Name,
                    TeamId = r.TeamId
                }).ToList()
            }).ToList();
        }

        // POST: api/Team
        [HttpPost]
        public async Task<ActionResult<DtoTeam>> CreateTeam(DtoTeam dto)
        {
            var entity = new Team
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name
            };

            _context.Teams.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            dto.Employees = new List<DtoEmployee>();

            return Ok(dto);
        }

        // PUT: api/Team/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTeam(string id, DtoTeam dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.Teams.FindAsync(id);
            if (entity == null)
                return NotFound($"Team with ID {id} not found.");

            entity.Name = dto.Name;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Team/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeam(string id)
        {
            var entity = await _context.Teams.FindAsync(id);
            if (entity == null)
                return NotFound();

            if (await _context.Employees.AnyAsync(r => r.TeamId == id))
                return BadRequest("Cannot delete group: it still has resources.");

            _context.Teams.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
