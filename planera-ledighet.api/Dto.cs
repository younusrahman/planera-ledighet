using System.ComponentModel.DataAnnotations;

namespace planera_ledighet.api
{
    public class DtoAbsenceCategory
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Label { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;

    }

    public class DtoTeam
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public List<DtoEmployee> Employees { get; set; } = new();
    }

    public class DtoEmployee
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string TeamId { get; set; } = string.Empty;
    }

    public class DtoAbsence
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public int DurationDays { get; set; }
        public string Color { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string AbsenceCategoryId { get; set; } = string.Empty;
    }
    public class DbDeleteStatus
    {
        public bool DbDeleted { get; set; }
        public bool ShmDeleted { get; set; }
        public bool WalDeleted { get; set; }
        public string Message { get; set; } = "";
    }
    public class DbOperationStatus
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public string? BackupFile { get; set; }
    }


}
