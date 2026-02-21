using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace planera_ledighet.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/employees
        [HttpGet("/api/employees")]
        public async Task<ActionResult<IEnumerable<DtoEmployee>>> GetEmployees()
        {
            var items = await _context.Employees.ToListAsync();

            return items.Select(r => new DtoEmployee
            {
                Id = r.Id,
                Name = r.Name,
                TeamId = r.TeamId
            }).ToList();
        }

        // POST: api/employee
        [HttpPost]
        public async Task<ActionResult<DtoEmployee>> CreateEmployee(DtoEmployee dto)
        {
            var entity = new Employee
            {
                Id = Guid.NewGuid().ToString(),
                Name = dto.Name,
                TeamId = dto.TeamId
            };

            _context.Employees.Add(entity);
            await _context.SaveChangesAsync();

            dto.Id = entity.Id;
            return Ok(dto);
        }

        // PUT: api/employee/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(string id, DtoEmployee dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.Employees.FindAsync(id);
            if (entity == null)
                return NotFound();

            entity.Name = dto.Name;
            entity.TeamId = dto.TeamId;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/employee/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(string id)
        {
            var entity = await _context.Employees.FindAsync(id);
            if (entity == null)
                return NotFound();

            _context.Employees.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
