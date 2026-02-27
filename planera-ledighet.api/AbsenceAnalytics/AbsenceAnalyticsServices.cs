namespace planera_ledighet.api.AbsenceAnalytics
{
    public class AbsenceTypeAnalyticsDto
    {
        public string AbsenceType { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int UniqueEmployees { get; set; }
        public int TotalEvents { get; set; }
        public int TotalDays { get; set; }
        public List<AbsenceTypeTeamDto> Teams { get; set; } = new();
    }

    public class AbsenceTypeTeamDto
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public int Employees { get; set; }
        public int TotalDays { get; set; }
    }

    public class EmployeeAnalyticsDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public int TotalDays { get; set; }
        public int TotalEvents { get; set; }
        public List<EmployeeAbsenceTypeDto> Types { get; set; } = new();
        public int LongestStreakDays { get; set; }
    }

    public class EmployeeAbsenceTypeDto
    {
        public string Type { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Days { get; set; }
        public int Events { get; set; }
    }

    public class HolidayAnalyticsDto
    {
        public string HolidayName { get; set; } = string.Empty;
        public int AbsentEmployees { get; set; }
        public List<HolidayTeamDto> AbsentPerTeam { get; set; } = new();
        public int NotAbsentEmployees { get; set; }
        public int TotalHolidayAbsenceDays { get; set; }
    }

    public class HolidayTeamDto
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class TeamAnalyticsDto
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public int TeamSize { get; set; }
        public int TotalDays { get; set; }
        public double AverageDaysPerEmployee { get; set; }
        public string MostCommonType { get; set; } = string.Empty;
        public List<HighAbsenceEmployeeDto> HighAbsenceEmployees { get; set; } = new();
    }

    public class HighAbsenceEmployeeDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public int Days { get; set; }
    }

    public class DailyLoadDto
    {
        public DateTime Date { get; set; }
        public int AbsentEmployees { get; set; }
        public int AvailableEmployees { get; set; }
        public List<DailyLoadTeamDto> Teams { get; set; } = new();
    }

    public class DailyLoadTeamDto
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public int AbsentCount { get; set; }
    }

    public class TrendDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int TotalDays { get; set; }
        public int TotalEvents { get; set; }
        public List<TrendTypeDto> Types { get; set; } = new();
    }

    public class TrendTypeDto
    {
        public string Type { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Days { get; set; }
    }

    public class ZeroAbsenceEmployeeDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
    }

    public class UpcomingAbsenceDto
    {
        public DateTime Date { get; set; }
        public List<UpcomingEmployeeDto> Employees { get; set; } = new();
        public List<UpcomingTeamDto> Teams { get; set; } = new();
    }

    public class UpcomingEmployeeDto
    {
        public string EmployeeId { get; set; } = string.Empty;
        public string EmployeeName { get; set; } = string.Empty;
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
    }

    public class UpcomingTeamDto
    {
        public string TeamId { get; set; } = string.Empty;
        public string TeamName { get; set; } = string.Empty;
        public int AbsentCount { get; set; }
    }


    public class AbsenceAnalyticsServices
    {

        public class FixedHolidays
        {
            private readonly List<HolidayPeriod> _holidays = new()
            {
                new("Christmas", new DateTime(DateTime.Now.Year, 12, 23), new DateTime(DateTime.Now.Year, 12, 27)),
                new("Easter", new DateTime(DateTime.Now.Year, 4, 3), new DateTime(DateTime.Now.Year, 4, 6)),
                new("Midsummer", new DateTime(DateTime.Now.Year, 6, 20), new DateTime(DateTime.Now.Year, 6, 22))
            };

            public HolidayPeriod? Get(string name) =>
                _holidays.FirstOrDefault(h => h.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
        }

        public record HolidayPeriod(string Name, DateTime Start, DateTime End);

    }
}
