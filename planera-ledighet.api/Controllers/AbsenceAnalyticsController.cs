using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using planera_ledighet.api.AbsenceAnalytics;
using static planera_ledighet.api.AbsenceAnalytics.AbsenceAnalyticsServices;

namespace planera_ledighet.api;

[ApiController]
[Route("api/analytics")]
public class AbsenceAnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly FixedHolidays _holidays;

    public AbsenceAnalyticsController(AppDbContext db, FixedHolidays holidays)
    {
        _db = db;
        _holidays = holidays;
    }

    private static AbsenceCategory SafeCategory(AbsenceCategory? c) =>
        c ?? new AbsenceCategory { Id = "unknown", Label = "Unknown", Color = "#999" };

    private static Team SafeTeam(Team? t) =>
        t ?? new Team { Id = "unknown", Name = "Unknown" };

    private static Employee SafeEmployee(Employee? e) =>
        e ?? new Employee { Id = "unknown", Name = "Unknown", Team = SafeTeam(null) };

    private static int SafeDays(int? d) => d is > 0 ? d.Value : 0;

    // ------------------------------------------------------------
    // 1. ABSENCE TYPE DISTRIBUTION
    // ------------------------------------------------------------
    [HttpGet("absence-types")]
    public async Task<ActionResult<IEnumerable<AbsenceTypeAnalyticsDto>>> GetAbsenceTypes()
    {
        var absences = await _db.Absences
            .Include(a => a.Employee).ThenInclude(e => e.Team)
            .Include(a => a.AbsenceCategory)
            .ToListAsync();

        var result = absences
            .GroupBy(a => SafeCategory(a.AbsenceCategory))
            .Select(g => new AbsenceTypeAnalyticsDto
            {
                AbsenceType = g.Key.Label,
                Color = g.Key.Color,
                UniqueEmployees = g.Select(x => x.EmployeeId).Distinct().Count(),
                TotalEvents = g.Count(),
                TotalDays = g.Sum(x => SafeDays(x.DurationDays)),
                Teams = g.GroupBy(x => SafeTeam(x.Employee?.Team))
                         .Select(t => new AbsenceTypeTeamDto
                         {
                             TeamId = t.Key.Id,
                             TeamName = t.Key.Name,
                             Employees = t.Select(x => x.EmployeeId).Distinct().Count(),
                             TotalDays = t.Sum(x => SafeDays(x.DurationDays))
                         }).ToList()
            })
            .ToList();

        return Ok(result);
    }

    // ------------------------------------------------------------
    // 2. EMPLOYEE SUMMARY
    // ------------------------------------------------------------
    [HttpGet("employees")]
    public async Task<ActionResult<IEnumerable<EmployeeAnalyticsDto>>> GetEmployees()
    {
        var absences = await _db.Absences
            .Include(a => a.Employee).ThenInclude(e => e.Team)
            .Include(a => a.AbsenceCategory)
            .ToListAsync();

        var result = absences
            .GroupBy(a => SafeEmployee(a.Employee))
            .Select(g => new EmployeeAnalyticsDto
            {
                EmployeeId = g.Key.Id,
                EmployeeName = g.Key.Name,
                TeamId = SafeTeam(g.Key.Team).Id,
                TeamName = SafeTeam(g.Key.Team).Name,
                TotalDays = g.Sum(x => SafeDays(x.DurationDays)),
                TotalEvents = g.Count(),
                Types = g.GroupBy(x => SafeCategory(x.AbsenceCategory))
                         .Select(t => new EmployeeAbsenceTypeDto
                         {
                             Type = t.Key.Label,
                             Color = t.Key.Color,
                             Days = t.Sum(x => SafeDays(x.DurationDays)),
                             Events = t.Count()
                         }).ToList(),
                LongestStreakDays = g.Max(x => SafeDays(x.DurationDays))
            })
            .ToList();

        return Ok(result);
    }

    // ------------------------------------------------------------
    // 3. HOLIDAY ANALYSIS
    // ------------------------------------------------------------
    [HttpGet("holidays/{holidayName}")]
    public async Task<ActionResult<HolidayAnalyticsDto>> GetHoliday(string holidayName)
    {
        var holiday = _holidays.Get(holidayName);
        if (holiday == null)
            return NotFound("Holiday not found");

        var absences = await _db.Absences
            .Include(a => a.Employee).ThenInclude(e => e.Team)
            .ToListAsync();

        var allEmployees = await _db.Employees.Include(e => e.Team).ToListAsync();

        var absentDuringHoliday = absences
            .Where(a => a.StartDate <= holiday.End && a.EndDate >= holiday.Start)
            .ToList();

        var result = new HolidayAnalyticsDto
        {
            HolidayName = holiday.Name,
            AbsentEmployees = absentDuringHoliday
                .Select(a => a.EmployeeId)
                .Distinct()
                .Count(),

            AbsentPerTeam = absentDuringHoliday
                .GroupBy(a => SafeTeam(a.Employee?.Team))
                .Select(g => new HolidayTeamDto
                {
                    TeamId = g.Key.Id,
                    TeamName = g.Key.Name,
                    Count = g.Select(x => x.EmployeeId).Distinct().Count()
                }).ToList(),

            NotAbsentEmployees = allEmployees
                .Where(e => !absentDuringHoliday.Any(a => a.EmployeeId == e.Id))
                .Count(),

            TotalHolidayAbsenceDays = absentDuringHoliday.Sum(a => SafeDays(a.DurationDays))
        };

        return Ok(result);
    }

    // ------------------------------------------------------------
    // 4. TEAM HEALTH
    // ------------------------------------------------------------
    [HttpGet("teams")]
    public async Task<ActionResult<IEnumerable<TeamAnalyticsDto>>> GetTeams()
    {
        var teams = await _db.Teams.Include(t => t.Employees).ToListAsync();
        var absences = await _db.Absences
            .Include(a => a.Employee).ThenInclude(e => e.Team)
            .Include(a => a.AbsenceCategory)
            .ToListAsync();

        var result = teams.Select(team =>
        {
            var teamAbsences = absences
                .Where(a => a.Employee?.TeamId == team.Id)
                .ToList();

            return new TeamAnalyticsDto
            {
                TeamId = team.Id,
                TeamName = team.Name,
                TeamSize = team.Employees.Count,
                TotalDays = teamAbsences.Sum(a => SafeDays(a.DurationDays)),
                AverageDaysPerEmployee = team.Employees.Count == 0
                    ? 0
                    : teamAbsences.Sum(a => SafeDays(a.DurationDays)) / (double)team.Employees.Count,
                MostCommonType = teamAbsences
                    .GroupBy(a => SafeCategory(a.AbsenceCategory).Label)
                    .OrderByDescending(g => g.Count())
                    .Select(g => g.Key)
                    .FirstOrDefault() ?? "None",
                HighAbsenceEmployees = teamAbsences
                    .GroupBy(a => SafeEmployee(a.Employee))
                    .Select(g => new HighAbsenceEmployeeDto
                    {
                        EmployeeId = g.Key.Id,
                        EmployeeName = g.Key.Name,
                        Days = g.Sum(x => SafeDays(x.DurationDays))
                    })
                    .OrderByDescending(x => x.Days)
                    .Take(5)
                    .ToList()
            };
        }).ToList();

        return Ok(result);
    }

    // ------------------------------------------------------------
    // 5. DAILY LOAD
    // ------------------------------------------------------------
    [HttpGet("daily-load")]
    public async Task<ActionResult<IEnumerable<DailyLoadDto>>> GetDailyLoad(
        [FromQuery] DateTime start,
        [FromQuery] DateTime end)
    {
        var absences = await _db.Absences
            .Include(a => a.Employee).ThenInclude(e => e.Team)
            .ToListAsync();

        var employees = await _db.Employees.Include(e => e.Team).ToListAsync();

        var days = Enumerable.Range(0, (end - start).Days + 1)
            .Select(offset => start.AddDays(offset));

        var result = days.Select(date =>
        {
            var absent = absences
                .Where(a => a.StartDate <= date && a.EndDate >= date)
                .ToList();

            return new DailyLoadDto
            {
                Date = date,
                AbsentEmployees = absent.Count,
                AvailableEmployees = employees.Count - absent.Count,
                Teams = absent
                    .GroupBy(a => SafeTeam(a.Employee?.Team))
                    .Select(g => new DailyLoadTeamDto
                    {
                        TeamId = g.Key.Id,
                        TeamName = g.Key.Name,
                        AbsentCount = g.Count()
                    }).ToList()
            };
        }).ToList();

        return Ok(result);
    }

    // ------------------------------------------------------------
    // 6. TRENDS
    // ------------------------------------------------------------
    [HttpGet("trends")]
    public async Task<ActionResult<IEnumerable<TrendDto>>> GetTrends()
    {
        var absences = await _db.Absences
            .Include(a => a.AbsenceCategory)
            .ToListAsync();

        var result = absences
            .GroupBy(a => new { a.StartDate.Year, a.StartDate.Month })
            .Select(g => new TrendDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                TotalDays = g.Sum(x => SafeDays(x.DurationDays)),
                TotalEvents = g.Count(),
                Types = g.GroupBy(x => SafeCategory(x.AbsenceCategory))
                         .Select(t => new TrendTypeDto
                         {
                             Type = t.Key.Label,
                             Color = t.Key.Color,
                             Days = t.Sum(x => SafeDays(x.DurationDays))
                         }).ToList()
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToList();

        return Ok(result);
    }

    // ------------------------------------------------------------
    // 7. ZERO ABSENCE EMPLOYEES
    // ------------------------------------------------------------
    [HttpGet("zero-absence")]
    public async Task<ActionResult<IEnumerable<ZeroAbsenceEmployeeDto>>> GetZeroAbsence()
    {
        var employees = await _db.Employees.Include(e => e.Team).ToListAsync();
        var absences = await _db.Absences.ToListAsync();

        var zero = employees
            .Where(e => !absences.Any(a => a.EmployeeId == e.Id))
            .Select(e => new ZeroAbsenceEmployeeDto
            {
                EmployeeId = e.Id,
                EmployeeName = e.Name,
                TeamId = SafeTeam(e.Team).Id,
                TeamName = SafeTeam(e.Team).Name
            })
            .ToList();

        return Ok(zero);
    }

    // ------------------------------------------------------------
    // 8. UPCOMING ABSENCES
    // ------------------------------------------------------------
    [HttpGet("upcoming")]
    public async Task<ActionResult<IEnumerable<UpcomingAbsenceDto>>> GetUpcoming([FromQuery] int days = 30)
    {
        var today = DateTime.Today;
        var end = today.AddDays(days);

        var absences = await _db.Absences
            .Include(a => a.Employee).ThenInclude(e => e.Team)
            .Where(a => a.StartDate <= end && a.EndDate >= today)
            .ToListAsync();

        var result = absences
            .GroupBy(a => a.StartDate.Date)
            .Select(g => new UpcomingAbsenceDto
            {
                Date = g.Key,
                Employees = g.Select(a => new UpcomingEmployeeDto
                {
                    EmployeeId = SafeEmployee(a.Employee).Id,
                    EmployeeName = SafeEmployee(a.Employee).Name,
                    TeamId = SafeTeam(a.Employee?.Team).Id,
                    TeamName = SafeTeam(a.Employee?.Team).Name
                }).ToList(),
                Teams = g.GroupBy(a => SafeTeam(a.Employee?.Team))
                         .Select(t => new UpcomingTeamDto
                         {
                             TeamId = t.Key.Id,
                             TeamName = t.Key.Name,
                             AbsentCount = t.Count()
                         }).ToList()
            })
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(result);
    }
}
