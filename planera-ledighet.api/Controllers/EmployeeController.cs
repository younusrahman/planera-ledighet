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
        public async Task<ActionResult<DtoEmployee>> CreateEmployee(string teamId, string name)
        {
            // Validate teamId
            if (string.IsNullOrWhiteSpace(teamId))
                return BadRequest("TeamId is required.");

            var team = await _context.Teams.FindAsync(teamId);
            if (team == null)
                return BadRequest("Team does not exist.");

            // Validate name
            if (string.IsNullOrWhiteSpace(name))
                return BadRequest("Name is required.");

            // Create emp
            var entity = new Employee
            {
                Id = Guid.NewGuid().ToString(),
                Name = name,
                TeamId = teamId
            };

            _context.Employees.Add(entity);
            await _context.SaveChangesAsync();

            // Return DTO
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

            var emp = await _context.Employees.FindAsync(id);
            var team = await _context.Teams.FindAsync(dto.TeamId);
            if (emp == null || team == null)
                return NotFound($"Employee or team ID not found.");

            emp.Name = dto.Name;
            emp.TeamId = dto.TeamId;

            await _context.SaveChangesAsync();

            return Ok(new DtoEmployee
            {
                Id = emp.Id,
                Name = emp.Name,
                TeamId = emp.TeamId
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
