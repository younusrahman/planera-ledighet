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
            var employees = await _context.Employees.ToListAsync();

            return employees.Select(e => new DtoEmployee
            {
                Id = e.Id,
                Name = e.Name,
                TeamId = e.TeamId
            }).ToList();
        }

        // POST: api/Employee
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

            return Ok(new DtoEmployee
            {
                Id = entity.Id,
                Name = entity.Name,
                TeamId = entity.TeamId
            });
        }

        // PUT: api/Employee/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<DtoEmployee>> UpdateEmployee(string id, DtoEmployee dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var entity = await _context.Employees.FindAsync(id);
            if (entity == null)
                return NotFound($"Employee with ID {id} not found.");

            entity.Name = dto.Name;
            entity.TeamId = dto.TeamId;

            await _context.SaveChangesAsync();

            return Ok(new DtoEmployee
            {
                Id = entity.Id,
                Name = entity.Name,
                TeamId = entity.TeamId
            });
        }

        // DELETE: api/Employee/{id}
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
