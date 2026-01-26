using System.ComponentModel.DataAnnotations;

namespace planera_ledighet.api
{
    public class DtoAbsenceType
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Label { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;

    }

    public class DtoGroup
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public List<DtoResource> Resources { get; set; } = new();
    }

    public class DtoResource
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public string GroupId { get; set; } = string.Empty;
    }

    public class DtoLeaveItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public int DurationDays { get; set; }
        public string Color { get; set; } = string.Empty;
        public string RowId { get; set; } = string.Empty;
        public string AbsenceTypeId { get; set; } = string.Empty;
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
