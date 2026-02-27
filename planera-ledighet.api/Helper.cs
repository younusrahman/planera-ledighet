using Microsoft.EntityFrameworkCore;

namespace planera_ledighet.api
{
    public static class Helper
    {
        public static async Task<(Absence? Target, Absence? Overlap)> GetAbsenceState(IQueryable<Absence> absences, string? id, string employeeId, DateTime start, int duration)
        {

            DateTime end = start.AddDays(duration);

            var items = await absences
                .Include(a => a.AbsenceCategory)
                .Where(a => a.Id == id || a.EmployeeId == employeeId)
                .ToListAsync();

            var target = items.FirstOrDefault(a => a.Id == id);
            var overlap = items.FirstOrDefault(a =>
                a.Id != id &&
                a.StartDate < end &&
                a.StartDate.AddDays(a.DurationDays) > start);

            return (target, overlap);
        }
    }
}
