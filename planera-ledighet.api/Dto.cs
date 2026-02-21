using System.ComponentModel.DataAnnotations;

namespace planera_ledighet.api
{
    public class DtoAbsenceCategory
    {
        public string Id { get; set; }
        public string Label { get; set; }
        public string Color { get; set; }
    }


    public class DtoTeam
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    public class DtoEmployee
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string TeamId { get; set; }
    }



    public class DtoAbsence
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
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
