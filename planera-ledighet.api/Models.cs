using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography.X509Certificates;

namespace planera_ledighet.api
{
    public class AbsenceCategory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Label { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public List<Absence> Absences { get; set; } = new();
    }

    public class Team
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;

        public List<Employee> Employees { get; set; } = new();
    }

    public class Employee
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;

        public string TeamId { get; set; } = string.Empty;
        public Team Team { get; set; }

        public List<Absence> Absences { get; set; } = new();
    }

    public class Absence
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string EmployeeId { get; set; } = string.Empty;
        public Employee Employee { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int DurationDays { get; set; }
        public string AbsenceCategoryId { get; set; } = string.Empty;
        public AbsenceCategory AbsenceCategory { get; set; }
        public AbsenceStatus Status { get; set; } = AbsenceStatus.Pending;
        public string? RejectionReason { get; set; }
    }

    public enum AbsenceStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2
    }
    public class UiConfig
    {
        public int Id { get; set; }
        public bool BlockPastDays { get; set; }
        public bool DisableDeletion { get; set; }
        public int CellWidth { get; set; }
        public int RowHeight { get; set; }
        public int SidebarWidthFull { get; set; }
        public int SidebarWidthCompact { get; set; }
        public int SidebarWidthHidden { get; set; }
    }
}
