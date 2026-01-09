using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography.X509Certificates;

namespace planera_ledighet.api
{
    public class AbsenceType
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Label { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;

        public List<LeaveItem> LeaveItems { get; set; } = new();
    }

    public class Group
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;

        public List<Resource> Resources { get; set; } = new();
    }

    public class Resource
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = string.Empty;

        // Foreign key to Group
        public string GroupId { get; set; } = string.Empty;
        public Group Group { get; set; }

        public List<LeaveItem> LeaveItems { get; set; } = new();
    }

    public class LeaveItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string ResourceId { get; set; } = string.Empty;
        public Resource Resource { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int DurationDays { get; set; }

        public string RowId { get; set; } = string.Empty;

        // Foreign key to AbsenceType
        public string AbsenceTypeId { get; set; } = string.Empty;
        public AbsenceType AbsenceType { get; set; }
    }

}
