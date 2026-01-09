using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResourceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ResourceController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/resource
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DtoResource>>> GetResources()
        {
            var items = await _context.Resources.ToListAsync();

            return items.Select(r => new DtoResource
            {
                Id = r.Id,
                Name = r.Name,
                GroupId = r.GroupId
            }).ToList();
        }

        // POST: api/resource
        [HttpPost]
        public async Task<ActionResult<DtoResource>> CreateResource(DtoResource dto)
        {
            var entity = new Resource
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                GroupId = dto.GroupId
            };

            _context.Resources.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            return Ok(dto);
        }

        // PUT: api/resource/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateResource(string id, DtoResource dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.Resources.FindAsync(id);
            if (entity == null)
                return NotFound();

            entity.Name = dto.Name;
            entity.GroupId = dto.GroupId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/resource/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResource(string id)
        {
            var entity = await _context.Resources.FindAsync(id);
            if (entity == null)
                return NotFound();

            _context.Resources.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
