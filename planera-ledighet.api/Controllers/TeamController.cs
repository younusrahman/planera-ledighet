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

        // GET: api/teams
        [HttpGet("/api/teams")]
        public async Task<ActionResult<IEnumerable<DtoTeam>>> GetTeams()
        {
            var teams = await _context.Teams.ToListAsync();

            return teams.Select(t => new DtoTeam
            {
                Id = t.Id,
                Name = t.Name
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

            var createdDto = new DtoTeam
            {
                Id = entity.Id,
                Name = entity.Name
            };

            return Ok(createdDto);
        }

        // PUT: api/Team/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<DtoTeam>> UpdateTeam(string id, DtoTeam dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.Teams.FindAsync(id);
            if (entity == null)
                return NotFound($"Team with ID {id} not found.");

            entity.Name = dto.Name;

            await _context.SaveChangesAsync();

            var updatedDto = new DtoTeam
            {
                Id = entity.Id,
                Name = entity.Name
            };

            return Ok(updatedDto);
        }

        // DELETE: api/Team/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTeam(string id)
        {
            var entity = await _context.Teams.FindAsync(id);
            if (entity == null)
                return NotFound();

            if (await _context.Employees.AnyAsync(e => e.TeamId == id))
                return BadRequest("Cannot delete team: it still has employees.");

            _context.Teams.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
