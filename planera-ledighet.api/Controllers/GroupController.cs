using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GroupController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GroupController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Group
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DtoGroup>>> GetGroups()
        {
            var groups = await _context.Groups
                .Include(g => g.Resources)
                .ToListAsync();

            return groups.Select(g => new DtoGroup
            {
                Id = g.Id,
                Name = g.Name,
                Resources = g.Resources.Select(r => new DtoResource
                {
                    Id = r.Id,
                    Name = r.Name,
                    GroupId = r.GroupId
                }).ToList()
            }).ToList();
        }

        // POST: api/Group
        [HttpPost]
        public async Task<ActionResult<DtoGroup>> CreateGroup(DtoGroup dto)
        {
            var entity = new Group
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name
            };

            _context.Groups.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            dto.Resources = new List<DtoResource>();

            return Ok(dto);
        }

        // PUT: api/Group/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGroup(string id, DtoGroup dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.Groups.FindAsync(id);
            if (entity == null)
                return NotFound($"Group with ID {id} not found.");

            entity.Name = dto.Name;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Group/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGroup(string id)
        {
            var entity = await _context.Groups.FindAsync(id);
            if (entity == null)
                return NotFound();

            if (await _context.Resources.AnyAsync(r => r.GroupId == id))
                return BadRequest("Cannot delete group: it still has resources.");

            _context.Groups.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
